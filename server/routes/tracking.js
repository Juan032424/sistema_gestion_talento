const express = require('express');
const router = express.Router();
const trackingService = require('../services/ApplicationTrackingService');

/**
 * POST /api/tracking/create/:applicationId
 * Crear link mágico para una postulación
 */
router.post('/create/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;

        const result = await trackingService.createTrackingLink(applicationId);

        res.json(result);

    } catch (error) {
        console.error('Error creating tracking link:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tracking/:token
 * Obtener status de postulación con tracking token
 */
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await trackingService.getApplicationStatus(token);

        res.json(result);

    } catch (error) {
        console.error('Error getting application status:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/tracking/:token/feedback
 * Actualizar feedback del candidato
 */
router.post('/:token/feedback', async (req, res) => {
    try {
        const { token } = req.params;
        const { notes, rating, feedback } = req.body;

        const result = await trackingService.updateCandidateFeedback(token, {
            notes,
            rating,
            feedback
        });

        res.json(result);

    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/tracking/:token/notification/:notificationId/read
 * Marcar notificación como leída
 */
router.post('/:token/notification/:notificationId/read', async (req, res) => {
    try {
        const { token, notificationId } = req.params;

        const result = await trackingService.markNotificationAsRead(notificationId, token);

        res.json(result);

    } catch (error) {
        console.error('Error marking notification:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/tracking/send-notification/:applicationId
 * Enviar notificación a candidato (para uso interno)
 */
router.post('/send-notification/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { tipo, titulo, mensaje, actionUrl } = req.body;

        const result = await trackingService.sendNotification(
            applicationId,
            tipo,
            titulo,
            mensaje,
            actionUrl
        );

        res.json(result);

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
