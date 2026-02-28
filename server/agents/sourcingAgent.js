const pool = require('../db');
const aiService = require('../services/aiService');

class SourcingAgent {
    constructor() {
        this.name = "Sourcing & Parsing Agent";
    }

    async runAutonomousSearch(vacancyId) {
        try {
            console.log(`[${this.name}] Starting autonomous search for vacancy ID: ${vacancyId}`);

            // 1. Fetch Vacancy details to know what to search for
            const [vacancies] = await pool.query('SELECT * FROM vacantes WHERE id = ?', [vacancyId]);
            if (vacancies.length === 0) return;
            const vacancy = vacancies[0];

            // 2. Simulate API Call to LinkedIn/JobBoards
            // In a real scenario, this would use axios to call LinkedIn API
            const simulatedProfiles = [
                {
                    nombre: "Juan Pérez",
                    fuente: "LinkedIn",
                    salario_pretendido: 4500000,
                    id_externo: "LI-JP-12345",
                    cv_mock: `Experiencia en ${vacancy.puesto_nombre}. 5 años de trayectoria en el sector.`
                }
            ];

            for (const profile of simulatedProfiles) {
                // Check if already exists
                const [existing] = await pool.query('SELECT id FROM candidatos_seguimiento WHERE id_externo_linkedin = ?', [profile.id_externo]);

                if (existing.length === 0) {
                    // AI Analysis for initial score
                    const analysis = await aiService.analyzeCV(profile.cv_mock, vacancy.observaciones || vacancy.puesto_nombre);

                    // Insert into DB
                    const [result] = await pool.query(`
                        INSERT INTO candidatos_seguimiento 
                        (vacante_id, nombre_candidato, fuente_reclutamiento, salario_pretendido, id_externo_linkedin, score_tecnico_ia, resumen_ia_entrevista)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [vacancyId, profile.nombre, profile.fuente, profile.salario_pretendido, profile.id_externo, analysis.score, analysis.summary]);

                    await this.logAction('success', `Candidato ${profile.nombre} importado automáticamente de LinkedIn`, 'candidate', result.insertId);
                }
            }
        } catch (error) {
            console.error(`[${this.name}] Error:`, error);
            await this.logAction('failed', error.message);
        }
    }

    async logAction(status, details, entityType = null, entityId = null) {
        try {
            await pool.query(
                'INSERT INTO agent_logs (agent_name, action, status, details, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
                [this.name, 'Sourcing Search', status, details, entityType, entityId]
            );
        } catch (e) {
            console.error("Logging failed:", e);
        }
    }
}

module.exports = new SourcingAgent();
