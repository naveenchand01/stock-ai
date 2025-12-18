import { Request, Response } from 'express';
import { stocksService } from '../services/stocks.service';
import logger from '../utils/logger';

export class StocksController {
  /**
   * GET /api/stocks/quote/:symbol
   * Get quote for a single stock
   */
  async getQuote(req: Request, res: Response) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const stock = await stocksService.getQuote(symbol.toUpperCase());
      res.json({ data: stock });
    } catch (error: any) {
      logger.error('Error in getQuote:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch stock quote' });
    }
  }

  /**
   * POST /api/stocks/batch
   * Get quotes for multiple stocks
   */
  async getBatch(req: Request, res: Response) {
    try {
      const { symbols } = req.body;

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({ error: 'Symbols array is required' });
      }

      const stocks = await stocksService.getBatch(symbols.map((s) => s.toUpperCase()));
      res.json({ data: stocks });
    } catch (error: any) {
      logger.error('Error in getBatch:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch stock quotes' });
    }
  }

  /**
   * GET /api/stocks/gainers
   * Get top gaining stocks
   */
  async getTopGainers(req: Request, res: Response) {
    try {
      const gainers = await stocksService.getTopGainers();
      res.json({ data: gainers });
    } catch (error: any) {
      logger.error('Error in getTopGainers:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch top gainers' });
    }
  }

  /**
   * GET /api/stocks/losers
   * Get top losing stocks
   */
  async getTopLosers(req: Request, res: Response) {
    try {
      const losers = await stocksService.getTopLosers();
      res.json({ data: losers });
    } catch (error: any) {
      logger.error('Error in getTopLosers:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch top losers' });
    }
  }

  /**
   * GET /api/stocks/volume
   * Get high volume stocks
   */
  async getHighVolume(req: Request, res: Response) {
    try {
      const highVolume = await stocksService.getHighVolume();
      res.json({ data: highVolume });
    } catch (error: any) {
      logger.error('Error in getHighVolume:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch high volume stocks' });
    }
  }

  /**
   * GET /api/indices
   * Get all market indices
   */
  async getMarketIndices(req: Request, res: Response) {
    try {
      const indices = await stocksService.getMarketIndices();
      res.json({ data: indices });
    } catch (error: any) {
      logger.error('Error in getMarketIndices:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch market indices' });
    }
  }
}

export const stocksController = new StocksController();
