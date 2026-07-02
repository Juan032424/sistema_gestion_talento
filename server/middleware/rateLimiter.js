const rateLimit = require('express-rate-limit');

// 1. Limiter general para todas las rutas API
const globalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, // Límite de 500 peticiones por IP cada 15 min
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

// 2. Limiter para rutas de Autenticación (Previene Brute-Force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Incrementado a 100 intentos en desarrollo para pruebas de login
    message: { error: 'Demasiados intentos de acceso. Por favor, espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Limiter extremo para Magic Links públicos (Tracking)
const trackingPublicLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 15, // Max 15 consultas de tracking por IP para evitar fuerza bruta de adivinación de tokens
    message: { error: 'Límite de consultas excedido. Tu IP ha sido bloqueada temporalmente por seguridad.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalApiLimiter,
    authLimiter,
    trackingPublicLimiter
};
