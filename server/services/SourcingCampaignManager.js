const pool = require('../db');
const jobBoardConnector = require('./JobBoardConnector');
const aiMatchingEngine = require('./AIMatchingEngine');

/**
 * SourcingCampaignManager - Autonomous 24/7 candidate sourcing
 * Manages automated campaigns that search, score, and notify
 */
class SourcingCampaignManager {
    constructor() {
        this.name = 'Sourcing Campaign Manager';
        this.activeCampaigns = new Map();
        this.intervals = new Map();

        // Auto-resume campaigns on startup
        this.resumeActiveCampaigns();
    }

    /**
     * Create a new sourcing campaign
     */
    async createCampaign(vacancyId, config) {
        console.log(`[${this.name}] Creating campaign for vacancy ${vacancyId}...`);

        const campaignData = {
            vacante_id: vacancyId,
            nombre: config.nombre || `Campaign for Vacancy ${vacancyId}`,
            estado: 'active',
            fuentes_activas: JSON.stringify(config.fuentes || ['linkedin', 'indeed', 'computrabajo']),
            filtros: JSON.stringify(config.filtros || {}),
            candidatos_encontrados: 0,
            candidatos_contactados: 0,
            tasa_respuesta: 0,
            ultima_ejecucion: null
        };

        const [result] = await pool.query(
            `INSERT INTO sourcing_campaigns 
            (vacante_id, nombre, estado, fuentes_activas, filtros, candidatos_encontrados, candidatos_contactados, tasa_respuesta, ultima_ejecucion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                campaignData.vacante_id,
                campaignData.nombre,
                campaignData.estado,
                campaignData.fuentes_activas,
                campaignData.filtros,
                campaignData.candidatos_encontrados,
                campaignData.candidatos_contactados,
                campaignData.tasa_respuesta,
                campaignData.ultima_ejecucion
            ]
        );

        const campaignId = result.insertId;

        // Auto-run if configured
        if (config.auto_run) {
            await this.scheduleCampaign(campaignId, config.schedule || '0 */6 * * *');
        }

        console.log(`[${this.name}] Campaign ${campaignId} created successfully`);

        return {
            id: campaignId,
            ...campaignData,
            message: 'Campaign created successfully'
        };
    }

    /**
     * Run a campaign manually or on schedule
     */
    async runCampaign(campaignId) {
        console.log(`[${this.name}] Running campaign ${campaignId}...`);

        try {
            // Get campaign details
            const [campaigns] = await pool.query(
                'SELECT * FROM sourcing_campaigns WHERE id = ?',
                [campaignId]
            );

            if (campaigns.length === 0) {
                throw new Error(`Campaign ${campaignId} not found`);
            }

            const campaign = campaigns[0];

            // Get vacancy details
            const [vacancies] = await pool.query(
                'SELECT * FROM vacantes WHERE id = ?',
                [campaign.vacante_id]
            );

            if (vacancies.length === 0) {
                throw new Error(`Vacancy ${campaign.vacante_id} not found`);
            }

            const vacancy = vacancies[0];

            // Parse configuration
            const fuentes = JSON.parse(campaign.fuentes_activas);
            const filtros = JSON.parse(campaign.filtros);

            // Step 1: Search across job boards
            console.log(`[${this.name}] Searching across ${fuentes.length} sources...`);
            const searchResults = await jobBoardConnector.searchCandidates(
                vacancy.descripcion_puesto || vacancy.puesto_nombre,
                filtros,
                fuentes
            );

            console.log(`[${this.name}] Found ${searchResults.candidates.length} candidates`);

            // Step 2: AI Scoring
            console.log(`[${this.name}] Scoring candidates with AI...`);
            const scoredCandidates = await aiMatchingEngine.scoreCandidates(
                searchResults.candidates,
                vacancy
            );

            // Step 3: Save top candidates
            const topCandidates = scoredCandidates.filter(c => c.score >= 70); // Only save 70+ scores
            console.log(`[${this.name}] Saving ${topCandidates.length} top candidates...`);

            for (const candidate of topCandidates) {
                await this.saveSourcedCandidate(campaignId, candidate);
            }

            // Step 4: Update campaign stats
            await pool.query(
                `UPDATE sourcing_campaigns 
                SET candidatos_encontrados = candidatos_encontrados + ?,
                    ultima_ejecucion = NOW()
                WHERE id = ?`,
                [topCandidates.length, campaignId]
            );

            // Step 5: Log execution
            await this.logCampaignExecution(campaignId, {
                total_searched: searchResults.candidates.length,
                top_candidates: topCandidates.length,
                avg_score: this.calculateAvgScore(scoredCandidates),
                sources_used: fuentes,
                timestamp: new Date()
            });

            console.log(`[${this.name}] Campaign ${campaignId} execution completed`);

            return {
                success: true,
                campaign_id: campaignId,
                candidates_found: searchResults.candidates.length,
                top_candidates: topCandidates.length,
                avg_score: this.calculateAvgScore(scoredCandidates),
                top_matches: topCandidates.slice(0, 5) // Return top 5
            };

        } catch (error) {
            console.error(`[${this.name}] Campaign execution failed:`, error);
            throw error;
        }
    }

    /**
     * Save a sourced candidate to database
     */
    async saveSourcedCandidate(campaignId, candidate) {
        try {
            // Check if candidate already exists
            const [existing] = await pool.query(
                'SELECT id FROM sourced_candidates WHERE email = ? AND campaign_id = ?',
                [candidate.email, campaignId]
            );

            if (existing.length > 0) {
                console.log(`[${this.name}] Candidate ${candidate.email} already exists, skipping`);
                return existing[0].id;
            }

            const [result] = await pool.query(
                `INSERT INTO sourced_candidates 
                (campaign_id, nombre, email, telefono, fuente, perfil_url, cv_text, ai_match_score, ai_analysis, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    campaignId,
                    candidate.nombre,
                    candidate.email,
                    candidate.telefono || null,
                    candidate.fuente,
                    candidate.perfil_url || null,
                    JSON.stringify({
                        titulo: candidate.titulo_actual,
                        empresa: candidate.empresa_actual,
                        experiencia: candidate.experiencia_anos,
                        skills: candidate.skills,
                        educacion: candidate.educacion
                    }),
                    candidate.score || 0,
                    JSON.stringify({
                        strengths: candidate.strengths || [],
                        gaps: candidate.gaps || [],
                        recommendation: candidate.recommendation || '',
                        reasoning: candidate.reasoning || ''
                    }),
                    'new'
                ]
            );

            return result.insertId;
        } catch (error) {
            console.error(`[${this.name}] Error saving candidate:`, error);
            return null;
        }
    }

    /**
     * Schedule a campaign to run automatically
     */
    async scheduleCampaign(campaignId, cronExpression) {
        console.log(`[${this.name}] Scheduling campaign ${campaignId} with cron: ${cronExpression}`);

        // For simplicity, we'll use setInterval instead of cron
        // In production, use node-cron or similar
        const intervalMs = this.parseCronToInterval(cronExpression);

        const interval = setInterval(async () => {
            console.log(`[${this.name}] Auto-executing campaign ${campaignId}...`);
            try {
                await this.runCampaign(campaignId);
            } catch (error) {
                console.error(`[${this.name}] Auto-execution failed:`, error);
            }
        }, intervalMs);

        this.intervals.set(campaignId, interval);
        this.activeCampaigns.set(campaignId, { scheduled: true, interval: intervalMs });

        return { scheduled: true, interval_ms: intervalMs };
    }

    /**
     * Pause a campaign
     */
    async pauseCampaign(campaignId) {
        await pool.query(
            'UPDATE sourcing_campaigns SET estado = ? WHERE id = ?',
            ['paused', campaignId]
        );

        // Clear interval if exists
        if (this.intervals.has(campaignId)) {
            clearInterval(this.intervals.get(campaignId));
            this.intervals.delete(campaignId);
        }

        this.activeCampaigns.delete(campaignId);

        console.log(`[${this.name}] Campaign ${campaignId} paused`);
        return { success: true, message: 'Campaign paused' };
    }

    /**
     * Resume a paused campaign
     */
    async resumeCampaign(campaignId) {
        await pool.query(
            'UPDATE sourcing_campaigns SET estado = ? WHERE id = ?',
            ['active', campaignId]
        );

        console.log(`[${this.name}] Campaign ${campaignId} resumed`);
        return { success: true, message: 'Campaign resumed' };
    }

    /**
     * Get campaign statistics
     */
    async getCampaignStats(campaignId) {
        const [campaign] = await pool.query(
            'SELECT * FROM sourcing_campaigns WHERE id = ?',
            [campaignId]
        );

        if (campaign.length === 0) {
            throw new Error(`Campaign ${campaignId} not found`);
        }

        const [candidates] = await pool.query(
            'SELECT * FROM sourced_candidates WHERE campaign_id = ?',
            [campaignId]
        );

        const stats = {
            campaign: campaign[0],
            total_candidates: candidates.length,
            by_source: this.groupBySource(candidates),
            by_status: this.groupByStatus(candidates),
            avg_match_score: this.calculateAvgScore(candidates),
            top_candidates: candidates
                .sort((a, b) => b.ai_match_score - a.ai_match_score)
                .slice(0, 10)
        };

        return stats;
    }

    /**
     * Helper: Parse cron to interval (simplified)
     */
    parseCronToInterval(cronExpression) {
        // Simplified: "0 */6 * * *" = every 6 hours
        const match = cronExpression.match(/\*\/(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            return hours * 60 * 60 * 1000;
        }
        return 6 * 60 * 60 * 1000; // Default 6 hours
    }

    /**
     * Helper: Calculate average score
     */
    calculateAvgScore(candidates) {
        if (candidates.length === 0) return 0;
        const sum = candidates.reduce((acc, c) => acc + (c.score || c.ai_match_score || 0), 0);
        return Math.round(sum / candidates.length);
    }

    /**
     * Helper: Group candidates by source
     */
    groupBySource(candidates) {
        return candidates.reduce((acc, c) => {
            acc[c.fuente] = (acc[c.fuente] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Helper: Group candidates by status
     */
    groupByStatus(candidates) {
        return candidates.reduce((acc, c) => {
            acc[c.estado] = (acc[c.estado] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Log campaign execution
     */
    /**
     * Resume all active campaigns from database (called on startup)
     */
    async resumeActiveCampaigns() {
        console.log(`[${this.name}] Resuming active campaigns from database...`);
        try {
            const [active] = await pool.query('SELECT id FROM sourcing_campaigns WHERE estado = "active"');

            for (const campaign of active) {
                // Default schedule for now - in production, read from DB if saved
                await this.scheduleCampaign(campaign.id, '0 */6 * * *');
            }

            console.log(`[${this.name}] Resumed ${active.length} active campaigns`);
        } catch (error) {
            console.error(`[${this.name}] Failed to resume campaigns:`, error);
        }
    }
}

module.exports = new SourcingCampaignManager();
