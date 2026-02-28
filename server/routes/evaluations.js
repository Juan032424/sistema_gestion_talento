const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// ============================================================
// GET /api/evaluations/team
// Returns full performance analysis per recruiter/team member
// ============================================================
router.get('/team', verifyToken, requireRole(['Superadmin', 'Admin', 'Lider']), async (req, res) => {
    try {
        // 1. Get all team members (recruiters + lideres)
        const [users] = await pool.query(`
            SELECT u.id, u.full_name, u.email, r.name as role_name, u.created_at, u.status
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name IN ('Reclutador', 'Lider', 'Admin')
            AND u.status = 'active'
            ORDER BY r.name, u.full_name
        `);

        // 2. Get vacancies with assignment info (using responsable_rh instead of reclutador_asignado)
        const [vacantes] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.estado,
                v.fecha_apertura,
                v.fecha_cierre_estimada,
                v.fecha_cierre_real,
                v.responsable_rh as reclutador_asignado,
                v.prioridad,
                v.codigo_requisicion,
                DATEDIFF(
                    COALESCE(v.fecha_cierre_real, NOW()),
                    v.fecha_apertura
                ) as dias_proceso,
                CASE 
                    WHEN v.fecha_cierre_real IS NOT NULL AND v.fecha_cierre_real <= v.fecha_cierre_estimada THEN 'on_time'
                    WHEN v.fecha_cierre_real IS NOT NULL AND v.fecha_cierre_real > v.fecha_cierre_estimada THEN 'delayed'
                    WHEN v.fecha_cierre_real IS NULL AND NOW() > v.fecha_cierre_estimada THEN 'overdue'
                    ELSE 'in_progress'
                END as tiempo_status
            FROM vacantes v
        `);

        // 3. Get candidates linked to each vacancy (follow-up metric) using the junction table and stages
        const [candidatos] = await pool.query(`
            SELECT 
                cv.vacante_id,
                cv.estado_etapa as etapa_proceso,
                c.estado,
                v.responsable_rh as reclutador_asignado,
                cv.fecha_actualizacion,
                (SELECT MIN(fecha_inicio) FROM historial_etapas WHERE candidato_id = c.id AND vacante_id = v.id AND etapa_nombre LIKE '%Entrevista%') as fecha_primera_entrevista,
                (SELECT MIN(fecha_inicio) FROM historial_etapas WHERE candidato_id = c.id AND vacante_id = v.id AND etapa_nombre LIKE '%Oferta%') as fecha_oferta
            FROM candidato_vacante cv
            JOIN candidatos c ON cv.candidato_id = c.id
            JOIN vacantes v ON cv.vacante_id = v.id
        `);

        // 4. Applications received from sourced candidates (or regular)
        const [applications] = await pool.query(`
            SELECT 
                sc.vacante_id,
                COUNT(a.id) as total_aplicaciones
            FROM sourced_candidates a
            JOIN sourcing_campaigns sc ON a.campaign_id = sc.id
            GROUP BY sc.vacante_id
        `);
        const appMap = {};
        applications.forEach(a => { appMap[a.vacante_id] = a.total_aplicaciones; });

        // 5. Build per-user metrics
        const teamMetrics = users.map(user => {
            const myVacantes = vacantes.filter(v =>
                v.reclutador_asignado === user.full_name ||
                v.reclutador_asignado === user.email ||
                v.reclutador_asignado === String(user.id)
            );

            const cerradas = myVacantes.filter(v => v.estado === 'Cubierta');
            const abiertas = myVacantes.filter(v => v.estado !== 'Cubierta' && v.estado !== 'Cancelada');
            const canceladas = myVacantes.filter(v => v.estado === 'Cancelada');
            const vencidas = myVacantes.filter(v => v.tiempo_status === 'overdue');
            const aTiempo = cerradas.filter(v => v.tiempo_status === 'on_time');
            const tardias = cerradas.filter(v => v.tiempo_status === 'delayed');

            const promDiasCierre = cerradas.length > 0
                ? Math.round(cerradas.reduce((sum, v) => sum + (v.dias_proceso || 0), 0) / cerradas.length)
                : null;

            const myCandidatos = candidatos.filter(c =>
                c.reclutador_asignado === user.full_name ||
                c.reclutador_asignado === user.email
            );

            const conEntrevista = myCandidatos.filter(c => c.fecha_primera_entrevista).length;
            const conOferta = myCandidatos.filter(c => c.fecha_oferta).length;
            const tasaCierre = myVacantes.length > 0 ? Math.round((cerradas.length / myVacantes.length) * 100) : 0;
            const tasaEficiencia = cerradas.length > 0 ? Math.round((aTiempo.length / cerradas.length) * 100) : 0;

            // Seguimiento score (how actively updating candidates)
            const hace7dias = new Date();
            hace7dias.setDate(hace7dias.getDate() - 7);
            const actualizados = myCandidatos.filter(c =>
                c.fecha_actualizacion && new Date(c.fecha_actualizacion) >= hace7dias
            ).length;

            // Recent vacancies (last 30 days)
            const hace30dias = new Date();
            hace30dias.setDate(hace30dias.getDate() - 30);
            const vacantesMes = myVacantes.filter(v =>
                v.fecha_apertura && new Date(v.fecha_apertura) >= hace30dias
            ).length;
            const cerradasMes = cerradas.filter(v =>
                v.fecha_cierre_real && new Date(v.fecha_cierre_real) >= hace30dias
            ).length;

            // Performance score (composite 0-100)
            let score = 0;
            if (tasaCierre > 0) score += Math.min(tasaCierre * 0.4, 40);
            if (tasaEficiencia > 0) score += Math.min(tasaEficiencia * 0.3, 30);
            if (promDiasCierre !== null) {
                const diasScore = Math.max(0, 30 - Math.max(0, promDiasCierre - 15));
                score += Math.min(diasScore, 30);
            }

            return {
                id: user.id,
                nombre: user.full_name,
                email: user.email,
                rol: user.role_name,
                vacantes_total: myVacantes.length,
                vacantes_cerradas: cerradas.length,
                vacantes_abiertas: abiertas.length,
                vacantes_canceladas: canceladas.length,
                vacantes_vencidas: vencidas.length,
                vacantes_mes: vacantesMes,
                cerradas_mes: cerradasMes,
                a_tiempo: aTiempo.length,
                tardias: tardias.length,
                tasa_cierre: tasaCierre,
                tasa_eficiencia: tasaEficiencia,
                prom_dias_cierre: promDiasCierre,
                candidatos_gestionados: myCandidatos.length,
                con_entrevista: conEntrevista,
                con_oferta: conOferta,
                actualizados_semana: actualizados,
                score_desempeno: Math.round(score),
                vacantes_recientes: myVacantes.slice(-5).map(v => ({
                    id: v.id,
                    nombre: v.puesto_nombre,
                    estado: v.estado,
                    dias: v.dias_proceso,
                    tiempo_status: v.tiempo_status,
                    codigo: v.codigo_requisicion,
                    prioridad: v.prioridad
                }))
            };
        });

        res.json({ team: teamMetrics, total_members: users.length });

    } catch (error) {
        console.error('Error fetching team evaluations:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /api/evaluations/summary
// Overall team KPIs
// ============================================================
router.get('/summary', verifyToken, requireRole(['Superadmin', 'Admin', 'Lider']), async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_vacantes,
                SUM(CASE WHEN estado = 'Cubierta' THEN 1 ELSE 0 END) as total_cerradas,
                SUM(CASE WHEN estado NOT IN ('Cubierta','Cancelada') THEN 1 ELSE 0 END) as total_abiertas,
                ROUND(AVG(CASE WHEN estado = 'Cubierta' THEN DATEDIFF(fecha_cierre_real, fecha_apertura) END)) as prom_dias_cierre,
                SUM(CASE WHEN fecha_cierre_real <= fecha_cierre_estimada AND estado = 'Cubierta' THEN 1 ELSE 0 END) as a_tiempo,
                SUM(CASE WHEN estado NOT IN ('Cubierta','Cancelada') AND NOW() > fecha_cierre_estimada THEN 1 ELSE 0 END) as vencidas
            FROM vacantes
        `);

        const [monthlyTrend] = await pool.query(`
            SELECT 
                DATE_FORMAT(fecha_cierre_real, '%Y-%m') as mes,
                COUNT(*) as cerradas
            FROM vacantes
            WHERE estado = 'Cubierta' AND fecha_cierre_real IS NOT NULL
            AND fecha_cierre_real >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY mes
            ORDER BY mes ASC
        `);

        res.json({ stats: stats[0], monthly_trend: monthlyTrend });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
