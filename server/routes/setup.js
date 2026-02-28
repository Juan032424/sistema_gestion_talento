const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /setup/create-tables
 * Endpoint para crear tablas sin necesidad de ejecutar scripts
 */
router.get('/create-tables', async (req, res) => {
    // ... (existing code, keep it commented out or copied if needed, but I'll overwrite)
    // Actually, I should append or replace the whole file. 
    // I will rewrite the whole file to include the debug endpoint.
    console.log('🚀 Iniciando creación de tablas de tracking...');

    // ... (same implementation as before)
    const tables = [];
    const results = { created: [], errors: [], existing: [] };

    try {
        // ... (same table creation logic)
        // I will copy the previous logic here concisely

        // 1. candidate_activity_logs
        console.log('📋 Creando tabla candidate_activity_logs...');
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS candidate_activity_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT NOT NULL,
                    activity_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    related_id INT NULL,
                    metadata JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_candidate (candidate_id),
                    INDEX idx_type (activity_type),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            results.created.push('candidate_activity_logs');
        } catch (error) {
            if (error.message.includes('already exists')) results.existing.push('candidate_activity_logs');
            else throw error;
        }

        // 2. candidate_notifications
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS candidate_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_account_id INT,
                    email VARCHAR(255),
                    application_id INT,
                    tipo VARCHAR(50),
                    titulo VARCHAR(255),
                    mensaje TEXT,
                    action_url VARCHAR(500),
                    leida BOOLEAN DEFAULT FALSE,
                    fecha_leida DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_candidate (candidate_account_id),
                    INDEX idx_email (email),
                    INDEX idx_leida (leida)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            results.created.push('candidate_notifications');
        } catch (error) {
            if (error.message.includes('already exists')) results.existing.push('candidate_notifications');
            else throw error;
        }

        // 3. public_job_postings
        const [tables] = await pool.query(`SHOW TABLES LIKE 'public_job_postings'`);
        if (tables.length === 0) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS public_job_postings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vacante_id INT NOT NULL UNIQUE,
                    is_public BOOLEAN DEFAULT TRUE,
                    is_featured BOOLEAN DEFAULT FALSE,
                    slug VARCHAR(255) UNIQUE,
                    meta_description TEXT,
                    keywords TEXT,
                    views_count INT DEFAULT 0,
                    applications_count INT DEFAULT 0,
                    shares_count INT DEFAULT 0,
                    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NULL,
                    INDEX idx_slug (slug),
                    INDEX idx_public (is_public),
                    INDEX idx_featured (is_featured)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            results.created.push('public_job_postings');
        } else {
            results.existing.push('public_job_postings');
        }

        const [candidateAccountsTables] = await pool.query(`SHOW TABLES LIKE 'candidate_accounts'`);
        if (candidateAccountsTables.length === 0) {
            results.errors.push('⚠️ candidate_accounts no existe');
        } else {
            results.existing.push('candidate_accounts');
        }

        res.json({ success: true, summary: results, message: 'Tablas configuradas' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /setup/check-tables
 */
router.get('/check-tables', async (req, res) => {
    try {
        const requiredTables = ['candidate_activity_logs', 'candidate_notifications', 'candidate_accounts', 'public_job_postings'];
        const status = {}; // ... (same logic)
        for (const tableName of requiredTables) {
            const [tables] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
            status[tableName] = { exists: tables.length > 0 };
            if (tables.length > 0) {
                const [count] = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
                status[tableName].records = count[0].total;
            }
        }
        res.json({ success: true, tables: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /setup/debug-logs
 * Muestra los últimos logs para depuración
 */
router.get('/debug-logs', async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT * FROM candidate_activity_logs ORDER BY created_at DESC LIMIT 20
        `);

        const [users] = await pool.query(`
            SELECT id, email, nombre FROM candidate_accounts ORDER BY created_at DESC LIMIT 5
        `);

        res.json({
            meta: {
                total_logs: logs.length,
                total_users: users.length
            },
            recent_logs: logs,
            recent_users: users
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

module.exports = router;
