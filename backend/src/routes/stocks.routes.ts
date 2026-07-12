import { Router } from 'express';
import { stocksController } from '../controllers/stocks.controller';

const router = Router();

// Stock quote endpoints
router.get('/search', (req, res) => stocksController.search(req, res));
router.get('/quote/:symbol', (req, res) => stocksController.getQuote(req, res));
router.post('/batch', (req, res) => stocksController.getBatch(req, res));
router.get('/historical/:symbol', (req, res) => stocksController.getHistoricalData(req, res));
router.get('/intraday/:symbol', (req, res) => stocksController.getIntradayData(req, res));

// AI-powered endpoints
router.get('/ai-summary/:symbol', (req, res) => stocksController.getStockSummary(req, res));
router.get('/market-summary', (req, res) => stocksController.getMarketSummary(req, res));
router.get('/trading-insights/:symbol', (req, res) => stocksController.getTradingInsights(req, res));

// News functionality
router.get('/news', (req, res) => stocksController.getNews(req, res));

// Market movers
router.get('/gainers', (req, res) => stocksController.getTopGainers(req, res));
router.get('/losers', (req, res) => stocksController.getTopLosers(req, res));
router.get('/volume', (req, res) => stocksController.getHighVolume(req, res));

export default router;
