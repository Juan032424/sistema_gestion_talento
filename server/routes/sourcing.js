const express = require('express');
const router = express.Router();
const pool = require('../db');
const sourcingCampaignManager = require('../services/SourcingCampaignManager');
const jobBoardConnector = require('../services/JobBoardConnector');
const aiMatchingEngine = require('../services/AIMatchingEngine');
const colombiaScraper = require('../services/ColombiaJobsScraper');

/**
 * POST /api/sourcing/buscar-candidatos
 * Busca candidatos en portales públicos de Colombia (Cartagena preferido)
 * Usa scraping de páginas públicas con axios + cheerio
 */
router.post('/buscar-candidatos', async (req, res) => {
    try {
        const {
            keywords,        // Nombre de la vacante / cargo a buscar
            ciudad = 'Cartagena',
            fuentes = ['computrabajo', 'elempleo', 'google'],
            limit = 25
        } = req.body;

        if (!keywords || keywords.trim().length < 2) {
            return res.status(400).json({ error: 'El campo "keywords" (nombre del cargo) es obligatorio' });
        }

        console.log(`\n🌐 API: Iniciando búsqueda de candidatos`);
        console.log(`   Cargo: "${keywords}" | Ciudad: ${ciudad} | Fuentes: ${fuentes.join(', ')}`);

        const resultado = await colombiaScraper.searchCandidates({
            keywords: keywords.trim(),
            ciudad,
            fuentes,
            limit: Math.min(limit, 50) // max 50
        });

        // Save results to database for campaign tracking
        if (resultado.candidatos.length > 0) {
            try {
                let campaignId = req.body.campaign_id || null;

                if (!campaignId) {
                    const [campResult] = await pool.query(`
                        INSERT INTO sourcing_campaigns 
                        (nombre, estado, candidatos_encontrados, ultima_ejecucion)
                        VALUES (?, 'completed', ?, NOW())
                    `, [`Búsqueda: ${keywords}`, resultado.candidatos.length]);
                    campaignId = campResult.insertId;
                }

                // Insert sourced candidates using actual column names
                for (const candidato of resultado.candidatos) {
                    await pool.query(`
                        INSERT INTO sourced_candidates 
                        (campaign_id, nombre, email, telefono, fuente, perfil_url, cv_text, ai_match_score, estado)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'new')
                    `, [
                        campaignId,
                        candidato.nombre,
                        candidato.email || null,
                        candidato.telefono || null,
                        candidato.fuente,
                        candidato.perfil_url || null,
                        candidato.resumen ? `Ciudad: ${candidato.ciudad} | Cargo: ${candidato.cargo_actual || 'N/A'} | ${candidato.resumen}` : null
                    ]).catch(() => { }); // Ignore duplicates silently
                }

            } catch (dbError) {
                console.log('⚠️ DB save warning (non-critical):', dbError.message);
            }
        }


        res.json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error in /buscar-candidatos:', error);
        res.status(500).json({ error: 'Error al buscar candidatos', detail: error.message });
    }
});



/**
 * GET /api/sourcing/campaigns
 * Get all sourcing campaigns
 */
