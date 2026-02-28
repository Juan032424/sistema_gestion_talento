const pool = require('../db');
const hotLeadService = require('./HotLeadService');

class ActivityLogService {
    /**
     * Registra una actividad de un candidato
     * @param {number} candidateId ID del candidato
     * @param {string} activityType Tipo de actividad (LOGIN, VIEW_JOB, etc.)
     * @param {string} description Descripción legible
     * @param {number|null} relatedId ID relacionado (vacante_id, etc.)
     * @param {Object} metadata Datos adicionales opcionales
     */
    async logActivity(candidateId, activityType, description, relatedId = null, metadata = {}) {
        try {
            const [result] = await pool.query(`
                INSERT INTO candidate_activity_logs 
                (candidate_id, activity_type, description, related_id, metadata)
                VALUES (?, ?, ?, ?, ?)
            `, [
                candidateId,
                activityType,
                description,
                relatedId,
                JSON.stringify(metadata)
            ]);

            // 2. Disparar alertas de Hot Lead si aplica (asíncrono para no bloquear)
            hotLeadService.checkAndNotifyHotLead(candidateId, activityType, description).catch(err => {
                console.error('❌ Error in hotLeadService check:', err.message);
            });

            return result.insertId;
        } catch (error) {
            console.error('❌ Error logging activity:', error.message);
            // No lanzamos el error para no bloquear la operación principal
            return null;
        }
    }

    /**
     * Obtiene los logs de un candidato
     */
    async getCandidateLogs(candidateId, limit = 50) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM candidate_activity_logs
                WHERE candidate_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `, [candidateId, limit]);
            return rows;
        } catch (error) {
            console.error('❌ Error getting logs:', error.message);
            return [];
        }
    }
}

module.exports = new ActivityLogService();
