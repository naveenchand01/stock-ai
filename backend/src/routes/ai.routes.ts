import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';

const router = Router();

// AI Chat endpoints
router.post('/chat', (req, res) => aiController.chat(req, res));
router.post('/summarize-news', (req, res) => aiController.summarizeNews(req, res));

export default router;
