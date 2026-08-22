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
      logger.warn(`Failed to fetch quote for ${symbol}, falling back to mock data:`, error);
      let hash = 0;
      for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
      }
      const basePrice = Math.abs(hash % 3000) + 100;
      const changePercent = (Math.abs(hash % 100) / 10) - 5;
      const change = basePrice * (changePercent / 100);
      
      return {
        symbol: displayName,
        name: `${name || symbol} (Mock Data)`,
        price: basePrice,
        change: change,
        changePercent: changePercent,
        volume: Math.abs(hash % 10000000) + 500000,
        previousClose: basePrice - change
      };
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
      logger.warn(`Failed to search stocks for ${query} via API, falling back to local mappings:`, error);
      const queryLower = query.toLowerCase();
      const allSymbols = getAllStockSymbols();
      const matched = allSymbols.filter(sym => {
        const mapping = getStockMapping(sym);
        return sym.toLowerCase().includes(queryLower) || (mapping && mapping.name.toLowerCase().includes(queryLower));
      }).slice(0, 5);

      return {
        quotes: matched.map(sym => {
            const mapping = getStockMapping(sym);
            return {
                symbol: mapping ? mapping.yahooSymbol : sym,
                shortname: mapping ? mapping.name : sym,
                quoteType: 'EQUITY',
                exchange: 'NSE'
            };
        })
      };
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

      // Chunk requests into batches of 10 symbols for high performance and to avoid rate limits
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < yahooSymbols.length; i += chunkSize) {
        chunks.push(yahooSymbols.slice(i, i + chunkSize));
      }

      let yahooQuotes: any[] = [];
      const chunkResults = await Promise.allSettled(
        chunks.map(async (chunk) => {
          try {
            const res = await yahooFinanceApi.getQuotes(chunk.map((s) => s.yahoo));
            return Array.isArray(res) ? res : [res];
          } catch (err) {
            // Fallback for small chunk using individual fetches
            const individual = await Promise.allSettled(
              chunk.map((s) => yahooFinanceApi.getQuote(s.yahoo))
            );
            return individual
              .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !!r.value)
              .map((r) => r.value);
          }
        })
      );

      for (const res of chunkResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          yahooQuotes.push(...res.value);
        }
      }

      // Transform the results
      const stocks: Stock[] = [];
      for (let i = 0; i < yahooQuotes.length; i++) {
        const quote = yahooQuotes[i];
        if (!quote || !quote.symbol) continue;
        const symbolData = yahooSymbols.find(s => s.yahoo === quote.symbol) || yahooSymbols.find(s => s.original === quote.symbol) || { displayName: quote.symbol, name: quote.longName || quote.shortName };

        try {
          const stock = transformYahooQuoteToStock(quote, (symbolData as any).displayName || quote.symbol, (symbolData as any).name);
          stocks.push(stock);

          const cacheKey = `quote:${(symbolData as any).original || quote.symbol}`;
          cacheService.set(cacheKey, stock, 60);
        } catch (error) {
          logger.debug(`Failed to transform quote for ${(symbolData as any).original || quote.symbol}:`, error);
        }
      }

      // Fallback data if Yahoo Finance returned empty array (e.g. rate limited on cloud IP)
      if (stocks.length === 0) {
        logger.warn('Yahoo Finance returned no quotes, falling back to mock data for requested symbols');
        return symbols.map(symbol => {
          const mapping = getStockMapping(symbol);
          const symName = mapping ? mapping.name : symbol;
          
          // Generate somewhat stable pseudo-random data based on symbol string
          let hash = 0;
          for (let i = 0; i < symbol.length; i++) {
            hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
          }
          
          const basePrice = Math.abs(hash % 3000) + 100;
          const changePercent = (Math.abs(hash % 100) / 10) - 5; // -5 to +5 percent
          const change = basePrice * (changePercent / 100);
          
          return {
            symbol: symbol,
            name: `${symName} (Mock Data)`,
            price: basePrice,
            change: change,
            changePercent: changePercent,
            volume: Math.abs(hash % 10000000) + 500000,
            previousClose: basePrice - change
          };
        });
      }

      return stocks;
    } catch (error) {
      logger.debug('Failed to fetch batch quotes, relying on fallback data:', error);
      throw error;
    }
  }

  /**
   * Get top gainers (stocks with highest positive change%)
   */
  async getTopGainers(): Promise<Stock[]> {
    const cacheKey = 'top:gainers';

    const cached = cacheService.get<Stock[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const allSymbols = getAllStockSymbols();

    try {
      const stocks = await this.getBatch(allSymbols);
      let filtered = stocks.filter((stock) => stock.changePercent > 0);
      if (filtered.length === 0) {
        filtered = [...stocks];
      }
      const gainers = filtered
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 20)
        .map((stock) => ({
          ...stock,
          value: `₹${stock.price.toFixed(2)}`,
        }));

      cacheService.set(cacheKey, gainers as any, 300);
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

    const cached = cacheService.get<Stock[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const allSymbols = getAllStockSymbols();

    try {
      const stocks = await this.getBatch(allSymbols);
      let filtered = stocks.filter((stock) => stock.changePercent < 0);
      if (filtered.length === 0) {
        filtered = [...stocks];
      }
      const losers = filtered
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 20)
        .map((stock) => ({
          ...stock,
          value: `₹${stock.price.toFixed(2)}`,
        }));

      cacheService.set(cacheKey, losers as any, 300);
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
            logger.debug(`Failed to fetch individual index quote for ${symbolData.displayName}:`, individualError);
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
          logger.debug(`Failed to transform index ${displayName}:`, error);
        }
      }

      if (indices.length === 0) {
        return [
          { name: 'NIFTY 50', value: 24260.40, change: 85.30, changePercent: 0.35, symbol: '^NSEI' },
          { name: 'SENSEX', value: 79810.15, change: 240.10, changePercent: 0.30, symbol: '^BSESN' },
          { name: 'NIFTY BANK', value: 52140.80, change: -120.50, changePercent: -0.23, symbol: '^NSEBANK' },
          { name: 'NIFTY IT', value: 38920.60, change: 310.40, changePercent: 0.80, symbol: '^CNXIT' },
        ];
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

    let endDate = customEndDate ? new Date(customEndDate) : new Date();
    let startDate = customStartDate ? new Date(customStartDate) : new Date();

    try {

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
      logger.warn(`Failed to fetch historical data for ${symbol}, falling back to mock data:`, error);
      
      const mockData = [];
      let currentDate = new Date(startDate);
      let currentPrice = 1000 + Math.random() * 500;
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const volatility = currentPrice * 0.02;
          const change = (Math.random() - 0.5) * volatility;
          currentPrice += change;
          
          mockData.push({
            date: new Date(currentDate),
            open: currentPrice - change/2,
            high: currentPrice + Math.abs(change),
            low: currentPrice - Math.abs(change),
            close: currentPrice,
            volume: Math.floor(Math.random() * 5000000) + 1000000
          });
        }
        
        if (interval.includes('d')) {
          currentDate.setDate(currentDate.getDate() + (parseInt(interval) || 1));
        } else if (interval.includes('wk')) {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (interval.includes('mo')) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (interval.includes('m')) {
           currentDate.setMinutes(currentDate.getMinutes() + (parseInt(interval) || 1));
        } else {
           currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return mockData;
    }
  }
}

export const stocksService = new StocksService();
