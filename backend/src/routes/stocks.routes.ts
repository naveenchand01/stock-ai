import { Router } from 'express';
import { stocksController } from '../controllers/stocks.controller';

const router = Router();

// Stock quote endpoints
router.get('/quote/:symbol', (req, res) => stocksController.getQuote(req, res));
router.post('/batch', (req, res) => stocksController.getBatch(req, res));

// Market movers
router.get('/gainers', (req, res) => stocksController.getTopGainers(req, res));
router.get('/losers', (req, res) => stocksController.getTopLosers(req, res));
router.get('/volume', (req, res) => stocksController.getHighVolume(req, res));

export default router;
