import { growwApi } from './growwApi.service';
import { cacheService } from './cache.service';
import { getStockMapping, getIndexMapping, isRealStock, STOCK_MAPPINGS, MARKET_INDICES } from '../config/symbols';
import {
  transformGrowwQuoteToStock,
  transformGrowwIndexToMarketIndex,
  generateMockStock,
  generateMockIndex,
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

    // If it's a mock stock, generate mock data
    if (mapping.isMock) {
      const mockStock = generateMockStock(symbol);
      cacheService.set(cacheKey, mockStock, 60); // Cache for 60 seconds
      return mockStock;
    }

    // Fetch real data from Groww API
    try {
      const data = await growwApi.getQuote(
        mapping.exchange,
        mapping.segment,
        mapping.tradingSymbol
      );

      const stock = transformGrowwQuoteToStock(data);
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
    // Process in parallel
    const promises = symbols.map((symbol) => this.getQuote(symbol));
    return Promise.all(promises);
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

    const indices: MarketIndex[] = [];

    // Fetch Indian indices from Groww
    const indianIndices = ['NIFTY 50', 'SENSEX', 'BANKNIFTY'];
    for (const indexName of indianIndices) {
      const mapping = getIndexMapping(indexName);
      if (mapping && mapping.exchange !== 'MOCK') {
        try {
          const data = await growwApi.getQuote(mapping.exchange, 'CASH', mapping.tradingSymbol);
          const index = transformGrowwIndexToMarketIndex(data, mapping.displayName);
          indices.push(index);
        } catch (error) {
          logger.error(`Failed to fetch index ${indexName}:`, error);
        }
      }
    }

    // Add mock US indices
    const usIndices = ['NASDAQ', 'S&P 500', 'DOW JONES'];
    for (const indexName of usIndices) {
      indices.push(generateMockIndex(indexName));
    }

    cacheService.set(cacheKey, indices, 60); // Cache for 60 seconds
    return indices;
  }
}

export const stocksService = new StocksService();
