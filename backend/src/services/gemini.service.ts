import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import logger from '../utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private modelAvailable: boolean = true;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    // Try gemini-1.5-flash first (most common), fallback to others
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate content with automatic model fallback
   */
  private async generateWithFallback(prompt: string): Promise<string> {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const modelName of models) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // If successful, update the default model
        this.model = model;
        this.modelAvailable = true;
        logger.info(`Successfully using Gemini model: ${modelName}`);
        return text;
      } catch (error: any) {
        logger.warn(`Model ${modelName} not available:`, error.message);
        continue;
      }
    }

    // If all models fail, mark as unavailable and return fallback
    this.modelAvailable = false;
    throw new Error('Gemini AI is currently unavailable. Please check your API key configuration.');
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
