const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// ================================================================
// POST /api/auth/login — Admin Panel Login Only
// No hay registro público; los usuarios son creados manualmente
// ================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // 1. Find User and verify they are an internal/admin user
        const [users] = await pool.query(`
            SELECT u.*, r.name as role_name, t.name as tenant_name, t.config_json
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.email = ? AND u.status = 'active'
        `, [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];

        // 2. Block candidate logins — only admin roles allowed
        const adminRoles = ['Superadmin', 'Admin', 'Lider', 'Reclutador'];
        if (!adminRoles.includes(user.role_name)) {
            return res.status(403).json({ error: 'Acceso denegado. Solo el equipo administrativo puede ingresar.' });
        }

        // 3. Verify Password (plain text comparison — upgrade to bcrypt when deploying in production)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 4. Generate JWT Payload with Tenant Context
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role_name,
            tenantId: user.tenant_id,
            tenantName: user.tenant_name
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // 5. Return Token + User Info
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role_name
            },
            tenant: {
                id: user.tenant_id,
                name: user.tenant_name,
                branding: user.config_json // { primary_color, logo... }
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Error del servidor. Intenta de nuevo.' });
    }
});

// Note: Public registration endpoint removed.
// Users are created manually by Superadmin/Admin via the admin panel.

module.exports = router;
