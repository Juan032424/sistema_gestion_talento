const { verifyToken } = require('../utils/candidateAuth');
const pool = require('../db');

/**
 * 🔐 Middleware de autenticación para candidatos
 * Verifica que el request tenga un token JWT válido
 */
async function authenticateCandidate(req, res, next) {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No se proporcionó token de autenticación',
                message: 'Por favor inicia sesión para continuar'
            });
        }

        const token = authHeader.substring(7); // Remover "Bearer "

        // Verificar token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Token inválido o expirado',
                message: 'Por favor inicia sesión nuevamente'
            });
        }

        // Verificar que es un token de candidato
        if (decoded.tipo !== 'candidate') {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Este endpoint es solo para candidatos'
            });
        }

        // Verificar que el candidato existe y está activo
        const [candidates] = await pool.query(
            'SELECT id, email, nombre, estado, email_verified FROM candidate_accounts WHERE id = ? AND estado = "Activa"',
            [decoded.id]
        );

        if (candidates.length === 0) {
            return res.status(401).json({
                error: 'Candidato no encontrado o cuenta inactiva',
                message: 'Por favor contacta al soporte'
            });
        }

        // Agregar datos del candidato al request
        req.candidate = {
            id: candidates[0].id,
            email: candidates[0].email,
            nombre: candidates[0].nombre,
            emailVerified: candidates[0].email_verified
        };

        // Actualizar última actividad (async, no bloquear)
        pool.query(
            'UPDATE candidate_accounts SET ultima_actividad = NOW() WHERE id = ?',
            [decoded.id]
        ).catch(err => console.error('Error updating last activity:', err));

        next();
    } catch (error) {
        console.error('❌ Error en authenticateCandidate:', error);
        return res.status(500).json({
            error: 'Error de autenticación',
            message: 'Error interno del servidor'
        });
    }
}

/**
 * 📧 Middleware opcional: Requerir email verificado
 */
function requireEmailVerified(req, res, next) {
    if (!req.candidate) {
        return res.status(401).json({
            error: 'No autenticado',
            message: 'Por favor inicia sesión'
        });
    }

    if (!req.candidate.emailVerified) {
        return res.status(403).json({
            error: 'Email no verificado',
            message: 'Por favor verifica tu email antes de continuar',
            requiresEmailVerification: true
        });
    }

    next();
}

/**
 * 🔓 Middleware opcional: Candidato autenticado O anónimo
 * Útil para endpoints que funcionan mejor con cuenta pero no la requieren
 */
async function optionalCandidateAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No hay token, continuar como anónimo
            req.candidate = null;
            req.isAnonymous = true;
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.tipo !== 'candidate') {
            // Token inválido, continuar como anónimo
            req.candidate = null;
            req.isAnonymous = true;
            return next();
        }

        // Token válido, cargar candidato
        const [candidates] = await pool.query(
            'SELECT id, email, nombre, email_verified FROM candidate_accounts WHERE id = ? AND estado = "Activa"',
            [decoded.id]
        );

        if (candidates.length > 0) {
            req.candidate = {
                id: candidates[0].id,
                email: candidates[0].email,
                nombre: candidates[0].nombre,
                emailVerified: candidates[0].email_verified
            };
            req.isAnonymous = false;
        } else {
            req.candidate = null;
            req.isAnonymous = true;
        }

        next();
    } catch (error) {
        console.error('❌ Error en optionalCandidateAuth:', error);
        // En caso de error, continuar como anónimo
        req.candidate = null;
        req.isAnonymous = true;
        next();
    }
}

module.exports = {
    authenticateCandidate,
    requireEmailVerified,
    optionalCandidateAuth
};
