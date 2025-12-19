import { yahooFinanceApi } from './yahooFinance.service';
import { cacheService } from './cache.service';
import { getStockMapping, getIndexMapping, STOCK_MAPPINGS, MARKET_INDICES } from '../config/symbols';
import {
  transformYahooQuoteToStock,
  transformYahooIndexToMarketIndex,
  Stock,
  MarketIndex,
} from '../utils/dataTransform';
import logger from '../utils/logger';

class StocksService {
  /**
   * Get quote for a single stock
   */
  async getQuote(symbol: string): Promise<Stock> {
    const cacheKey = `quote:${symbol}`;

    // Try to get from cache
    const cached = cacheService.get<Stock>(cacheKey);
    if (cached) {
      return cached;
    }

    const mapping = getStockMapping(symbol);
    if (!mapping) {
      throw new Error(`Unknown stock symbol: ${symbol}`);
    }

    // Fetch real data from Yahoo Finance API
    try {
      const data = await yahooFinanceApi.getQuote(mapping.yahooSymbol);

      const stock = transformYahooQuoteToStock(data, mapping.displaySymbol, mapping.name);
      cacheService.set(cacheKey, stock, 60); // Cache for 60 seconds
      return stock;
    } catch (error) {
      logger.error(`Failed to fetch quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple stocks (batch request)
   */
  async getBatch(symbols: string[]): Promise<Stock[]> {
    try {
      // Map symbols to Yahoo Finance symbols
      const yahooSymbols = symbols
        .map((symbol) => {
          const mapping = getStockMapping(symbol);
          return mapping ? { original: symbol, yahoo: mapping.yahooSymbol, mapping } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (yahooSymbols.length === 0) {
        return [];
      }

      // Fetch all quotes in batch from Yahoo Finance
      const yahooQuotesResult = await yahooFinanceApi.getQuotes(yahooSymbols.map((s) => s.yahoo));

      // yahooFinance.quote() returns an array when passed an array of symbols
      const yahooQuotes = Array.isArray(yahooQuotesResult) ? yahooQuotesResult : [yahooQuotesResult];

      // Transform the results
      const stocks: Stock[] = [];
      for (let i = 0; i < yahooQuotes.length; i++) {
        const quote = yahooQuotes[i];
        const { original, mapping } = yahooSymbols[i];

        try {
          const stock = transformYahooQuoteToStock(quote, mapping.displaySymbol, mapping.name);
          stocks.push(stock);

          // Cache individual stock
          const cacheKey = `quote:${original}`;
          cacheService.set(cacheKey, stock, 60);
        } catch (error) {
          logger.error(`Failed to transform quote for ${original}:`, error);
        }
      }

      return stocks;
    } catch (error) {
      logger.error('Failed to fetch batch quotes:', error);
      throw error;
    }
  }

  /**
   * Get top gainers (stocks with highest positive change%)
   */
  async getTopGainers(): Promise<Stock[]> {
    const cacheKey = 'top:gainers';

    // Try to get from cache
    const cached = cacheService.get<Stock[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // For now, fetch a sample of Indian stocks and sort by change%
    const sampleSymbols = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'ITC', 'SBIN'];

    try {
      const stocks = await this.getBatch(sampleSymbols);
      const gainers = stocks
        .filter((stock) => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5)
        .map((stock) => ({
          symbol: stock.symbol,
          value: `₹${stock.price.toFixed(2)}`,
          change: stock.changePercent,
        }));

      cacheService.set(cacheKey, gainers as any, 300); // Cache for 5 minutes
      return gainers as any;
    } catch (error) {
      logger.error('Failed to fetch top gainers:', error);
      throw error;
    }
  }

  /**
   * Get top losers (stocks with highest negative change%)
   */
  async getTopLosers(): Promise<Stock[]> {
    const cacheKey = 'top:losers';

    // Try to get from cache
    const cached = cacheService.get<Stock[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // For now, fetch a sample of Indian stocks and sort by change%
    const sampleSymbols = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'ITC', 'SBIN'];

    try {
      const stocks = await this.getBatch(sampleSymbols);
      const losers = stocks
        .filter((stock) => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5)
        .map((stock) => ({
          symbol: stock.symbol,
          value: `₹${stock.price.toFixed(2)}`,
          change: stock.changePercent,
        }));

      cacheService.set(cacheKey, losers as any, 300); // Cache for 5 minutes
      return losers as any;
    } catch (error) {
      logger.error('Failed to fetch top losers:', error);
      throw error;
    }
  }

  /**
   * Get high volume stocks
   */
  async getHighVolume(): Promise<Stock[]> {
    const cacheKey = 'top:volume';

    // Try to get from cache
    const cached = cacheService.get<Stock[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // For now, return a sample - ideally would sort by actual volume
    const sampleSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY'];

    try {
      const stocks = await this.getBatch(sampleSymbols);
      const highVolume = stocks.slice(0, 5).map((stock) => ({
        symbol: stock.symbol,
        value: `${(Math.random() * 100).toFixed(1)}M`, // Mock volume for now
        change: stock.changePercent,
      }));

      cacheService.set(cacheKey, highVolume as any, 300); // Cache for 5 minutes
      return highVolume as any;
    } catch (error) {
      logger.error('Failed to fetch high volume stocks:', error);
      throw error;
    }
  }

  /**
   * Get all major market indices
   */
  async getMarketIndices(): Promise<MarketIndex[]> {
    const cacheKey = 'indices:all';

    // Try to get from cache
    const cached = cacheService.get<MarketIndex[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get all index symbols from MARKET_INDICES
      const indexNames = Object.keys(MARKET_INDICES);
      const yahooSymbols = indexNames.map((name) => {
        const mapping = getIndexMapping(name);
        return mapping ? { name, yahoo: mapping.yahooSymbol, displayName: mapping.displayName } : null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      // Fetch all indices in batch
      const yahooQuotesResult = await yahooFinanceApi.getQuotes(yahooSymbols.map((s) => s.yahoo));

      // yahooFinance.quote() returns an array when passed an array of symbols
      const yahooQuotes = Array.isArray(yahooQuotesResult) ? yahooQuotesResult : [yahooQuotesResult];

      // Transform the results
      const indices: MarketIndex[] = [];
      for (let i = 0; i < yahooQuotes.length; i++) {
        const quote = yahooQuotes[i];
        const { displayName } = yahooSymbols[i];

        try {
          const index = transformYahooIndexToMarketIndex(quote, displayName);
          indices.push(index);
        } catch (error) {
          logger.error(`Failed to transform index ${displayName}:`, error);
        }
      }

      cacheService.set(cacheKey, indices, 60); // Cache for 60 seconds
      return indices;
    } catch (error) {
      logger.error('Failed to fetch market indices:', error);
      throw error;
    }
  }

  /**
   * Get historical data for a stock
   */
  async getHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d') {
    const cacheKey = `historical:${symbol}:${period}:${interval}`;

    // Try to get from cache
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const mapping = getStockMapping(symbol);
    if (!mapping) {
      throw new Error(`Unknown stock symbol: ${symbol}`);
    }

    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '5d':
          startDate.setDate(endDate.getDate() - 5);
          break;
        case '1mo':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3mo':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6mo':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '5y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }

      const data = await yahooFinanceApi.getHistoricalData(
        mapping.yahooSymbol,
        startDate,
        endDate,
        interval as '1d' | '1wk' | '1mo'
      );

      // Cache for 5 minutes for historical data
      cacheService.set(cacheKey, data, 300);
      return data;
    } catch (error) {
      logger.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw error;
    }
  }
}

export const stocksService = new StocksService();
