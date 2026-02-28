const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// ===================================
// 🔐 CANDIDATE AUTHENTICATION UTILITIES
// Sistema de autenticación para candidatos
// ===================================

const JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d'; // Token dura 30 días
const SALT_ROUNDS = 10;

/**
 * Generar hash de contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('❌ Error hashing password:', error);
        throw new Error('Error al encriptar contraseña');
    }
}

/**
 * Verificar contraseña
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} true si coincide
 */
async function verifyPassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('❌ Error verifying password:', error);
        return false;
    }
}

/**
 * Generar JWT token para candidato
 * @param {object} candidate - Datos del candidato
 * @returns {string} JWT token
 */
function generateToken(candidate) {
    const payload = {
        id: candidate.id,
        email: candidate.email,
        nombre: candidate.nombre,
        tipo: 'candidate', // Importante: distinguir de usuarios admin
        timestamp: Date.now()
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'gh-score-pro',
        audience: 'candidate-portal'
    });
}

/**
 * Verificar JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Payload decodificado o null si es inválido
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'gh-score-pro',
            audience: 'candidate-portal'
        });

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('⏰ Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('❌ Token inválido');
        }
        return null;
    }
}

/**
 * Generar token de verificación de email
 * @returns {string} Token único
 */
function generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generar token de recuperación de contraseña
 * @returns {string} Token único
 */
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generar tracking token para aplicaciones
 * @returns {string} Token único
 */
function generateTrackingToken() {
    return crypto.randomBytes(20).toString('hex');
}

/**
 * Calcular fecha de expiración (por defecto 24 horas)
 * @param {number} hours - Horas de validez
 * @returns {Date} Fecha de expiración
 */
function generateExpirationDate(hours = 24) {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
}

/**
 * Validar fortaleza de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una mayúscula');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una minúscula');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('La contraseña debe contener al menos un número');
    }

    // Opcional: caracteres especiales
    // if (!/[!@#$%^&*]/.test(password)) {
    //     errors.push('La contraseña debe contener al menos un carácter especial');
    // }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitizar nombre (remover caracteres especiales)
 * @param {string} name - Nombre a sanitizar
 * @returns {string} Nombre sanitizado
 */
function sanitizeName(name) {
    if (!name) return '';
    return name
        .trim()
        .replace(/[<>]/g, '') // Prevenir XSS
        .replace(/\s+/g, ' '); // Normalizar espacios
}

/**
 * Extraer IP del request
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown';
}

/**
 * Extraer User Agent del request
 * @param {object} req - Express request object
 * @returns {string} User agent
 */
function getUserAgent(req) {
    return req.headers['user-agent'] || 'unknown';
}

module.exports = {
    // Password handling
    hashPassword,
    verifyPassword,
    validatePassword,

    // JWT tokens
    generateToken,
    verifyToken,

    // Verification tokens
    generateEmailVerificationToken,
    generateResetToken,
    generateTrackingToken,
    generateExpirationDate,

    // Validation
    validateEmail,
    sanitizeName,

    // Request helpers
    getClientIP,
    getUserAgent
};
