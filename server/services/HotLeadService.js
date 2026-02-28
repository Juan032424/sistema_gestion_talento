const pool = require('../db');

class HotLeadService {
    /**
     * Verifica si una actividad del candidato debe disparar una alerta de "Hot Lead" al reclutador.
     */
    async checkAndNotifyHotLead(candidateId, activityType, description) {
        // Solo nos interesan actividades de alta intención
        const significantTypes = ['LOGIN', 'VIEW_JOB', 'START_APPLICATION', 'APPLY'];
        if (!significantTypes.includes(activityType)) return;

        try {
            // 1. Buscar aplicaciones activas en etapas avanzadas para este candidato
            // Buscamos en la tabla 'applications' que es la que se usa para el portal
            const [activeApps] = await pool.query(`
                SELECT a.id as application_id, a.vacante_id, a.estado as app_estado, 
                       v.puesto_nombre, v.responsable_rh, v.codigo_requisicion
                FROM applications a
                JOIN vacantes v ON a.vacante_id = v.id
                WHERE a.candidate_account_id = ? 
                AND a.estado IN ('Entrevista', 'Oferta', 'Preseleccionado')
            `, [candidateId]);

            if (activeApps.length === 0) return;

            for (const app of activeApps) {
                // 2. Encontrar el User ID del reclutador (responsable_rh)
                // Intentamos matchear por nombre completo
                const [users] = await pool.query(
                    'SELECT id FROM users WHERE full_name = ? LIMIT 1',
                    [app.responsable_rh]
                );

                if (users.length > 0) {
                    const recruiterId = users[0].id;

                    // 3. Crear notificación para el reclutador
                    const titulo = `🔥 Hot Lead: ${activityType === 'LOGIN' ? 'Regreso de candidato' : 'Interés activo'}`;
                    const mensaje = `El candidato de tu proceso para "${app.puesto_nombre}" (${app.app_estado}) acaba de tener actividad: ${description}.`;

                    await pool.query(`
                        INSERT INTO notifications (
                            user_type, user_id, tipo, titulo, mensaje, 
                            related_entity, related_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        'reclutador',
                        recruiterId,
                        'hot_lead',
                        titulo,
                        mensaje,
                        'application',
                        app.application_id
                    ]);

                    console.log(`[HotLeadService] 🚨 Alerta enviada a reclutador ID ${recruiterId} por candidato ID ${candidateId}`);
                }
            }
        } catch (error) {
            console.error('[HotLeadService] Error checking hot lead:', error.message);
        }
    }
}

module.exports = new HotLeadService();
