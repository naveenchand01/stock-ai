import YahooFinanceClass from 'yahoo-finance2';
import logger from '../utils/logger';

class YahooFinanceService {
  private yahooFinance: any;

  constructor() {
    // Instantiate the Yahoo Finance client with configuration
    // We use a custom fetch wrapper to set the User-Agent to avoid 429 errors
    this.yahooFinance = new YahooFinanceClass({
      queue: {
        concurrency: 2 // Limit concurrent requests
      },
      fetch: async (url: any, init?: any) => {
        const headers = {
          ...init?.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        return fetch(url, { ...init, headers });
      }
    });
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
   * @param interval Data interval (1d, 1wk, 1mo, 5m, 15m, etc.)
   */
  async getHistoricalData(
    symbol: string,
    period1: Date | string,
    period2?: Date | string,
    interval: string = '1d'
  ) {
    try {
      let fetchInterval = interval;
      let needsResampling = false;
      let targetMinutes = 0;

      const VALID_YF_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];

      // If the interval is natively supported by Yahoo Finance, use it directly.
      if (VALID_YF_INTERVALS.includes(interval)) {
        fetchInterval = interval;
      } else {
        // Dynamic resampling for custom intervals (e.g. '7m', '20m', '2h', '3d')
        needsResampling = true;
        const match = interval.match(/^(\d+)([mhd])$/);
        
        if (match) {
          const val = parseInt(match[1]);
          const unit = match[2];
          
          const p1 = new Date(period1).getTime();
          const p2 = period2 ? new Date(period2).getTime() : Date.now();
          const daysDiff = Math.abs((p2 - p1) / (1000 * 60 * 60 * 24));

          if (unit === 'm') {
            targetMinutes = val;
            if (daysDiff > 60) fetchInterval = '1h';
            else if (daysDiff > 7) fetchInterval = '5m';
            else fetchInterval = '1m';
          } else if (unit === 'h') {
            targetMinutes = val * 60;
            if (daysDiff > 730) fetchInterval = '1d';
            else fetchInterval = '1h';
          } else if (unit === 'd') {
            targetMinutes = val * 24 * 60;
            fetchInterval = '1d';
          }
        } else {
          // Fallback if parsing fails
          fetchInterval = '1d';
          targetMinutes = 1440; 
          needsResampling = false;
        }
      }

      logger.debug(`Yahoo Finance API Request: GET historical data (chart) for ${symbol} with interval ${fetchInterval}`);

      const queryOptions = {
        period1,
        period2: period2 || new Date(),
        interval: fetchInterval as any,
      };

      // We use chart API because it supports intraday intervals like '5m', '15m'
      // and .historical() restricts to 1d, 1wk, 1mo and is being deprecated.
      const result = await this.yahooFinance.chart(symbol, queryOptions);

      // Filter out empty candles (market hasn't opened yet for this period)
      let quotes = (result.quotes || []).filter((q: any) => q.close !== null && q.close !== undefined);

      if (needsResampling && quotes.length > 0) {
        quotes = this.resampleQuotes(quotes, targetMinutes);
      }

      logger.debug(`Yahoo Finance API Response: Successfully fetched historical data for ${symbol}`);
      return quotes;
    } catch (error: any) {
      if (error.name === 'FailedYahooValidationError') {
        logger.debug(`Yahoo Finance API Response: Validation Error bypassed for historical data ${symbol}`);
        return error.result?.quotes || error.result || [];
      }
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
      if (error.name === 'FailedYahooValidationError') {
        logger.debug(`Yahoo Finance API Response with Validation Errors: Found results`);
        return error.result;
      }
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

  /**
   * Resamples smaller interval candlestick quotes into larger intervals.
   */
  private resampleQuotes(quotes: any[], targetMinutes: number): any[] {
    const resampled: any[] = [];
    let currentBucket: any = null;
    let currentBucketTime = 0;

    for (const quote of quotes) {
      if (!quote.date) continue;
      
      const timeMs = new Date(quote.date).getTime();
      // Group by the target bucket length
      const bucketTime = Math.floor(timeMs / (targetMinutes * 60 * 1000)) * (targetMinutes * 60 * 1000);

      if (!currentBucket || bucketTime !== currentBucketTime) {
        if (currentBucket) resampled.push(currentBucket);
        currentBucketTime = bucketTime;
        currentBucket = {
          date: new Date(bucketTime),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume || 0,
        };
      } else {
        // Aggregate values for the same bucket
        if (quote.high > currentBucket.high) currentBucket.high = quote.high;
        if (quote.low < currentBucket.low) currentBucket.low = quote.low;
        currentBucket.close = quote.close;
        currentBucket.volume += (quote.volume || 0);
      }
    }

    if (currentBucket) resampled.push(currentBucket);
    return resampled;
  }
}

export const yahooFinanceApi = new YahooFinanceService();
