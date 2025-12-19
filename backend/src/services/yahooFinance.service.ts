import YahooFinanceClass from 'yahoo-finance2';
import logger from '../utils/logger';

class YahooFinanceService {
  private yahooFinance: any;

  constructor() {
    // Instantiate the Yahoo Finance client
    this.yahooFinance = new YahooFinanceClass();
  }

  /**
   * Get quote for a single stock
   * @param symbol Stock symbol (e.g., AAPL, GOOGL, TCS.NS for NSE stocks)
   */
  async getQuote(symbol: string) {
    try {
      logger.debug(`Yahoo Finance API Request: GET quote for ${symbol}`);

      const quote = await this.yahooFinance.quote(symbol);

      logger.debug(`Yahoo Finance API Response: Successfully fetched quote for ${symbol}`);
      return quote;
    } catch (error: any) {
      logger.error(`Failed to get quote for ${symbol}:`, {
        message: error.message,
        symbol,
      });
      throw error;
    }
  }

  /**
   * Get quotes for multiple stocks in batch
   * @param symbols Array of stock symbols
   */
  async getQuotes(symbols: string[]) {
    try {
      logger.debug(`Yahoo Finance API Request: GET quotes for ${symbols.length} symbols`);

      const quotes = await this.yahooFinance.quote(symbols);

      logger.debug(`Yahoo Finance API Response: Successfully fetched ${symbols.length} quotes`);
      return quotes;
    } catch (error: any) {
      logger.error('Failed to get quotes:', {
        message: error.message,
        symbols,
      });
      throw error;
    }
  }

  /**
   * Get historical data for a stock
   * @param symbol Stock symbol
   * @param period1 Start date
   * @param period2 End date (optional, defaults to now)
   * @param interval Data interval (1d, 1wk, 1mo, etc.)
   */
  async getHistoricalData(
    symbol: string,
    period1: Date | string,
    period2?: Date | string,
    interval: '1d' | '1wk' | '1mo' = '1d'
  ) {
    try {
      logger.debug(`Yahoo Finance API Request: GET historical data for ${symbol}`);

      const queryOptions = {
        period1,
        period2: period2 || new Date(),
        interval,
      };

      const result = await this.yahooFinance.historical(symbol, queryOptions);

      logger.debug(`Yahoo Finance API Response: Successfully fetched historical data for ${symbol}`);
      return result;
    } catch (error: any) {
      logger.error(`Failed to get historical data for ${symbol}:`, {
        message: error.message,
        symbol,
      });
      throw error;
    }
  }

  /**
   * Search for stocks
   * @param query Search query
   */
  async searchStocks(query: string) {
    try {
      logger.debug(`Yahoo Finance API Request: SEARCH for "${query}"`);

      const results = await this.yahooFinance.search(query);
      const resultCount = (results as any)?.quotes?.length || 0;

      logger.debug(`Yahoo Finance API Response: Found ${resultCount} results`);
      return results;
    } catch (error: any) {
      logger.error(`Failed to search stocks with query "${query}":`, {
        message: error.message,
        query,
      });
      throw error;
    }
  }

  /**
   * Get market summary (indices)
   */
  async getMarketSummary() {
    try {
      logger.debug('Yahoo Finance API Request: GET market summary');

      const summary = await this.yahooFinance.quoteSummary('^GSPC', {
        modules: ['price', 'summaryDetail'],
      });

      logger.debug('Yahoo Finance API Response: Successfully fetched market summary');
      return summary;
    } catch (error: any) {
      logger.error('Failed to get market summary:', {
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Get trending stocks
   * @param region Region code (US, IN, etc.)
   */
  async getTrendingStocks(region: string = 'US') {
    try {
      logger.debug(`Yahoo Finance API Request: GET trending for ${region}`);

      const trending = await this.yahooFinance.trendingSymbols(region);
      const trendingCount = (trending as any)?.quotes?.length || 0;

      logger.debug(`Yahoo Finance API Response: Found ${trendingCount} trending stocks`);
      return trending;
    } catch (error: any) {
      logger.error(`Failed to get trending stocks for ${region}:`, {
        message: error.message,
        region,
      });
      throw error;
    }
  }
}

export const yahooFinanceApi = new YahooFinanceService();
