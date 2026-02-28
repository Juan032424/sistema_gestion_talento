const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, tipo, titulo, mensaje, leida, created_at as fecha FROM notifications WHERE user_type = 'admin' ORDER BY created_at DESC LIMIT 20"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_type = 'admin' AND leida = 0"
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notifications/mark-read
router.post('/mark-read', verifyToken, async (req, res) => {
    try {
        await pool.query(
            "UPDATE notifications SET leida = 1, fecha_leida = NOW() WHERE user_type = 'admin' AND leida = 0"
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
