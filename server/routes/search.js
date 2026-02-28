const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ vacantes: [], candidatos: [] });

    try {
        const searchTerm = `%${q}%`;

        // Search Vacancies
        const [vacantes] = await pool.query(`
            SELECT id, puesto_nombre as label, codigo_requisicion as sublabel, 'vacante' as type 
            FROM vacantes 
            WHERE puesto_nombre LIKE ? OR codigo_requisicion LIKE ? OR responsable_rh LIKE ?
            LIMIT 5
        `, [searchTerm, searchTerm, searchTerm]);

        // Search Candidates
        const [candidatos] = await pool.query(`
            SELECT id, nombre_candidato as label, etapa_actual as sublabel, 'candidato' as type 
            FROM candidatos_seguimiento 
            WHERE nombre_candidato LIKE ? OR fuente_reclutamiento LIKE ?
            LIMIT 5
        `, [searchTerm, searchTerm]);

        res.json({
            results: [...vacantes, ...candidatos]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