router.get('/campaigns', async (req, res) => {
    try {
        const [campaigns] = await pool.query(`
            SELECT sc.*, v.puesto_nombre, v.codigo_requisicion
            FROM sourcing_campaigns sc
            LEFT JOIN vacantes v ON sc.vacante_id = v.id
            ORDER BY sc.created_at DESC
        `);

        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

/**
 * GET /api/sourcing/campaigns/:id
 * Get single campaign with details
 */
router.get('/campaigns/:id', async (req, res) => {
    try {
        const stats = await sourcingCampaignManager.getCampaignStats(req.params.id);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

/**
 * POST /api/sourcing/campaigns
 * Create new sourcing campaign
 */
router.post('/campaigns', async (req, res) => {
    try {
        const { vacante_id, nombre, fuentes, filtros, auto_run, schedule } = req.body;

        if (!vacante_id) {
            return res.status(400).json({ error: 'vacante_id is required' });
        }

        const campaign = await sourcingCampaignManager.createCampaign(vacante_id, {
            nombre,
            fuentes: fuentes || ['linkedin', 'indeed', 'computrabajo'],
            filtros: filtros || {},
            auto_run: auto_run || false,
            schedule: schedule || '0 */6 * * *' // Every 6 hours by default
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

/**
 * POST /api/sourcing/campaigns/:id/run
 * Run a campaign manually
 */
router.post('/campaigns/:id/run', async (req, res) => {
    try {
        const result = await sourcingCampaignManager.runCampaign(parseInt(req.params.id));
        res.json(result);
    } catch (error) {
        console.error('Error running campaign:', error);
        res.status(500).json({ error: 'Failed to run campaign' });
    }
});

/**
 * PATCH /api/sourcing/campaigns/:id/pause
 * Pause a campaign
 */
router.patch('/campaigns/:id/pause', async (req, res) => {
    try {
        const result = await sourcingCampaignManager.pauseCampaign(parseInt(req.params.id));
        res.json(result);
    } catch (error) {
        console.error('Error pausing campaign:', error);
        res.status(500).json({ error: 'Failed to pause campaign' });
    }
});

/**
 * PATCH /api/sourcing/campaigns/:id/resume
 * Resume a paused campaign
 */
router.patch('/campaigns/:id/resume', async (req, res) => {
    try {
        const result = await sourcingCampaignManager.resumeCampaign(parseInt(req.params.id));
        res.json(result);
    } catch (error) {
        console.error('Error resuming campaign:', error);
        res.status(500).json({ error: 'Failed to resume campaign' });
    }
});

/**
 * GET /api/sourcing/campaigns/:id/candidates
 * Get candidates found by a campaign
 */
router.get('/campaigns/:id/candidates', async (req, res) => {
    try {
        const [candidates] = await pool.query(`
            SELECT * FROM sourced_candidates 
            WHERE campaign_id = ?
            ORDER BY ai_match_score DESC
        `, [req.params.id]);

        res.json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

/**
 * GET /api/sourcing/sources
 * Get all job board sources and their status
 */
router.get('/sources', async (req, res) => {
    try {
        const [sources] = await pool.query('SELECT * FROM job_board_sources ORDER BY priority ASC');
        const connectorStatus = jobBoardConnector.getSourcesStatus();

        // Merge database info with connector status
        const merged = sources.map(source => ({
            ...source,
            connector_status: connectorStatus.find(s => s.id === source.nombre.toLowerCase())
        }));

        res.json(merged);
    } catch (error) {
        console.error('Error fetching sources:', error);
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
});

/**
 * POST /api/sourcing/search
 * Manual search across job boards (for testing)
 */
router.post('/search', async (req, res) => {
    try {
        const { job_description, filters } = req.body;

        if (!job_description) {
            return res.status(400).json({ error: 'job_description is required' });
        }

        const results = await jobBoardConnector.searchCandidates(job_description, filters || {});
        res.json(results);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Failed to search candidates' });
    }
});

/**
 * POST /api/sourcing/score
 * Score a candidate against job requirements
 */
router.post('/score', async (req, res) => {
    try {
        const { candidate, job_requirements } = req.body;

        if (!candidate || !job_requirements) {
            return res.status(400).json({ error: 'candidate and job_requirements are required' });
        }

        const score = await aiMatchingEngine.scoreCandidate(candidate, job_requirements);
        res.json(score);
    } catch (error) {
        console.error('Error scoring:', error);
        res.status(500).json({ error: 'Failed to score candidate' });
    }
});

/**
 * GET /api/sourcing/analytics
 * Get overall sourcing analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        const [totalCampaigns] = await pool.query('SELECT COUNT(*) as count FROM sourcing_campaigns');
        const [activeCampaigns] = await pool.query('SELECT COUNT(*) as count FROM sourcing_campaigns WHERE estado = "active"');
        const [totalCandidates] = await pool.query('SELECT COUNT(*) as count FROM sourced_candidates');
        const [avgScore] = await pool.query('SELECT AVG(ai_match_score) as avg FROM sourced_candidates');

        const [bySource] = await pool.query(`
            SELECT fuente, COUNT(*) as count, AVG(ai_match_score) as avg_score
            FROM sourced_candidates
            GROUP BY fuente
            ORDER BY count DESC
        `);

        const [byStatus] = await pool.query(`
            SELECT estado, COUNT(*) as count
            FROM sourced_candidates
            GROUP BY estado
        `);

        const [topCandidates] = await pool.query(`
            SELECT sc.*, c.nombre as campaign_name
            FROM sourced_candidates sc
            LEFT JOIN sourcing_campaigns c ON sc.campaign_id = c.id
            WHERE sc.ai_match_score >= 80
            ORDER BY sc.ai_match_score DESC
            LIMIT 20
        `);

        res.json({
            overview: {
                total_campaigns: totalCampaigns[0].count,
                active_campaigns: activeCampaigns[0].count,
                total_candidates: totalCandidates[0].count,
                avg_match_score: Math.round(avgScore[0].avg || 0)
            },
            by_source: bySource,
            by_status: byStatus,
            top_candidates: topCandidates
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * POST /api/sourcing/outreach
 * Generate personalized outreach message
 */
router.post('/outreach', async (req, res) => {
    try {
        const { candidate, vacancy } = req.body;

        if (!candidate || !vacancy) {
            return res.status(400).json({ error: 'candidate and vacancy are required' });
        }

        const message = await aiMatchingEngine.generateOutreachMessage(candidate, vacancy);
        res.json(message);
    } catch (error) {
        console.error('Error generating outreach:', error);
        res.status(500).json({ error: 'Failed to generate outreach message' });
    }
});

module.exports = router;
