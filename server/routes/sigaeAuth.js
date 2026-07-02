const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { encryptPayload, decryptPayload } = require('../utils/cryptoHelper');
const auditService = require('../services/AuditService');

/**
 * Comparación segura contra ataques de temporización de canal lateral.
 * @param {string} a 
 * @param {string} b 
 * @returns {boolean}
 */
const timingSafeCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

// Diccionario de credenciales del Sistema Padre (SIGAE) para desarrollo y simulación
const parentCredentials = {
    "comercial": { password: "29discol01", cedula: "1000000001", full_name: "Usuario Comercial" },
    "contabilidad": { password: "30discol02", cedula: "1000000002", full_name: "Usuario Contabilidad" },
    "logistica": { password: "32discol03", cedula: "1000000003", full_name: "Usuario Logistica" },
    "nomina": { password: "31discol04", cedula: "1000000004", full_name: "Usuario Nomina" },
    "sistemas": { password: "33discol05", cedula: "1000000005", full_name: "Usuario Sistemas" },
    "ghumana": { password: "34discol06", cedula: "1000000006", full_name: "Usuario Gestion Humana" },
    "tesoreria": { password: "35discol07", cedula: "1000000007", full_name: "Usuario Tesoreria" },
    "hseq": { password: "36discol08", cedula: "1000000008", full_name: "Usuario HSEQ" }
};

