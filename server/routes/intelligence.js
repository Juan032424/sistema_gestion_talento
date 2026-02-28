const express = require('express');
const router = express.Router();
const workplaceIntelligence = require('../services/WorkplaceIntelligence');

/**
 * POST /api/intelligence/ask
 * Ask robust questions about the environment
 */
router.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`[Intelligence API] Question: "${question}"`);

        // Get response from AI service
        const answer = await workplaceIntelligence.ask(question);

        console.log(`[Intelligence API] Response type: ${typeof answer}`);

        // Always return in consistent format
        res.json({ answer: answer });

    } catch (error) {
        console.error('[Intelligence API] Error:', error);
        res.status(500).json({
            error: 'Failed to process question',
            answer: 'Lo siento, tuve un problema al procesar tu pregunta. Por favor intenta de nuevo.'
        });
    }
});

/**
 * GET /api/intelligence/recommendations
 * Get proactive recommendations to decrease search time
 */
router.get('/recommendations', async (req, res) => {
    try {
        const recommendations = await workplaceIntelligence.getSearchOptimizationRecommendations();
        res.json(recommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

module.exports = router;
