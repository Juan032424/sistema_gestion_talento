const express = require('express');
const router = express.Router();
const candidateAuthService = require('../services/CandidateAuthService');

/**
 * POST /api/candidate-auth/register
 * Registro de nuevo candidato con cuenta
 */
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;

        // Validaciones
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const result = await candidateAuthService.register({
            nombre,
            email,
            telefono,
            password
        });

        res.json(result);

    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/candidate-auth/login
 * Login de candidato
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const result = await candidateAuthService.login(email, password);

        res.json(result);

    } catch (error) {
        console.error('Error in login:', error);
        res.status(401).json({ error: error.message });
    }
});

/**
 * GET /api/candidate-auth/verify/:token
 * Verificar email con token
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await candidateAuthService.verifyEmail(token);

        res.json(result);

    } catch (error) {
        console.error('Error in verify:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/candidate-auth/request-password-reset
 * Solicitar reset de contraseña
 */
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es obligatorio' });
        }

        const result = await candidateAuthService.requestPasswordReset(email);

        res.json(result);

    } catch (error) {
        console.error('Error in request password reset:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/candidate-auth/reset-password
 * Resetear contraseña con token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const result = await candidateAuthService.resetPassword(token, newPassword);

        res.json(result);

    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/candidate-auth/profile
 * Obtener perfil del candidato (requiere autenticación)
 */
router.get('/profile', authenticateCandidate, async (req, res) => {
    try {
        const candidate = await candidateAuthService.getCandidateById(req.candidateId);

        res.json({
            success: true,
            candidate
        });

    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/candidate-auth/profile
 * Actualizar perfil del candidato (requiere autenticación)
 */
router.put('/profile', authenticateCandidate, async (req, res) => {
    try {
        const result = await candidateAuthService.updateProfile(req.candidateId, req.body);

        res.json(result);

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Middleware de autenticación para candidatos
 */
function authenticateCandidate(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }

        const decoded = candidateAuthService.verifyToken(token);
        req.candidateId = decoded.candidateId;
        req.candidateEmail = decoded.email;

        next();

    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = router;