// ================================================================
// POST /api/sigae/auth/external-login — External Encrypted Authentication
// ================================================================
router.post('/external-login', async (req, res) => {
    try {
        const apiKeyHeader = req.headers['x-api-key'];
        const { appId, payload } = req.body;

        // 1. Validar que existan appId, payload y header x-api-key
        if (!appId || !payload || !apiKeyHeader) {
            return res.status(400).json({
                success: false,
                code: 400,
                data: null,
                message: "Missing appId, payload, or x-api-key header"
            });
        }

        // 2. Buscar appId en EXTERNAL_AUTH_CLIENTS
        let clients = {};
        try {
            clients = JSON.parse(process.env.EXTERNAL_AUTH_CLIENTS || '{}');
        } catch (e) {
            console.error('Error parsing EXTERNAL_AUTH_CLIENTS:', e.message);
            return res.status(503).json({
                success: false,
                code: 503,
                data: null,
                message: "External authentication client configuration error"
            });
        }

        const clientConfig = clients[appId];

        // 3. Rechazar si el cliente no existe o está deshabilitado
        if (!clientConfig || clientConfig.enabled === false) {
            return res.status(401).json({
                success: false,
                code: 401,
                data: null,
                message: "External application is not authorized"
            });
        }

        // 4. Comparar x-api-key con apiKey usando comparación segura
        const isApiKeyValid = timingSafeCompare(apiKeyHeader, clientConfig.apiKey);
        if (!isApiKeyValid) {
            return res.status(401).json({
                success: false,
                code: 401,
                data: null,
                message: "External application is not authorized"
            });
        }

        // 5 & 6 & 7. Decodificar payload desde base64, validar iv/tag/data, y descifrar
        let decryptedData;
        try {
            decryptedData = decryptPayload(payload, clientConfig.encryptionKey);
        } catch (error) {
            console.error('Decryption error:', error.message);
            return res.status(400).json({
                success: false,
                code: 400,
                data: null,
                message: "Invalid, incomplete, or non-decryptable payload"
            });
        }

        const { username, password } = decryptedData;

        // 8. Validar que el JSON descifrado tenga username y password
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                code: 400,
                data: null,
                message: "Missing username or password inside the payload"
            });
        }

        // Normalizar nombre de usuario para buscarlo en el diccionario de pruebas (por ejemplo ghumana@discolsas.com -> ghumana)
        const lookupUsername = username.includes('@') ? username.split('@')[0] : username;

        let authenticatedUser = null;

        // 9. Reutilizar el servicio de login existente
        if (parentCredentials.hasOwnProperty(lookupUsername)) {
            // Caso A: Es un usuario del sistema padre simulado
            const parentUser = parentCredentials[lookupUsername];
            if (parentUser.password === password) {
                authenticatedUser = {
                    email: username,
                    cedula: parentUser.cedula,
                    full_name: parentUser.full_name,
                    status: 'active' // Los usuarios en el sistema padre se asumen activos
                };
            }
        } else {
            // Caso B: Es un usuario nativo de GH-SCORE, lo buscamos en la base de datos local
            const [dbUsers] = await pool.query(`
                SELECT u.*
                FROM users u
                WHERE u.email = ?
            `, [username]);

            if (dbUsers.length > 0) {
                const dbUser = dbUsers[0];
                if (dbUser.password_hash === password) {
                    authenticatedUser = {
                        email: dbUser.email,
                        cedula: dbUser.cedula,
                        full_name: dbUser.full_name,
                        status: dbUser.status
                    };
                }
            }
        }

        // Si no coincide con ninguna credencial
        if (!authenticatedUser) {
            console.log(`[SIGAE DEBUG] Falló autenticación para usuario '${username}'. Contraseña provista: '${password}'. ¿Existe en diccionario?: ${parentCredentials.hasOwnProperty(lookupUsername)}`);
            return res.status(401).json({
                success: false,
                code: 401,
                data: null,
                message: "Invalid user credentials"
            });
        }

        // Si el usuario está inactivo en el sistema origen, retornar 403 en claro
        if (authenticatedUser.status === 'inactive') {
            return res.status(403).json({
                success: false,
                code: 403,
                data: null,
                message: "Tu usuario se encuentra en estado inactivo en el sistema origen."
            });
        }

        // 10. Consultar el nombre completo en la tabla empleados usando la cedula
        let nombreCompleto = null;
        if (authenticatedUser.cedula) {
            try {
                // Consulta recomendada con CONCAT_WS
                const [empleadoRows] = await pool.query(`
                    SELECT TRIM(CONCAT_WS(' ', nombres, apellidos)) AS nombreCompleto
                    FROM empleados
                    WHERE cedula = ?
                    LIMIT 1
                `, [authenticatedUser.cedula]);

                if (empleadoRows.length > 0) {
                    nombreCompleto = empleadoRows[0].nombreCompleto;
                }
            } catch (queryErr) {
                console.warn('⚠️ Falló consulta CONCAT_WS en empleados, reintentando con columna nombre:', queryErr.message);
                try {
                    const [empleadoRows] = await pool.query(`
                        SELECT nombre
                        FROM empleados
                        WHERE cedula = ?
                        LIMIT 1
                    `, [authenticatedUser.cedula]);

                    if (empleadoRows.length > 0) {
                        nombreCompleto = empleadoRows[0].nombre;
                    }
                } catch (fallbackErr) {
                    console.error('❌ Error al consultar empleados en fallback:', fallbackErr.message);
                    nombreCompleto = null; // Si no existe empleado asociado, responder nombreCompleto como null
                }
            }
        }

        // Si no se encontró en empleados, usamos el full_name del usuario autenticado como fallback
        if (!nombreCompleto) {
            nombreCompleto = authenticatedUser.full_name || null;
        }

        // 11. Construir la respuesta funcional y cifrarla antes de responder
        const tokenPayload = {
            email: authenticatedUser.email,
            cedula: authenticatedUser.cedula
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        const successfulData = {
            status: "authenticated",
            token: token,
            tokenType: "Bearer",
            username: authenticatedUser.email,
            cedula: authenticatedUser.cedula || null,
            nombreCompleto: nombreCompleto,
            expiresIn: 3600
        };

        const encryptedResponsePayload = encryptPayload(successfulData, clientConfig.encryptionKey);

        return res.json({
            success: true,
            code: 200,
            data: {
                payload: encryptedResponsePayload
            },
            message: "Autenticación externa procesada"
        });

    } catch (err) {
        console.error('Unexpected error in external login:', err.message);
        return res.status(500).json({
            success: false,
            code: 500,
            data: null,
            message: "An unexpected error occurred on the server"
        });
    }
});

module.exports = router;
