const express = require('express');
const router = express.Router();
const applicationService = require('../services/ApplicationService');
const pool = require('../db');

/**
 * POST /api/applications/apply
 * Candidato se postula a una vacante
 */
router.post('/apply', async (req, res) => {
    try {
        const { vacancyId, candidateData } = req.body;

        if (!vacancyId || !candidateData) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const result = await applicationService.applyToJob(vacancyId, candidateData);
        res.json(result);

    } catch (error) {
        console.error('Error in apply:', error);
        res.status(500).json({ error: 'Error al procesar la postulación' });
    }
});

/**
 * GET /api/applications/vacancy/:id
 * Obtener todas las postulaciones de una vacante
 */
router.get('/vacancy/:id', async (req, res) => {
    try {
        const vacancyId = req.params.id;
        const filters = {
            estado: req.query.estado
        };

        const applications = await applicationService.getApplicationsByVacancy(vacancyId, filters);
        res.json(applications);

    } catch (error) {
        console.error('Error getting vacancy applications:', error);
        res.status(500).json({ error: 'Error al obtener postulaciones' });
    }
});

/**
 * GET /api/applications/candidate/:email
 * Obtener postulaciones de un candidato por email
 */
router.get('/candidate/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const applications = await applicationService.getApplicationsByCandidate(email);
        res.json(applications);

    } catch (error) {
        console.error('Error getting candidate applications:', error);
        res.status(500).json({ error: 'Error al obtener postulaciones' });
    }
});

/**
 * PUT /api/applications/:id/status
 * Actualizar estado de una postulación
 */
router.put('/:id/status', async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Estado requerido' });
        }

        await applicationService.updateApplicationStatus(applicationId, status, notes);
        res.json({ success: true });

    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

/**
 * GET /api/applications/matches/:vacancyId
 * Obtener matches automáticos para una vacante
 */
router.get('/matches/:vacancyId', async (req, res) => {
    try {
        const vacancyId = req.params.vacancyId;
        const minScore = parseInt(req.query.minScore) || 70;

        const matches = await applicationService.findAutoMatches(vacancyId, minScore);
        res.json(matches);

    } catch (error) {
        console.error('Error finding matches:', error);
        res.status(500).json({ error: 'Error al buscar matches' });
    }
});

/**
 * GET /api/applications/stats
 * Estadísticas generales de postulaciones
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await applicationService.getApplicationStats(null);
        res.json(stats);

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/applications/stats/:vacancyId
 * Estadísticas de postulaciones por vacante
 */
router.get('/stats/:vacancyId', async (req, res) => {
    try {
        const vacancyId = req.params.vacancyId;
        const stats = await applicationService.getApplicationStats(vacancyId);
        res.json(stats);

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/applications/public/jobs
 * Obtener todas las vacantes públicas (para el portal)
 */
router.get('/public/jobs', async (req, res) => {
    try {
        const [jobs] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.observaciones as descripcion,
                '' as ubicacion,
                v.salario_base as salario_min,
                v.presupuesto_max as salario_max,
                0 as experiencia_requerida,
                '' as tipo_contrato,
                '' as modalidad_trabajo,
                v.fecha_apertura as fecha_creacion,
                pj.slug,
                pj.views_count,
                pj.applications_count,
                pj.is_featured
            FROM vacantes v
            INNER JOIN public_job_postings pj ON v.id = pj.vacante_id
            WHERE v.estado = 'Abierta' 
            AND pj.is_public = TRUE
            AND (pj.expires_at IS NULL OR pj.expires_at > NOW())
            ORDER BY pj.is_featured DESC, v.fecha_apertura DESC
        `);

        res.json(jobs);

    } catch (error) {
        console.error('Error getting public jobs:', error);
        res.status(500).json({ error: 'Error al obtener vacantes' });
    }
});

/**
 * GET /api/applications/public/jobs/:slug
 * Obtener detalle de una vacante pública por slug
 */
router.get('/public/jobs/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;

        const [jobs] = await pool.query(`
            SELECT 
                v.*,
                pj.slug,
                pj.views_count,
                pj.applications_count,
                pj.is_featured,
                c.nombre as empresa_nombre
            FROM vacantes v
            INNER JOIN public_job_postings pj ON v.id = pj.vacante_id
            LEFT JOIN empresas c ON v.empresa_id = c.id
            WHERE pj.slug = ?
            AND v.estado = 'Abierta'
            AND pj.is_public = TRUE
        `, [slug]);

        if (jobs.length === 0) {
            return res.status(404).json({ error: 'Vacante no encontrada' });
        }

        // Incrementar contador de vistas
        await pool.query(
            'UPDATE public_job_postings SET views_count = views_count + 1 WHERE slug = ?',
            [slug]
        );

        res.json(jobs[0]);

    } catch (error) {
        console.error('Error getting job detail:', error);
        res.status(500).json({ error: 'Error al obtener vacante' });
    }
});

/**
 * POST /api/applications/public/toggle/:vacancyId
 * Hacer una vacante pública o privada
 */
router.post('/public/toggle/:vacancyId', async (req, res) => {
    try {
        const vacancyId = req.params.vacancyId;
        const { isPublic } = req.body;

        // Verificar si existe el registro
        const [existing] = await pool.query(
            'SELECT * FROM public_job_postings WHERE vacante_id = ?',
            [vacancyId]
        );

        if (existing.length > 0) {
            // Actualizar
            await pool.query(
                'UPDATE public_job_postings SET is_public = ? WHERE vacante_id = ?',
                [isPublic, vacancyId]
            );
        } else {
            // Crear con slug
            const [vacancy] = await pool.query('SELECT puesto_nombre FROM vacantes WHERE id = ?', [vacancyId]);
            if (vacancy.length > 0) {
                const slug = vacancy[0].puesto_nombre
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');

                await pool.query(
                    'INSERT INTO public_job_postings (vacante_id, slug, is_public) VALUES (?, ?, ?)',
                    [vacancyId, slug, isPublic]
                );
            }
        }

        res.json({ success: true, isPublic });

    } catch (error) {
        console.error('Error toggling public status:', error);
        res.status(500).json({ error: 'Error al cambiar visibilidad' });
    }
});

module.exports = router;
