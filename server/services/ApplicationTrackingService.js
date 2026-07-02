const pool = require('../db');
const crypto = require('crypto');

/**
 * ApplicationTrackingService - Links mágicos y tracking de postulaciones
 */
class ApplicationTrackingService {
    constructor() {
        this.name = 'Application Tracking Service';
        this.linkExpiryDays = 90; // 90 días de validez
    }

    /**
     * Crear link mágico de tracking para una postulación
     */
    async createTrackingLink(applicationId) {
        console.log(`[${this.name}] Creando tracking link para application #${applicationId}`);

        try {
            // 1. Obtener datos de la postulación
            const [applications] = await pool.query(
                'SELECT id, email, vacante_id FROM applications WHERE id = ?',
                [applicationId]
            );

            if (applications.length === 0) {
                throw new Error('Postulación no encontrada');
            }

            const application = applications[0];

            // 2. Ver si ya existe un link
            const [existing] = await pool.query(
                'SELECT tracking_token FROM application_tracking_links WHERE application_id = ?',
                [applicationId]
            );

            if (existing.length > 0) {
                console.log(`[${this.name}] Link existente: ${existing[0].tracking_token}`);
                return {
                    success: true,
                    trackingToken: existing[0].tracking_token,
                    trackingUrl: this.generateTrackingUrl(existing[0].tracking_token)
                };
            }

            // 3. Generar token único
            const trackingToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + this.linkExpiryDays);

            // 4. Crear el link
            await pool.query(`
                INSERT INTO application_tracking_links (
                    application_id, tracking_token, email, expires_at
                ) VALUES (?, ?, ?, ?)
            `, [applicationId, trackingToken, application.email, expiresAt]);

            // 5. Marcar que el link fue enviado
            await pool.query(
                'UPDATE applications SET tracking_link_sent = TRUE WHERE id = ?',
                [applicationId]
            );

            const trackingUrl = this.generateTrackingUrl(trackingToken);

            console.log(`[${this.name}] ✅ Link creado: ${trackingUrl}`);

            return {
                success: true,
                trackingToken,
                trackingUrl,
                message: 'Link de tracking creado exitosamente'
            };

        } catch (error) {
            console.error(`[${this.name}] Error creando tracking link:`, error);
            throw error;
        }
    }

    /**
     * Obtener todos los links de tracking (Para SuperAdmin)
     */
    async getAllTrackingLinks() {
        try {
            const [links] = await pool.query(`
                SELECT atl.*, a.nombre as candidato_nombre, a.email, a.estado as application_estado, 
                       v.puesto_nombre, v.codigo_requisicion
                FROM application_tracking_links atl
                INNER JOIN applications a ON atl.application_id = a.id
                INNER JOIN vacantes v ON a.vacante_id = v.id
                ORDER BY atl.created_at DESC
            `);

            return links.map(link => ({
                ...link,
                trackingUrl: this.generateTrackingUrl(link.tracking_token)
            }));
        } catch (error) {
            console.error(`[${this.name}] Error obteniendo todos los links:`, error);
            throw error;
        }
    }

    /**
     * Revocar/Eliminar un link de tracking (Para SuperAdmin)
     */
    async revokeTrackingLink(trackingToken) {
        try {
            await pool.query('DELETE FROM application_tracking_links WHERE tracking_token = ?', [trackingToken]);
            return { success: true, message: 'Link revocado exitosamente' };
        } catch (error) {
            console.error(`[${this.name}] Error revocando link:`, error);
            throw error;
        }
    }

    /**
     * Obtener status de postulación con tracking token
     */
    async getApplicationStatus(trackingToken) {
        try {
            // 1. Validar el token
            const [links] = await pool.query(`
                SELECT atl.*, a.*, 
                       v.puesto_nombre, v.codigo_requisicion, v.salario_base_ofrecido,
                       v.observaciones as vacante_descripcion, v.estado as vacante_estado,
                       s.nombre as sede_nombre,
                       p.nombre as proceso_nombre,
                       cs.calificacion_tecnica, cs.resultado_final, cs.etapa_actual as etapa_seguimiento,
                       cs.estado_entrevista, cs.fecha_entrevista, cs.motivo_no_apto
                FROM application_tracking_links atl
                INNER JOIN applications a ON atl.application_id = a.id
                INNER JOIN vacantes v ON a.vacante_id = v.id
                LEFT JOIN sedes s ON v.sede_id = s.id
                LEFT JOIN procesos p ON v.proceso_id = p.id
                LEFT JOIN candidatos c ON a.candidato_id = c.id
                LEFT JOIN candidatos_seguimiento cs ON (a.vacante_id = cs.vacante_id AND c.cedula COLLATE utf8mb4_unicode_ci = cs.cedula COLLATE utf8mb4_unicode_ci)
                WHERE atl.tracking_token = ?
                AND atl.expires_at > NOW()
            `, [trackingToken]);

            if (links.length === 0) {
                throw new Error('Link de tracking inválido o expirado');
            }

            const data = links[0];

            // 2. Incrementar contador de vistas
            await pool.query(`
                UPDATE application_tracking_links SET
                    views_count = views_count + 1,
                    last_viewed_at = NOW()
                WHERE tracking_token = ?
            `, [trackingToken]);

            // 3. Actualizar timestamp de vista del candidato (optional)
            try {
                await pool.query(
                    'UPDATE applications SET candidate_viewed_at = NOW() WHERE id = ?',
                    [data.application_id]
                );
            } catch (e) {
                console.log(`[${this.name}] candidate_viewed_at no disponible:`, e.message);
            }

            // 4. Obtener timeline de cambios de estado (optional)
            let timeline = [];
            try {
                timeline = await this.getApplicationTimeline(data.application_id);
            } catch (e) {
                console.log(`[${this.name}] Timeline no disponible:`, e.message);
            }

            // 5. Obtener notificaciones no leídas (optional)
            let notifications = [];
            try {
                const [notifRows] = await pool.query(`
                    SELECT * FROM candidate_notifications
                    WHERE candidate_account_id = ?
                    ORDER BY created_at DESC
                    LIMIT 10
                `, [data.candidate_account_id || 0]);
                notifications = notifRows;
            } catch (e) {
                console.log(`[${this.name}] Notificaciones no disponibles:`, e.message);
            }

            console.log(`[${this.name}] ✅ Status obtenido para application #${data.application_id}`);

            return {
                success: true,
                application: {
                    id: data.application_id,
                    nombre: data.nombre,
                    email: data.email,
                    telefono: data.telefono,
                    estado: data.estado,
                    fecha_postulacion: data.fecha_postulacion,
                    fecha_ultima_actualizacion: data.fecha_ultima_actualizacion,
                    auto_match_score: data.auto_match_score,
                    notas_reclutador: data.notas_reclutador,
                    candidate_notes: data.candidate_notes,
                    rating_by_candidate: data.rating_by_candidate,
                    calificacion_tecnica: data.calificacion_tecnica,
                    resultado_final: data.resultado_final,
                    etapa_seguimiento: data.etapa_seguimiento,
                    estado_entrevista: data.estado_entrevista,
                    fecha_entrevista: data.fecha_entrevista,
                    motivo_no_apto: data.motivo_no_apto
                },
                vacancy: {
                    puesto_nombre: data.puesto_nombre,
                    codigo_requisicion: data.codigo_requisicion,
                    ubicacion: data.sede_nombre || 'Cartagena, Colombia',
                    salario_base_ofrecido: data.salario_base_ofrecido,
                    modalidad_trabajo: data.proceso_nombre || 'Presencial',
                    empresa_nombre: 'DISCOL S.A.S.'
                },
                timeline,
                notifications,
                trackingInfo: {
                    views_count: data.views_count,
                    last_viewed_at: data.last_viewed_at,
                    expires_at: data.expires_at
                }
            };

        } catch (error) {
            console.error(`[${this.name}] Error obteniendo status:`, error);
            throw error;
        }
    }

    /**
     * Obtener timeline de estados de una postulación
     */
    async getApplicationTimeline(applicationId) {
        // Por ahora retornamos estados basados en la fecha de actualización
        // TODO: Implementar tabla de historial de cambios
        const [application] = await pool.query(
            'SELECT estado, fecha_postulacion, fecha_ultima_actualizacion FROM applications WHERE id = ?',
            [applicationId]
        );

        if (application.length === 0) return [];

        const app = application[0];
        const timeline = [
            {
                estado: 'Nueva',
                fecha: app.fecha_postulacion,
                mensaje: 'Tu postulación ha sido recibida'
            }
        ];

        if (app.estado !== 'Nueva') {
            timeline.push({
                estado: app.estado,
                fecha: app.fecha_ultima_actualizacion || app.fecha_postulacion,
                mensaje: this.getEstadoMessage(app.estado)
            });
        }

        return timeline;
    }

    /**
     * Actualizar feedback del candidato
     */
    async updateCandidateFeedback(trackingToken, feedback) {
        try {
            // 1. Validar token
            const [links] = await pool.query(
                'SELECT application_id FROM application_tracking_links WHERE tracking_token = ?',
                [trackingToken]
            );

            if (links.length === 0) {
                throw new Error('Link de tracking inválido');
            }

            const applicationId = links[0].application_id;

            // 2. Actualizar feedback
            const updates = [];
            const values = [];

            if (feedback.notes) {
                updates.push('candidate_notes = ?');
                values.push(feedback.notes);
            }

            if (feedback.rating) {
                updates.push('rating_by_candidate = ?');
                values.push(feedback.rating);
            }

            if (feedback.feedback) {
                updates.push('feedback_by_candidate = ?');
                values.push(feedback.feedback);
            }

            if (updates.length === 0) {
                throw new Error('No hay datos para actualizar');
            }

            values.push(applicationId);

            await pool.query(`
                UPDATE applications SET ${updates.join(', ')}
                WHERE id = ?
            `, values);

            console.log(`[${this.name}] ✅ Feedback actualizado para application #${applicationId}`);

            return {
                success: true,
                message: 'Feedback guardado exitosamente'
            };

        } catch (error) {
            console.error(`[${this.name}] Error actualizando feedback:`, error);
            throw error;
        }
    }

    /**
     * Marcar notificación como leída
     */
    async markNotificationAsRead(notificationId, trackingToken) {
        try {
            // Validar que la notificación pertenece al token
            const [notifications] = await pool.query(`
                SELECT cn.id
                FROM candidate_notifications cn
                INNER JOIN application_tracking_links atl ON cn.application_id = atl.application_id
                WHERE cn.id = ? AND atl.tracking_token = ?
            `, [notificationId, trackingToken]);

            if (notifications.length === 0) {
                throw new Error('Notificación no encontrada');
            }

            await pool.query(`
                UPDATE candidate_notifications SET
                    is_read = TRUE,
                    read_at = NOW()
                WHERE id = ?
            `, [notificationId]);

            return { success: true };

        } catch (error) {
            console.error(`[${this.name}] Error marcando notificación:`, error);
            throw error;
        }
    }

    /**
     * Enviar notificación a candidato
     */
    async sendNotification(applicationId, tipo, titulo, mensaje, actionUrl = null) {
        try {
            // Obtener email de la postulación
            const [applications] = await pool.query(
                'SELECT email, candidate_account_id FROM applications WHERE id = ?',
                [applicationId]
            );

            if (applications.length === 0) {
                // throw new Error('Postulación no encontrada');
                return { success: false, error: 'Postulación no encontrada' };
            }

            const app = applications[0];

            // 1. Si tiene cuenta de candidato (Registered), usar candidate_notifications
            if (app.candidate_account_id) {
                await pool.query(`
                    INSERT INTO candidate_notifications (
                        candidate_account_id, tipo, titulo, mensaje, link_accion, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    app.candidate_account_id,
                    tipo,
                    titulo,
                    mensaje,
                    actionUrl,
                    JSON.stringify({ applicationId })
                ]);
            } else {
                // 2. Si es externo, intentar buscar en external_candidates o usar tabla genérica
                // Por ahora, solo logueamos que se envió "email" (simulado)
                console.log(`[${this.name}] 📧 Simulación: Email enviado a ${app.email} (Candidato Externo)`);
            }

            return { success: true };

        } catch (error) {
            console.error(`[${this.name}] Error enviando notificación:`, error);
            // No lanzar error para no romper el flujo principal
            return { success: false, error: error.message };
        }
    }

    /**
     * Generar URL de tracking
     */
    generateTrackingUrl(trackingToken) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `${baseUrl}/track/${trackingToken}`;
    }

    /**
     * Obtener mensaje por estado
     */
    getEstadoMessage(estado) {
        const messages = {
            'Nueva': 'Tu postulación ha sido recibida',
            'En Revisión': 'Tu perfil está siendo revisado por nuestro equipo',
            'Preseleccionado': '¡Felicitaciones! Has sido preseleccionado',
            'Entrevista': 'Has sido seleccionado para una entrevista',
            'Pruebas Técnicas': 'Se te enviarán pruebas técnicas próximamente',
            'Contratado': '¡Felicitaciones! Has sido contratado',
            'Descartado': 'Gracias por tu interés. Tu perfil no fue seleccionado en esta ocasión',
            'Retirado': 'Tu postulación ha sido retirada'
        };

        return messages[estado] || 'Estado actualizado';
    }
}

module.exports = new ApplicationTrackingService();
