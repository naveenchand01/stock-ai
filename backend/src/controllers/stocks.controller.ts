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
   * GET /api/stocks/search
   * Search for stocks
   */
  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      const results = await stocksService.search(q as string);
      return res.json({ data: results });
    } catch (error: any) {
      logger.error('Error in search:', error);
      return res.status(500).json({ error: error.message || 'Failed to search stocks' });
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
      const { period = '1mo', interval = '1d', startDate, endDate } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const data = await stocksService.getHistoricalData(
        symbol.toUpperCase(),
        period as string,
        interval as string,
        startDate as string | undefined,
        endDate as string | undefined
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

  /**
   * GET /api/stocks/intraday/:symbol
   * Get 1-minute intraday data from Flask ML service
   */
  async getIntradayData(req: Request, res: Response) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const response = await fetch(`http://localhost:5000/intraday?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch intraday data from ML service');
      }
      
      const data = (await response.json()) as any;
      return res.json({ data: data.intraday || [] });
    } catch (error: any) {
      logger.error('Error in getIntradayData:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch intraday data' });
    }
  }

  /**
   * GET /api/stocks/news
   * Fetch live news from multiple sources (Google News, Yahoo Finance) and run Gemini AI sentiment analysis
   */
  async getNews(req: Request, res: Response) {
    try {
      const { symbolParam } = req.query;
      const query = symbolParam ? (symbolParam as string) : 'stock market';

      // ====== SOURCE 1: Yahoo Finance (via search) ======
      let yahooNews: any[] = [];
      try {
        const results: any = await stocksService.search(query);
        yahooNews = (results.news || []).slice(0, 8).map((n: any) => {
          let timestamp = "Just now";
          try { timestamp = new Date(n.providerPublishTime * 1000).toLocaleString(); } catch (e) { }
          return {
            id: n.uuid || `yahoo-${Math.random().toString(36).slice(2)}`,
            headline: n.title,
            source: n.publisher || 'Yahoo Finance',
            time: timestamp,
            category: 'Market',
            sentiment: 0,
            url: n.link,
          };
        });
      } catch (e) {
        logger.error('Failed to fetch Yahoo Finance news:', e);
      }

      // ====== SOURCE 2: Google News RSS (aggregates Bloomberg, CNN, FirstPost, Reuters, CNBC, etc.) ======
      let googleNews: any[] = [];
      try {
        const googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' finance')}&hl=en-IN&gl=IN&ceid=IN:en`;
        const rssResponse = await fetch(googleRssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const rssText = await rssResponse.text();

        // Parse RSS XML manually (lightweight, no extra dependencies)
        const items: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(rssText)) !== null && items.length < 12) {
          const itemXml = match[1];
          const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
          const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
          const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
          const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';

          if (title) {
            items.push({
              id: `google-${Math.random().toString(36).slice(2)}`,
              headline: title,
              source: sourceMatch || 'Google News',
              time: pubDate ? new Date(pubDate).toLocaleString() : 'Recent',
              category: 'Finance',
              sentiment: 0,
              url: link,
            });
          }
        }
        googleNews = items;
      } catch (e) {
        logger.error('Failed to fetch Google News RSS:', e);
      }

      // ====== SOURCE 3: Gemini AI - combined news generation + sentiment for all headlines ======
      // We do ONE Gemini call that both generates extra headlines AND scores all sentiments
      let geminiNews: any[] = [];

      // First merge Google + Yahoo
      const allNews = [...googleNews, ...yahooNews];

      try {
        const existingHeadlines = allNews.slice(0, 15).map((n, i) => `${i + 1}. ${n.headline.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, '').trim()}`).join('\n');

        const combinedPrompt = `You are a financial analyst. You have TWO tasks:

TASK 1: Generate 5 current, realistic financial news headlines about "${query}" attributed to real outlets (Bloomberg, Reuters, CNBC, FirstPost, CNN, Economic Times).

TASK 2: Score the sentiment of ALL headlines (both the ones I provide AND the 5 you generate) from -1.0 (very bearish) to 1.0 (very bullish).

EXISTING HEADLINES:
${existingHeadlines}

Return ONLY this JSON (no markdown, no explanation):
{
  "generated": [{"headline": "...", "source": "...", "category": "...", "sentiment": 0.5}],
  "existingSentiments": [0.5, -0.3, ...]
}
"existingSentiments" must have exactly ${allNews.slice(0, 15).length} numbers matching the existing headlines above.`;

        console.log('[NEWS] Making single combined Gemini call with retry...');
        let rawText = await geminiService.generate(combinedPrompt, 'gemini-2.0-flash');
        rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        console.log('[NEWS] Gemini combined response:', rawText.substring(0, 300));

        const parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)?.[0] || '{}');

        // Apply existing sentiments
        if (Array.isArray(parsed.existingSentiments)) {
          allNews.forEach((n, i) => {
            if (i < parsed.existingSentiments.length && typeof parsed.existingSentiments[i] === 'number') {
              n.sentiment = parsed.existingSentiments[i];
            }
          });
          console.log('[NEWS] Applied sentiments to', parsed.existingSentiments.length, 'existing articles');
        }

        // Add generated news
        if (Array.isArray(parsed.generated)) {
          geminiNews = parsed.generated.map((item: any) => ({
            id: `gemini-${Math.random().toString(36).slice(2)}`,
            headline: item.headline,
            source: item.source || 'AI Aggregator',
            time: 'Just now',
            category: item.category || 'Market',
            sentiment: typeof item.sentiment === 'number' ? item.sentiment : 0,
            url: null,
          }));
          console.log('[NEWS] Added', geminiNews.length, 'Gemini-generated headlines');
        }
      } catch (e: any) {
        console.error('[NEWS] Combined Gemini call failed, using keyword fallback:', e.message);
        logger.error('Failed combined Gemini news+sentiment:', e);

        // ====== FALLBACK: Keyword-based sentiment scoring ======
        const bullishWords = ['surge', 'soar', 'jump', 'rally', 'gain', 'rise', 'high', 'record', 'profit', 'growth', 'bullish', 'upgrade', 'beat', 'strong', 'boom', 'buy', 'up', 'positive', 'recover', 'advance', 'outperform'];
        const bearishWords = ['crash', 'drop', 'fall', 'decline', 'loss', 'low', 'sell', 'bear', 'downgrade', 'miss', 'weak', 'slump', 'fear', 'risk', 'warning', 'cut', 'down', 'negative', 'plunge', 'slide', 'tumble', 'concern'];

        allNews.forEach(n => {
          const headline = n.headline.toLowerCase();
          let score = 0;
          bullishWords.forEach(w => { if (headline.includes(w)) score += 0.25; });
          bearishWords.forEach(w => { if (headline.includes(w)) score -= 0.25; });
          n.sentiment = Math.max(-1, Math.min(1, score));
        });
        console.log('[NEWS] Applied keyword-based sentiment to', allNews.length, 'articles');
      }

      // Final merge
      const finalNews = [...allNews, ...geminiNews];

      return res.json({ data: finalNews });
    } catch (error: any) {
      logger.error('Error in getNews:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch news feed' });
    }
  }
}

export const stocksController = new StocksController();
