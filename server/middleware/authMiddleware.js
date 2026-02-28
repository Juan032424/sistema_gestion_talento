const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'gh_score_secret_key_2026'; // Should be in .env

// 1. Verify Token & Extract Tenant Context
const verifyToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // { id, email, role, tenantId, ... }
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid Token' });
    }
};

// 2. Enforce Role Access
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access Forbidden: Role missing' });
        }

        const userRole = req.user.role; // e.g., 'Superadmin', 'Lider'

        // Superadmin bypass
        if (userRole === 'Superadmin') return next();

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ error: `Access Forbidden: Requires one of [${allowedRoles.join(', ')}]` });
        }
    };
};

// 3. Automated Isolation Middleware (Optional but powerful)
// Injects checks to ensure query/body params match the authenticated tenant
const enforceTenantIsolation = (req, res, next) => {
    if (req.user.role === 'Superadmin') return next(); // God mode

    // If user tries to send tenant_id in body, ensure it matches their own
    if (req.body.tenant_id && req.body.tenant_id !== req.user.tenantId) {
        return res.status(403).json({ error: 'Security Violation: Cross-Tenant Data Injection Attempt' });
    }

    // Force inject tenant_id into body for creation operations
    if (req.method === 'POST' || req.method === 'PUT') {
        req.body.tenant_id = req.user.tenantId;
    }

    next();
};

module.exports = {
    verifyToken,
    requireRole,
    enforceTenantIsolation,
    JWT_SECRET
};
