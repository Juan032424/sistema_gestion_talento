const pool = require('../db');

class AuditService {
    /**
     * @param {number|null} userId - ID of the user performing the action (req.user.id)
     * @param {string|null} userEmail - Email of the user performing the action (req.user.email)
     * @param {string} entityName - Name of the entity being modified (e.g., 'candidatos_seguimiento', 'vacantes', 'users')
     * @param {number|string} entityId - ID of the entity being modified
     * @param {string} action - Action performed ('UPDATE', 'DELETE', 'CREATE', etc.)
     * @param {object} changes - Object describing what changed or context
     * @param {string} ipAddress - IP address of the user (req.ip)
     */
    async log(userId, userEmail, entityName, entityId, action, changes = {}, ipAddress = null) {
        try {
            await pool.query(`
                INSERT INTO system_audit_logs 
                (user_id, user_email, entity_name, entity_id, action, changes, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, userEmail, entityName, entityId, action, JSON.stringify(changes), ipAddress]);
            
            console.log(`[Audit] ${action} on ${entityName}#${entityId} by User ${userEmail || userId || 'System'}`);
        } catch (error) {
            console.error('[Audit] Error saving audit log:', error);
            // Non-blocking error, we don't want to break the main transaction
        }
    }

    /**
     * Obtener los logs de auditoría (Para SuperAdmin)
     */
    async getLogs(limit = 100) {
        try {
            const [logs] = await pool.query(`
                SELECT * FROM system_audit_logs 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [limit]);
            return logs;
        } catch (error) {
            console.error('[Audit] Error fetching audit logs:', error);
            throw error;
        }
    }
}

module.exports = new AuditService();
