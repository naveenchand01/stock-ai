import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import logger from '../utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private modelAvailable: boolean = true;
  private cache = new Map<string, { text: string; expiry: number }>();

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    // User's key specifically supports 2.0-flash and flash-latest
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async generate(prompt: string, preferredModel?: string): Promise<string> {
    const cacheKey = prompt.trim().toLowerCase().substring(0, 500);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      console.log(`[GEMINI] Returning cached response for: ${cacheKey.substring(0, 50)}...`);
      return cached.text;
    }

    const models = [
      preferredModel,
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-pro-latest'
    ].filter(Boolean) as string[];

    const uniqueModels = [...new Set(models)];
    let lastError = '';

    for (const modelName of uniqueModels) {
      console.log(`[GEMINI] Trying model: ${modelName}`);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          if (text) {
            this.cache.set(cacheKey, { text, expiry: Date.now() + 300000 });
            this.model = model;
            this.modelAvailable = true;
            return text;
          }
        } catch (err: any) {
          lastError = err.message || 'Unknown error';
          console.log(`[GEMINI] Model ${modelName} Attempt ${attempt + 1} Error: ${lastError.substring(0, 100)}`);

          const isRateLimit = lastError.includes('Too Many Requests') || lastError.includes('429') || lastError.includes('quota');
          const isNotFound = lastError.includes('not found') || lastError.includes('404');

          if (isNotFound) {
            console.log(`[GEMINI] Model ${modelName} is NOT supported for this key. Skipping...`);
            break; // Try next model immediately
          }

          if (isRateLimit && attempt < 2) {
            const retryMatch = lastError.match(/retry in (\d+\.?\d*)/i);
            const waitSec = retryMatch ? Math.min(parseFloat(retryMatch[1]) + 1, 30) : 10 * (attempt + 1);
            logger.warn(`[GEMINI] Rate limited on ${modelName}, retrying in ${waitSec}s (Attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
          } else {
            logger.error(`[GEMINI] Model ${modelName} failed or max retries hit.`);
            break; // try next model
          }
        }
      }
    }
    this.modelAvailable = false;
    throw new Error(`All Gemini models failed. Last error: ${lastError}`);
  }

  /**
   * Deprecated. Use generate() instead.
   */
  private async generateWithFallback(prompt: string): Promise<string> {
    return this.generate(prompt);
  }

  /**
   * Analyze sentiment for an array of headlines
   * Returns array of sentiment scores from -1.0 to 1.0
   */
  async analyzeSentiment(headlines: string[]): Promise<number[]> {
    // Sanitize headlines - strip HTML entities and special characters
    const cleanHeadlines = headlines.map(h =>
      h.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]*>/g, '')
        .trim()
    );

    const prompt = `Rate the financial market sentiment of each headline below.
Score each from -1.0 (very bearish/negative) to 1.0 (very bullish/positive).
Reply with ONLY a JSON array. No markdown. No explanation. Example: [{"sentiment": 0.5}, {"sentiment": -0.3}]
Exactly ${cleanHeadlines.length} objects needed.

${cleanHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`;

    // Try multiple models available for this account
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.0-flash'];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[SENTIMENT] Trying model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let rawText = result.response.text();

        // Strip markdown code fences
        rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        console.log('[SENTIMENT] Raw response:', rawText.substring(0, 200));

        let sentiments: any[] = [];
        try {
          sentiments = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\[[\s\S]*\]/);
          if (match) sentiments = JSON.parse(match[0]);
        }

        console.log('[SENTIMENT] Parsed', sentiments.length, 'values, first 3:', sentiments.slice(0, 3));

        return sentiments.map((s: any) => (typeof s?.sentiment === 'number' ? s.sentiment : 0));
      } catch (error: any) {
        console.error(`[SENTIMENT] Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    console.error('[SENTIMENT] All models failed');
    return headlines.map(() => 0);
  }

  /**
   * Generate market summary for a stock
   */
  async generateStockSummary(stockData: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high?: number;
    low?: number;
    volume?: number;
  }): Promise<string> {
    try {
      const isPositive = stockData.change >= 0;
      const trend = isPositive ? 'gaining' : 'declining';

      const prompt = `You are a financial analyst. Provide a brief market summary for the following stock:

Stock: ${stockData.name} (${stockData.symbol})
Current Price: $${stockData.price.toFixed(2)}
Change: ${stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%)
${stockData.high ? `Day High: $${stockData.high.toFixed(2)}` : ''}
${stockData.low ? `Day Low: $${stockData.low.toFixed(2)}` : ''}
${stockData.volume ? `Volume: ${stockData.volume.toLocaleString()}` : ''}

Provide a concise 2-3 sentence summary that includes:
1. Current performance trend
2. Key insights about the price movement
3. Brief market context

Keep it professional and informative.`;

      return await this.generateWithFallback(prompt);
    } catch (error: any) {
      logger.error('Error generating stock summary:', error);

      // Return a basic summary as fallback
      const isPositive = stockData.change >= 0;
      const trend = isPositive ? 'up' : 'down';
      return `${stockData.name} (${stockData.symbol}) is currently trading at $${stockData.price.toFixed(2)}, ${trend} ${Math.abs(stockData.changePercent).toFixed(2)}% for the day. AI insights are temporarily unavailable. Please ensure your Gemini API key is configured correctly with billing enabled.`;
    }
  }

  /**
   * Generate overall market summary based on indices and top performers
   */
  async generateMarketSummary(marketData: {
    indices: Array<{ name: string; value: number; change: number; changePercent: number }>;
    topGainers?: Array<{ symbol: string; value: string; change: number }>;
    topLosers?: Array<{ symbol: string; value: string; change: number }>;
  }): Promise<string> {
    try {
      let prompt = `You are a financial analyst. Provide a brief overall market summary based on the following data:

Market Indices:
${marketData.indices.map(idx => `- ${idx.name}: ${idx.value.toFixed(2)} (${idx.change >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)`).join('\n')}`;

      if (marketData.topGainers && marketData.topGainers.length > 0) {
        prompt += `\n\nTop Gainers:\n${marketData.topGainers.slice(0, 3).map(g => `- ${g.symbol}: ${g.value} (${g.change >= 0 ? '+' : ''}${g.change.toFixed(2)}%)`).join('\n')}`;
      }

      if (marketData.topLosers && marketData.topLosers.length > 0) {
        prompt += `\n\nTop Losers:\n${marketData.topLosers.slice(0, 3).map(l => `- ${l.symbol}: ${l.value} (${l.change >= 0 ? '+' : ''}${l.change.toFixed(2)}%)`).join('\n')}`;
      }

      prompt += `\n\nProvide a concise 3-4 sentence market summary that includes:
1. Overall market sentiment (bullish/bearish/mixed)
2. Key trends across indices
3. Notable sector or stock movements
4. Brief outlook

Keep it professional and informative.`;

      return await this.generateWithFallback(prompt);
    } catch (error: any) {
      logger.error('Error generating market summary:', error);

      // Return a basic summary as fallback
      const avgChange = marketData.indices.reduce((sum, idx) => sum + idx.changePercent, 0) / marketData.indices.length;
      const sentiment = avgChange > 0.5 ? 'bullish' : avgChange < -0.5 ? 'bearish' : 'mixed';
      return `Market sentiment is ${sentiment} today with major indices showing ${avgChange > 0 ? 'gains' : 'losses'}. AI-powered insights are temporarily unavailable. Please ensure your Gemini API key is configured correctly.`;
    }
  }

  /**
   * Generate trading insights for a stock based on historical data
   */
  async generateTradingInsights(stockData: {
    symbol: string;
    name: string;
    currentPrice: number;
    historicalData: Array<{
      date: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  }): Promise<string> {
    try {
      const recentData = stockData.historicalData.slice(-10);
      const priceChange = stockData.currentPrice - recentData[0].close;
      const priceChangePercent = (priceChange / recentData[0].close) * 100;

      const prompt = `You are a financial analyst. Analyze the following stock data and provide trading insights:

Stock: ${stockData.name} (${stockData.symbol})
Current Price: $${stockData.currentPrice.toFixed(2)}
Price Change (10 days): ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)

Recent Price Action (Last 10 trading days):
${recentData.map((d, i) => `Day ${i + 1}: Close $${d.close.toFixed(2)}, Volume: ${d.volume.toLocaleString()}`).join('\n')}

Provide concise trading insights (3-4 sentences) covering:
1. Price trend analysis (uptrend/downtrend/consolidation)
2. Volume trends
3. Support/resistance levels if evident
4. Short-term outlook

Keep it professional and actionable.`;

      return await this.generateWithFallback(prompt);
    } catch (error: any) {
      logger.error('Error generating trading insights:', error);

      // Return basic analysis as fallback
      const recentData = stockData.historicalData.slice(-10);
      const priceChange = stockData.currentPrice - recentData[0].close;
      const trend = priceChange > 0 ? 'uptrend' : 'downtrend';
      return `${stockData.name} (${stockData.symbol}) shows a ${trend} over the past 10 days with a ${Math.abs((priceChange / recentData[0].close) * 100).toFixed(2)}% change. AI-powered technical analysis is temporarily unavailable. Please ensure your Gemini API key is properly configured.`;
    }
  }
}

export const geminiService = new GeminiService();
