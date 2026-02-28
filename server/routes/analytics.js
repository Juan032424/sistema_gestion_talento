const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET recruiter ranking from the new view
router.get('/ranking', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM v_ranking_reclutadores');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET SLA metrics
router.get('/sla-stats', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                CASE 
                    WHEN DATEDIFF(IFNULL(fecha_cierre_real, CURDATE()), fecha_apertura) <= dias_sla_meta THEN 'A tiempo'
                    ELSE 'Vencida'
                END as status,
                COUNT(*) as count
            FROM vacantes
            GROUP BY status
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Quality vs Speed (Scatter plot data)
router.get('/quality-speed', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                v.puesto_nombre,
                DATEDIFF(IFNULL(v.fecha_cierre_real, CURDATE()), v.fecha_apertura) as days_to_close,
                (SELECT AVG(puntaje_calidad) FROM evaluacion_servicio_gh ev WHERE ev.vacante_id = v.id) as quality_score
            FROM vacantes v
            WHERE v.estado = 'Cubierta'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Hot Vacancies (Engagement metrics)
router.get('/hot-vacancies', async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.responsable_rh,
                pjp.views_count as total_views,
                pjp.applications_count,
                (
                    SELECT COUNT(DISTINCT candidate_id) 
                    FROM candidate_activity_logs 
                    WHERE related_id = v.id AND activity_type = 'VIEW_JOB'
                ) as unique_candidate_views,
                (
                    SELECT COUNT(*) 
                    FROM candidate_activity_logs 
                    WHERE related_id = v.id AND activity_type = 'SAVE_JOB'
                ) as saves_count,
                (
                    SELECT COUNT(*) 
                    FROM candidate_activity_logs 
                    WHERE related_id = v.id AND activity_type = 'START_APPLICATION'
                ) as intent_to_apply_count
            FROM vacantes v
            JOIN public_job_postings pjp ON v.id = pjp.vacante_id
            WHERE v.estado IN ('Abierta', 'En Proceso')
            ORDER BY (pjp.views_count + (unique_candidate_views * 2) + (intent_to_apply_count * 5)) DESC
            LIMIT 10
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching hot vacancies:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
