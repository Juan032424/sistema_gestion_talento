const express = require('express');
const router = express.Router();
const pool = require('../db');

let configCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

router.get('/config-data', async (req, res) => {
    try {
        const now = Date.now();
        if (configCache && (now - lastCacheTime < CACHE_DURATION)) {
            return res.json(configCache);
        }

        const [
            [sedes],
            [procesos],
            [proyectos],
            [centros],
            [subcentros],
            [tiposTrabajo],
            [tiposProyecto]
        ] = await Promise.all([
            pool.query('SELECT * FROM sedes'),
            pool.query('SELECT * FROM procesos'),
            pool.query('SELECT * FROM proyectos'),
            pool.query('SELECT * FROM centros_costo'),
            pool.query('SELECT * FROM subcentros_costo'),
            pool.query('SELECT * FROM tipos_trabajo'),
            pool.query('SELECT * FROM tipos_proyecto')
        ]);

        configCache = {
            sedes,
            procesos,
            proyectos,
            centros,
            subcentros,
            tiposTrabajo,
            tiposProyecto
        };
        lastCacheTime = now;

        res.json(configCache);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
