import { Request, Response } from 'express';
import { stocksService } from '../services/stocks.service';
import { geminiService } from '../services/gemini.service';
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
      return res.json({ data: stock });
    } catch (error: any) {
      logger.error('Error in getQuote:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch stock quote' });
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
      return res.json({ data: stocks });
    } catch (error: any) {
      logger.error('Error in getBatch:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch stock quotes' });
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

  /**
   * GET /api/stocks/historical/:symbol
   * Get historical data for a stock
   */
  async getHistoricalData(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const { period = '1mo', interval = '1d' } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const data = await stocksService.getHistoricalData(
        symbol.toUpperCase(),
        period as string,
        interval as string
      );
      return res.json({ data });
    } catch (error: any) {
      logger.error('Error in getHistoricalData:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch historical data' });
    }
  }

  /**
   * GET /api/stocks/ai-summary/:symbol
   * Get AI-generated summary for a stock
   */
  async getStockSummary(req: Request, res: Response) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const stock = await stocksService.getQuote(symbol.toUpperCase());
      const summary = await geminiService.generateStockSummary({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
      });

      return res.json({ data: { summary } });
    } catch (error: any) {
      logger.error('Error in getStockSummary:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate stock summary' });
    }
  }

  /**
   * GET /api/stocks/market-summary
   * Get AI-generated overall market summary
   */
  async getMarketSummary(req: Request, res: Response) {
    try {
      const indices = await stocksService.getMarketIndices();
      const gainers = await stocksService.getTopGainers();
      const losers = await stocksService.getTopLosers();

      // Transform Stock[] to the format expected by geminiService
      const topGainers = gainers.map(stock => ({
        symbol: stock.symbol,
        value: `$${stock.price.toFixed(2)}`,
        change: stock.changePercent,
      }));

      const topLosers = losers.map(stock => ({
        symbol: stock.symbol,
        value: `$${stock.price.toFixed(2)}`,
        change: stock.changePercent,
      }));

      const summary = await geminiService.generateMarketSummary({
        indices,
        topGainers,
        topLosers,
      });

      return res.json({ data: { summary } });
    } catch (error: any) {
      logger.error('Error in getMarketSummary:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate market summary' });
    }
  }

  /**
   * GET /api/stocks/trading-insights/:symbol
   * Get AI-generated trading insights for a stock
   */
  async getTradingInsights(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const { period = '1mo' } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const stock = await stocksService.getQuote(symbol.toUpperCase());
      const historicalData = await stocksService.getHistoricalData(
        symbol.toUpperCase(),
        period as string,
        '1d'
      );

      const insights = await geminiService.generateTradingInsights({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.price,
        historicalData,
      });

      return res.json({ data: { insights } });
    } catch (error: any) {
      logger.error('Error in getTradingInsights:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate trading insights' });
    }
  }
}

export const stocksController = new StocksController();
