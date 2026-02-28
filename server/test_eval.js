const pool = require('./db');
async function run() {
    try {
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
        console.log('vacantes ok');

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
        console.log('candidatos ok');
    } catch (e) {
        console.log('error', e.message);
    }
    process.exit(0);
}
run();
