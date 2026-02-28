const dotenv = require('dotenv');
dotenv.config(); // ⬆️ MUST be FIRST - before any other module that reads process.env

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

// Agent Imports
const analystAgent = require('./agents/analystAgent');
const sourcingAgent = require('./agents/sourcingAgent');



const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
app.get('/api/agents/logs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM agent_logs ORDER BY performed_at DESC LIMIT 50');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/referidos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM referidos ORDER BY created_at DESC');
        res.json(rows);
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
