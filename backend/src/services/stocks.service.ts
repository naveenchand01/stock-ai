import { yahooFinanceApi } from './yahooFinance.service';
import { cacheService } from './cache.service';
import { getStockMapping, getIndexMapping, getAllStockSymbols, STOCK_MAPPINGS, MARKET_INDICES } from '../config/symbols';
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
    // If not in our manual mapping, just try the raw symbol (fallback for search results)
    const yahooSymbol = mapping ? mapping.yahooSymbol : symbol;
    const displayName = mapping ? mapping.displaySymbol : symbol;
    const name = mapping ? mapping.name : undefined;

    // Fetch real data from Yahoo Finance API
    try {
      const data = await yahooFinanceApi.getQuote(yahooSymbol);

      const stock = transformYahooQuoteToStock(data, displayName, name);
      cacheService.set(cacheKey, stock, 60); // Cache for 60 seconds
      return stock;
    } catch (error) {
      logger.error(`Failed to fetch quote for ${symbol}:`, error);
      throw error;
    }
  }

  async search(query: string) {
    try {
      const results = await yahooFinanceApi.searchStocks(query);
      if (results && results.quotes) {
        // Filter results to only include allowed NIFTY 50 stocks
        results.quotes = results.quotes.filter((q: any) => {
           if (!q.symbol) return false;
           const rawSymbol = q.symbol.replace('.NS', '');
           return !!getStockMapping(rawSymbol) || !!getStockMapping(q.symbol);
        });
      }
      return results;
    } catch (error) {
      logger.error(`Failed to search stocks for ${query}:`, error);
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
          return {
            original: symbol,
            yahoo: mapping ? mapping.yahooSymbol : symbol,
            displayName: mapping ? mapping.displaySymbol : symbol,
            name: mapping ? mapping.name : undefined
          };
        });

      if (yahooSymbols.length === 0) {
        return [];
      }

      // Fetch all quotes in batch from Yahoo Finance, with fallback to individual queries if batch fails
      let yahooQuotes: any[] = [];
      try {
        const yahooQuotesResult = await yahooFinanceApi.getQuotes(yahooSymbols.map((s) => s.yahoo));
        yahooQuotes = Array.isArray(yahooQuotesResult) ? yahooQuotesResult : [yahooQuotesResult];
      } catch (batchError) {
        logger.warn(`Batch fetch failed, falling back to individual fetches: ${batchError}`);
        for (const symbolData of yahooSymbols) {
          try {
            const quote = await yahooFinanceApi.getQuote(symbolData.yahoo);
            if (quote) {
              yahooQuotes.push(quote);
            }
          } catch (individualError) {
            logger.error(`Failed to fetch individual quote for ${symbolData.original}:`, individualError);
          }
        }
      }

      // Transform the results
      const stocks: Stock[] = [];
      for (let i = 0; i < yahooQuotes.length; i++) {
        const quote = yahooQuotes[i];
        if (!quote || !quote.symbol) continue;
        // Ensure we match the quote to the original symbol requested, in case Yahoo drops some symbols from response
        const symbolData = yahooSymbols.find(s => s.yahoo === quote.symbol) || yahooSymbols.find(s => s.original === quote.symbol) || { displayName: quote.symbol, name: quote.longName || quote.shortName };

        try {
          const stock = transformYahooQuoteToStock(quote, (symbolData as any).displayName || quote.symbol, (symbolData as any).name);
          stocks.push(stock);

          // Cache individual stock
          const cacheKey = `quote:${(symbolData as any).original || quote.symbol}`;
          cacheService.set(cacheKey, stock, 60);
        } catch (error) {
          logger.error(`Failed to transform quote for ${(symbolData as any).original || quote.symbol}:`, error);
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

    // Fetch all tracked stocks to find gainers
    const allSymbols = getAllStockSymbols();

    try {
      const stocks = await this.getBatch(allSymbols);
      const gainers = stocks
        .filter((stock) => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 20)
        .map((stock) => ({
          ...stock,
          value: `₹${stock.price.toFixed(2)}`,
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

    // Fetch all tracked stocks to find losers
    const allSymbols = getAllStockSymbols();

    try {
      const stocks = await this.getBatch(allSymbols);
      const losers = stocks
        .filter((stock) => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 20)
        .map((stock) => ({
          ...stock,
          value: `₹${stock.price.toFixed(2)}`,
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

    // Fetch all tracked stocks and sort by volume
    const allSymbols = getAllStockSymbols();

    try {
      const stocks = await this.getBatch(allSymbols);
      const highVolume = stocks
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 20)
        .map((stock) => {
          // Format volume (e.g., 1.5M, 500K)
          let formattedVolume = stock.volume.toString();
          if (stock.volume >= 1000000) {
            formattedVolume = `${(stock.volume / 1000000).toFixed(1)}M`;
          } else if (stock.volume >= 1000) {
            formattedVolume = `${(stock.volume / 1000).toFixed(1)}K`;
          }
          return {
            ...stock,
            value: formattedVolume,
          };
        });

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

      // Fetch all indices in batch, with fallback to individual queries if batch fails
      let yahooQuotes: any[] = [];
      try {
        const yahooQuotesResult = await yahooFinanceApi.getQuotes(yahooSymbols.map((s) => s.yahoo));
        yahooQuotes = Array.isArray(yahooQuotesResult) ? yahooQuotesResult : [yahooQuotesResult];
      } catch (batchError) {
        logger.warn(`Batch fetch for indices failed, falling back to individual fetches: ${batchError}`);
        for (const symbolData of yahooSymbols) {
          try {
            const quote = await yahooFinanceApi.getQuote(symbolData.yahoo);
            if (quote) {
              yahooQuotes.push(quote);
            }
          } catch (individualError) {
            logger.error(`Failed to fetch individual index quote for ${symbolData.displayName}:`, individualError);
          }
        }
      }

      // Transform the results
      const indices: MarketIndex[] = [];
      for (let i = 0; i < yahooQuotes.length; i++) {
        const quote = yahooQuotes[i];
        if (!quote || !quote.symbol) continue;
        const symbolData = yahooSymbols.find(s => s.yahoo === quote.symbol) || yahooSymbols[i];
        const { displayName } = symbolData;

        try {
          const index = transformYahooIndexToMarketIndex(quote, displayName, symbolData.yahoo);
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
  async getHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d', customStartDate?: string, customEndDate?: string) {
    const cacheKey = `historical:${symbol}:${period}:${interval}:${customStartDate || ''}:${customEndDate || ''}`;

    // Try to get from cache
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const mapping = getStockMapping(symbol);
    const yahooSymbol = mapping ? mapping.yahooSymbol : symbol;

    try {
      let endDate = customEndDate ? new Date(customEndDate) : new Date();
      let startDate = customStartDate ? new Date(customStartDate) : new Date();

      if (!customStartDate && !customEndDate) {
        // Calculate date range based on period
        switch (period) {
          case '1d':
            // Fetch last 4 days to ensure we always hit at least 1 previous trading day over a long weekend
            startDate.setDate(endDate.getDate() - 4);
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
          case '15y':
            startDate.setFullYear(endDate.getFullYear() - 15);
            break;
          default:
            startDate.setMonth(endDate.getMonth() - 1);
        }
      }

      let data = await yahooFinanceApi.getHistoricalData(
        yahooSymbol,
        startDate,
        endDate,
        interval
      );

      // Filter exactly down to the last trading day if the period requested was strictly 1 day
      if (period === '1d' && data.length > 0) {
        const latestDayStr = new Date(data[data.length - 1].date).toDateString();
        data = data.filter((q: any) => new Date(q.date).toDateString() === latestDayStr);
      }      // Cache for 5 minutes for historical data
      cacheService.set(cacheKey, data, 300);
      return data;
    } catch (error) {
      logger.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw error;
    }
  }
}

export const stocksService = new StocksService();
