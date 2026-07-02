const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const auditService = require('../services/AuditService');
const { encryptPayload, decryptPayload } = require('../utils/cryptoHelper');
const bcrypt = require('bcrypt');

// ================================================================
// POST /api/auth/login — Admin Panel Login Only
// No hay registro público; los usuarios son creados manualmente
// ================================================================
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body; // email es el "Usuario" ingresado

        if (!email || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        let authenticatedExternally = false;
        let externalUserData = null;

        // 1. Intentar validar credenciales con el Sistema Padre (SIGAE) si está configurado
        const sigaeUrl = process.env.SIGAE_EXTERNAL_AUTH_URL;
        const sigaeAppId = process.env.SIGAE_EXTERNAL_AUTH_APP_ID;
        const sigaeApiKey = process.env.SIGAE_EXTERNAL_AUTH_API_KEY;
        const sigaeEncKey = process.env.SIGAE_EXTERNAL_AUTH_ENCRYPTION_KEY;

        if (sigaeUrl && sigaeAppId && sigaeApiKey && sigaeEncKey) {
            try {
                // Ciframos las credenciales de entrada
                const credentialsPayload = encryptPayload({ username: email, password }, sigaeEncKey);

                // Llamamos al API del Sistema Padre
                const response = await fetch(sigaeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': sigaeApiKey
                    },
                    body: JSON.stringify({
                        appId: sigaeAppId,
                        payload: credentialsPayload
                    })
                });

                if (response.ok) {
                    const body = await response.json();
                    if (body.success && body.data && body.data.payload) {
                        // Desciframos la respuesta exitosa de SIGAE
                        const decryptedData = decryptPayload(body.data.payload, sigaeEncKey);
                        if (decryptedData.status === 'authenticated') {
                            authenticatedExternally = true;
                            externalUserData = decryptedData;
                        }
                    }
                } else if (response.status === 403) {
                    const body = await response.json();
                    return res.status(403).json({ error: body.message || 'Tu usuario se encuentra inactivo en el sistema.' });
                }
            } catch (externalAuthError) {
                console.error('⚠️ Fallo en conexión con API de SIGAE externa, procediendo con validación local:', externalAuthError.message);
            }
        }

        let user;

        if (authenticatedExternally && externalUserData) {
            // 2. Si se autenticó con éxito en el sistema padre, buscamos su registro en GH-SCORE
            const [users] = await pool.query(`
                SELECT u.*, r.name as role_name, t.name as tenant_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                JOIN tenants t ON u.tenant_id = t.id
                WHERE u.email = ?
            `, [email]);

            if (users.length === 0) {
                // JIT Provisioning: Registramos automáticamente al usuario como inactivo
                const defaultRole = 4; // Rol 'Reclutador' temporal
                const defaultTenant = '11111111-1111-1111-1111-111111111111'; // DISCOL SAS
                const cleanName = email.charAt(0).toUpperCase() + email.slice(1);
                const hashedPassword = await bcrypt.hash(password, 10);

                await pool.query(`
                    INSERT INTO users (tenant_id, email, password_hash, full_name, role_id, status, cedula)
                    VALUES (?, ?, ?, ?, ?, 'inactive', ?)
                `, [defaultTenant, email, hashedPassword, externalUserData.nombreCompleto || cleanName, defaultRole, externalUserData.cedula || null]);

                console.log(`[SSO Login] Auto-registrado usuario externo: ${email} en estado inactivo.`);

                return res.status(403).json({ 
                    error: 'Tu cuenta ha sido registrada en el sistema, pero se encuentra inactiva. Solicita al administrador de GH-SCORE que asigne tu rol y active tu cuenta.' 
                });
            }

            user = users[0];

            if (user.status === 'inactive') {
                return res.status(403).json({ 
                    error: 'Tu usuario se encuentra en estado inactivo. Solicita al administrador de GH-SCORE que active tu cuenta y configure tus roles.' 
                });
            }

            // Sincronizar contraseña local y datos del sistema padre si cambiaron
            let needsUpdate = false;
            let updateFields = [];
            let updateParams = [];

            let isPassMatch = false;
            try {
                isPassMatch = await bcrypt.compare(password, user.password_hash);
            } catch (e) {
                isPassMatch = false;
            }

            if (!isPassMatch && user.password_hash === password) {
                isPassMatch = true;
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push('password_hash = ?');
                updateParams.push(hashedPassword);
                user.password_hash = hashedPassword;
                needsUpdate = true;
            } else if (!isPassMatch) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push('password_hash = ?');
                updateParams.push(hashedPassword);
                user.password_hash = hashedPassword;
                needsUpdate = true;
            }
            if (externalUserData.cedula && user.cedula !== externalUserData.cedula) {
                updateFields.push('cedula = ?');
                updateParams.push(externalUserData.cedula);
                user.cedula = externalUserData.cedula;
                needsUpdate = true;
            }
            if (externalUserData.nombreCompleto && user.full_name !== externalUserData.nombreCompleto) {
                updateFields.push('full_name = ?');
                updateParams.push(externalUserData.nombreCompleto);
                user.full_name = externalUserData.nombreCompleto;
                needsUpdate = true;
            }

            if (needsUpdate) {
                updateParams.push(user.id);
                await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
                console.log(`[SSO Login] Sincronizados datos locales para el usuario externo: ${email}.`);
            }

        } else {
            // 3. Fallback Local: Buscar localmente en GH-SCORE si la validación externa falló
            const [localUsers] = await pool.query(`
                SELECT u.*, r.name as role_name, t.name as tenant_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                JOIN tenants t ON u.tenant_id = t.id
                WHERE u.email = ?
            `, [email]);

            if (localUsers.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            user = localUsers[0];

            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(password, user.password_hash);
            } catch (e) {
                isMatch = false;
            }

            if (!isMatch && user.password_hash === password) {
                isMatch = true;
                try {
                    const hashed = await bcrypt.hash(password, 10);
                    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, user.id]);
                    console.log(`[Bcrypt] Auto-migrated plain text password for local user ${email}`);
                } catch (migrateErr) {
                    console.error('Failed to auto-migrate local password:', migrateErr.message);
                }
            }

            if (!isMatch) {
                await auditService.log(
                    user.id,
                    email,
                    'auth',
                    user.id,
                    'FAILED_LOGIN',
                    { ip: req.ip, reason: 'Invalid password' },
                    req.ip
                );
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            if (user.status === 'inactive') {
                return res.status(403).json({ error: 'Tu usuario se encuentra en estado inactivo.' });
            }
        }

        // 4. Bloquear logins de roles no administrativos
        const adminRoles = ['Superadmin', 'Admin', 'Lider', 'Reclutador'];
        if (!adminRoles.includes(user.role_name)) {
            return res.status(403).json({ error: 'Acceso denegado. Solo el equipo administrativo puede ingresar.' });
        }

        // Registrar auditoría
        await auditService.log(
            user.id,
            email,
            'auth',
            user.id,
            'LOGIN',
            { ip: req.ip, role: user.role_name, externalAuth: authenticatedExternally },
            req.ip
        );

        // 5. Generar JWT Payload
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role_name,
            tenantId: user.tenant_id,
            tenantName: user.tenant_name
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // 6. Retornar datos exitosos
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role_name,
                avatarUrl: user.avatar_url
            },
            tenant: {
                id: user.tenant_id,
                name: user.tenant_name
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: error.message || 'Error del servidor. Intenta de nuevo.' });
    }
});

// Note: Public registration endpoint removed.
// Users are created manually by Superadmin/Admin via the admin panel.

module.exports = router;
