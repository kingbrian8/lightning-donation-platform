import express from 'express';

const router = express.Router();

export default function createAIRoutes(aiService, converterService) {

    // POST /api/ai/chat - Chat with the AI assistant
    router.post('/chat', async (req, res, next) => {
        try {
            const { message } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }
            const response = await aiService.generateResponse(message);
            res.json({ response });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/ai/help - Get structured help content
    router.get('/help', (req, res) => {
        const helpContent = aiService.getHelpContent();
        res.json(helpContent);
    });

    // GET /api/ai/lessons - Get structured Bitcoin & Lightning lessons
    router.get('/lessons', (req, res) => {
        const lessons = aiService.getLessons();
        res.json(lessons);
    });

    // GET /api/ai/convert - Convert between sats and fiat
    router.get('/convert', async (req, res, next) => {
        try {
            const { amount, from, to } = req.query;

            if (!amount) {
                const rates = await converterService.getRates();
                return res.json({ rates });
            }

            let result;
            if (from === 'sats') {
                result = await converterService.convertSatsToFiat(parseFloat(amount), to || 'usd');
            } else if (to === 'sats') {
                result = await converterService.convertFiatToSats(parseFloat(amount), from || 'usd');
            } else {
                return res.status(400).json({ error: 'Invalid conversion parameters' });
            }

            res.json({ result });
        } catch (error) {
            next(error);
        }
    });

    return router;
}
