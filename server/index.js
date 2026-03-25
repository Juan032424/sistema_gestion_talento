const dotenv = require('dotenv');
const path = require('path');
// Use __dirname + override:true to ALWAYS load from server/.env regardless of PM2's CWD
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const vacantesRoutes = require('./routes/vacantes');
const candidatosRoutes = require('./routes/candidatos');
const empresasRouter = require('./routes/empresas');
const sedesRouter = require('./routes/sedes');
const configRouter = require('./routes/config');
const analyticsRouter = require('./routes/analytics');
const searchRouter = require('./routes/search');
const sourcingRouter = require('./routes/sourcing');
const intelligenceRouter = require('./routes/intelligence');
const applicationsRouter = require('./routes/applications');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { verifyToken, requireRole } = require('./middleware/authMiddleware');

// Agent Imports
const analystAgent = require('./agents/analystAgent');
const sourcingAgent = require('./agents/sourcingAgent');



const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Logger Middleware
app.use(requestLogger);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidate-auth', require('./routes/candidateAuth')); // Autenticación de candidatos (LEGACY)
app.use('/api/candidates', require('./routes/candidates')); // 🆕 Sistema completo de candidatos
app.use('/api/tracking', require('./routes/tracking')); // Tracking con links mágicos
app.use('/api/vacantes', vacantesRoutes);
app.use('/api/candidatos', candidatosRoutes);
app.use('/api/empresas', empresasRouter);
app.use('/api/sedes', sedesRouter);
app.use('/api/config', configRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);
app.use('/api/sourcing', sourcingRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/users', require('./routes/users'));
app.use('/api/setup', require('./routes/setup')); // 🛠️ Setup utilities
app.use('/api/apply', require('./routes/apply'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/evaluations', require('./routes/evaluations'));

// 🌐 Portal público de postulación (SIN AUTH)


// New Agent & Referral Routes
app.get('/api/agents/logs', verifyToken, requireRole(['Superadmin']), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM agent_logs ORDER BY performed_at DESC LIMIT 50');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/referidos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const isAdmin = ['Superadmin', 'Admin'].includes(req.user.role);

        let query = 'SELECT * FROM referidos ORDER BY created_at DESC';
        let params = [];

        if (!isAdmin) {
            query = 'SELECT * FROM referidos WHERE referrer_email = ? ORDER BY created_at DESC';
            params = [userEmail];
        }

        const [rows] = await pool.query(query, params);

        // Calculate stats
        const stats = {
            total: rows.length,
            points: rows.reduce((acc, curr) => acc + (curr.recruiter_points || 0), 0),
            hired: rows.filter(r => r.status === 'Hired').length
        };

        // Leaderboard (Top 5 referrers by points)
        const [leaderboard] = await pool.query(`
            SELECT referrer_name as name, SUM(recruiter_points) as points 
            FROM referidos 
            GROUP BY referrer_email, referrer_name 
            ORDER BY points DESC 
            LIMIT 5
        `);

        res.json({
            referrals: rows,
            stats,
            leaderboard
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/referidos', verifyToken, async (req, res) => {
    const { candidate_name, candidate_contact, vacancy_id } = req.body;
    try {
        const [result] = await pool.query(`
            INSERT INTO referidos (referrer_name, referrer_email, candidate_name, candidate_contact, vacancy_id, status, recruiter_points)
            VALUES (?, ?, ?, ?, ?, 'Pending', 100)
        `, [req.user.fullName, req.user.email, candidate_name, candidate_contact, vacancy_id]);

        res.json({ success: true, id: result.insertId, message: 'Referido registrado con éxito (100 puntos iniciales)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger Sourcing Agent for a vacancy
app.post('/api/agents/sourcing/trigger', async (req, res) => {
    const { vacancyId } = req.body;
    try {
        // Run in background
        sourcingAgent.runAutonomousSearch(vacancyId);
        res.json({ message: 'Sourcing agent triggered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basic health check
app.get('/', (req, res) => {
    res.send('Sistema de Gestión de Talento API v3.0 Running');
});

// Catalog routes
app.get('/api/procesos', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM procesos');
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Simple Orchestration: Run financial audit every 1 hour (simulated for 1 min for demo if needed, but 1h is safer)
    setInterval(() => {
        console.log("Background Task: Running Financial Analyst Agent...");
        analystAgent.calculateVacancyCosts();
    }, 1000 * 60 * 60); // 1 hour
});
