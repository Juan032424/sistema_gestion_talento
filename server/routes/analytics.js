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
                AVG(ev.puntaje_calidad) as quality_score
            FROM vacantes v
            LEFT JOIN evaluacion_servicio_gh ev ON ev.vacante_id = v.id
            WHERE v.estado = 'Cubierta'
            GROUP BY v.id, v.puesto_nombre, v.fecha_cierre_real, v.fecha_apertura
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
                IFNULL(cal.unique_candidate_views, 0) as unique_candidate_views,
                IFNULL(cal.saves_count, 0) as saves_count,
                IFNULL(cal.intent_to_apply_count, 0) as intent_to_apply_count
            FROM vacantes v
            JOIN public_job_postings pjp ON v.id = pjp.vacante_id
            LEFT JOIN (
                SELECT 
                    related_id,
                    COUNT(DISTINCT CASE WHEN activity_type = 'VIEW_JOB' THEN candidate_id END) as unique_candidate_views,
                    SUM(CASE WHEN activity_type = 'SAVE_JOB' THEN 1 ELSE 0 END) as saves_count,
                    SUM(CASE WHEN activity_type = 'START_APPLICATION' THEN 1 ELSE 0 END) as intent_to_apply_count
                FROM candidate_activity_logs
                WHERE activity_type IN ('VIEW_JOB', 'SAVE_JOB', 'START_APPLICATION')
                GROUP BY related_id
            ) cal ON v.id = cal.related_id
            WHERE v.estado IN ('Abierta', 'En Proceso')
            ORDER BY (pjp.views_count + (IFNULL(cal.unique_candidate_views, 0) * 2) + (IFNULL(cal.intent_to_apply_count, 0) * 5)) DESC
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
