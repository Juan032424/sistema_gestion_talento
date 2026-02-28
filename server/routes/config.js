const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/config-data', async (req, res) => {
    try {
        const [sedes] = await pool.query('SELECT * FROM sedes');
        const [procesos] = await pool.query('SELECT * FROM procesos');
        const [proyectos] = await pool.query('SELECT * FROM proyectos');
        const [centros] = await pool.query('SELECT * FROM centros_costo');
        const [subcentros] = await pool.query('SELECT * FROM subcentros_costo');
        const [tiposTrabajo] = await pool.query('SELECT * FROM tipos_trabajo');
        const [tiposProyecto] = await pool.query('SELECT * FROM tipos_proyecto');

        res.json({
            sedes,
            procesos,
            proyectos,
            centros,
            subcentros,
            tiposTrabajo,
            tiposProyecto
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
