const pool = require('../db');

class AnalystAgent {
    constructor() {
        this.name = "Financial Analyst Agent";
    }

    async calculateVacancyCosts() {
        try {
            console.log(`[${this.name}] Running daily financial audit...`);

            // Fetch all open vacancies
            const [vacancies] = await pool.query("SELECT * FROM vacantes WHERE estado IN ('Abierta', 'En Proceso')");

            for (const vac of vacancies) {
                const fechaApertura = new Date(vac.fecha_apertura);
                const hoy = new Date();
                const diasVacante = Math.ceil((hoy - fechaApertura) / (1000 * 60 * 60 * 24));

                // Formula: CV = (Salario Diario * 1.5) * Días de Vacante
                const salarioDiario = (vac.presupuesto_max || 0) / 30;
                const costoAcumulado = (salarioDiario * 1.5) * diasVacante;

                // Update vacancy with new costs
                await pool.query('UPDATE vacantes SET costo_vacante = ?, dias_desfase = ? WHERE id = ?',
                    [costoAcumulado, Math.max(0, diasVacante - (vac.sla_meta || 15)), vac.id]);

                // Check for alerts (20% above budget or similar rule)
                if (costoAcumulado > (vac.presupuesto_max * 0.2)) {
                    await this.logAction('success', `ALERTA: Vacante ${vac.codigo_requisicion} supera el 20% del presupuesto mensual en costos de vacancia.`, 'vacancy', vac.id);
                }
            }
        } catch (error) {
            console.error(`[${this.name}] Error:`, error);
            await this.logAction('failed', error.message);
        }
    }

    async logAction(status, details, entityType = null, entityId = null) {
        try {
            // Temporarily disabled until agent_logs table is created
            console.log(`[${this.name}] ${status}: ${details}`);
            /*
            await pool.query(
                'INSERT INTO agent_logs (agent_name, action, status, details, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
                [this.name, 'Financial Calculation', status, details, entityType, entityId]
            );
            */
        } catch (e) {
            console.error("Logging failed:", e);
        }
    }
}

module.exports = new AnalystAgent();
