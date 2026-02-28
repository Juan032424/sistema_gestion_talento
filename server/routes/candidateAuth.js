const express = require('express');
const router = express.Router();
const candidateAuthService = require('../services/CandidateAuthService');
const authenticateCandidate = require('../middleware/authenticateCandidate');
const activityLogService = require('../services/ActivityLogService');

// POST /api/candidate-auth/register
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, telefono, password, ciudad, titulo_profesional } = req.body;
        const result = await candidateAuthService.register({
            nombre, email, telefono, password, ciudad, titulo_profesional
        });

        // Log activity
        await activityLogService.logActivity(
            result.candidate.id,
            'REGISTER',
            'Se registró como nuevo candidato en el portal',
            null,
            { email }
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/candidate-auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await candidateAuthService.login(email, password);

        // Log activity
        await activityLogService.logActivity(
            result.candidate.id,
            'LOGIN',
            'Inició sesión en el portal público'
        );

        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// GET /api/candidate-auth/profile (requiere autenticación)
router.get('/profile', authenticateCandidate, async (req, res) => {
    try {
        const candidate = await candidateAuthService.getProfile(req.candidateId, req.candidateSystem);
        res.json({ candidate });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// PUT /api/candidate-auth/profile (requiere autenticación)
router.put('/profile', authenticateCandidate, async (req, res) => {
    try {
        const candidate = await candidateAuthService.updateProfile(req.candidateId, req.body, req.candidateSystem);

        // Log activity
        await activityLogService.logActivity(
            req.candidateId,
            'UPDATE_PROFILE',
            'Actualizó su información de perfil'
        );

        res.json({ candidate });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/candidate-auth/my-applications (requiere autenticación)
router.get('/my-applications', authenticateCandidate, async (req, res) => {
    try {
        const applications = await candidateAuthService.getMyApplications(req.candidateId, req.candidateSystem);
        res.json({ applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/candidate-auth/saved-jobs (requiere autenticación)
router.get('/saved-jobs', authenticateCandidate, async (req, res) => {
    try {
        const savedJobs = await candidateAuthService.getSavedJobs(req.candidateId, req.candidateSystem);
        res.json({ savedJobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/candidate-auth/saved-jobs/:vacancyId (requiere autenticación)
router.post('/saved-jobs/:vacancyId', authenticateCandidate, async (req, res) => {
    try {
        await candidateAuthService.saveJob(req.candidateId, req.params.vacancyId, req.candidateSystem);

        // Log activity
        await activityLogService.logActivity(
            req.candidateId,
            'SAVE_JOB',
            `Guardó la vacante ID ${req.params.vacancyId}`,
            req.params.vacancyId
        );

        res.json({ success: true, message: 'Vacante guardada' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/candidate-auth/saved-jobs/:vacancyId (requiere autenticación)
router.delete('/saved-jobs/:vacancyId', authenticateCandidate, async (req, res) => {
    try {
        await candidateAuthService.removeSavedJob(req.candidateId, req.params.vacancyId, req.candidateSystem);

        // Log activity
        await activityLogService.logActivity(
            req.candidateId,
            'REMOVE_SAVED_JOB',
            `Eliminó la vacante ID ${req.params.vacancyId} de sus favoritos`,
            req.params.vacancyId
        );

        res.json({ success: true, message: 'Vacante eliminada de guardados' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/candidate-auth/track-view/:vacancyId (requiere autenticación o opcional)
router.post('/track-view/:vacancyId', async (req, res) => {
    try {
        const { vacancyId } = req.params;
        const { candidateId, interactionType } = req.body; // El frontend envía el ID si está logueado

        if (candidateId) {
            let type = interactionType || 'VIEW_JOB';
            let description = '';

            switch (type) {
                case 'START_APPLICATION':
                    description = `Inició el proceso de postulación para la vacante ID ${vacancyId}`;
                    break;
                case 'ABANDON_APPLICATION':
                    description = `Abandonó el formulario de postulación para la vacante ID ${vacancyId}`;
                    break;
                case 'VIEW_JOB':
                default:
                    description = `Visualizó los detalles de la vacante ID ${vacancyId}`;
                    type = 'VIEW_JOB';
            }

            await activityLogService.logActivity(
                candidateId,
                type,
                description,
                vacancyId
            );
        }

        // Solo incrementamos el contador de vistas si es una vista real (no un inicio de postulación)
        if (!interactionType || interactionType === 'VIEW_JOB') {
            await pool.query(
                'UPDATE public_job_postings SET views_count = views_count + 1 WHERE vacante_id = ?',
                [vacancyId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking view/interaction:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
