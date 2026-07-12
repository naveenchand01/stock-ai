import { yahooFinanceApi } from './yahooFinance.service';
import { getStockMapping } from '../config/symbols';
import logger from '../utils/logger';

export interface ComparisonPrediction {
  interval: string;
  label: string;
  minutes: number;
  predictedPrice: number;
}

export interface ComparisonData {
  symbol: string;
  displayName: string;
  lastDay: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null;
  stats60Day: {
    averageVolume: number;
    drift: number;
    volatility: number;
  } | null;
  predictions: ComparisonPrediction[];
  currentRealPrice: number;
}

class ForecastService {
  /**
   * Generates comparison prediction data using the 60-day trend + last day performance formula
   */
  async getComparisonData(symbol: string): Promise<ComparisonData> {
    try {
      const mapping = getStockMapping(symbol);
      const yahooSymbol = mapping ? mapping.yahooSymbol : symbol;
      const displayName = mapping ? mapping.displaySymbol : symbol;

      // 1. Fetch historical daily data for past 90 calendar days (~60 trading days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      const quotes = await yahooFinanceApi.getHistoricalData(
        yahooSymbol,
        startDate,
        endDate,
        '1d'
      );

      // Clean quotes (remove rows with missing fields)
      const cleanQuotes = (quotes || []).filter(
        (q: any) =>
          q.close !== null &&
          q.close !== undefined &&
          q.open !== null &&
          q.open !== undefined &&
          q.high !== null &&
          q.high !== undefined &&
          q.low !== null &&
          q.low !== undefined &&
          q.volume !== null &&
          q.volume !== undefined
      );

      if (cleanQuotes.length < 5) {
        throw new Error(`Insufficient historical data for symbol: ${symbol}`);
      }

      // Limit to exactly the last 60 trading days if we have more
      const quotes60 = cleanQuotes.slice(-60);
      const N = quotes60.length;

      // Last day performance
      const lastQuote = quotes60[N - 1];
      const lastDay = {
        date: new Date(lastQuote.date).toISOString().split('T')[0],
        open: lastQuote.open,
        high: lastQuote.high,
        low: lastQuote.low,
        close: lastQuote.close,
        volume: lastQuote.volume,
      };

      // Calculate 60-day stats
      const volumes = quotes60.map((q: any) => q.volume);
      const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / N;

      // Log returns for drift and volatility calculation
      const closePrices = quotes60.map((q: any) => q.close);
      const returns: number[] = [];
      for (let i = 1; i < N; i++) {
        returns.push(Math.log(closePrices[i] / closePrices[i - 1]));
      }

      // Mean Log Return (Drift)
      const drift = returns.reduce((sum, r) => sum + r, 0) / returns.length;

      // Standard Deviation (Volatility)
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - drift, 2), 0) / (returns.length - 1);
      const volatility = Math.sqrt(variance);

      // 2. Fetch current live price using getQuote
      let currentRealPrice = lastDay.close;
      try {
        const quote = await yahooFinanceApi.getQuote(yahooSymbol);
        if (quote && (quote.regularMarketPrice || quote.price)) {
          currentRealPrice = quote.regularMarketPrice || quote.price;
        }
      } catch (quoteErr) {
        logger.warn(`Failed to fetch current live quote for comparison, using last close instead: ${quoteErr}`);
      }

      // 3. Perform interval projections using the quantitative formula
      // Timeframes in minutes
      const intervals = [
        { label: '5 Min', minutes: 5 },
        { label: '10 Min', minutes: 10 },
        { label: '30 Min', minutes: 30 },
        { label: '1 Hour', minutes: 60 },
        { label: '2 Hours', minutes: 120 },
        { label: '1 Day', minutes: 390 } // Standard trading day is 390 trading minutes
      ];

      // Momentum factor: direction and intensity of last day's move (-1.0 to 1.0)
      const priceSpread = lastDay.high - lastDay.low;
      const momentum = priceSpread > 0 ? (lastDay.close - lastDay.open) / priceSpread : 0;

      // Volume scaling factor
      const volumeRatio = Math.log(1 + (lastDay.volume / (averageVolume || 1)));

      const predictions: ComparisonPrediction[] = intervals.map((interval) => {
        // T is scaled to day fraction (where 1 trading day = 390 minutes)
        const T = interval.minutes / 390;
        
        // Quantitative Formula:
        // P_pred = C_last * (1 + drift * T + momentum * volatility * sqrt(T) * volumeRatio)
        const expectedChange = (drift * T) + (momentum * volatility * Math.sqrt(T) * volumeRatio);
        const predictedPrice = lastDay.close * (1 + expectedChange);

        return {
          interval: interval.label.toLowerCase().replace(' ', ''),
          label: interval.label,
          minutes: interval.minutes,
          predictedPrice: parseFloat(Math.max(0.01, predictedPrice).toFixed(2))
        };
      });

      return {
        symbol,
        displayName,
        lastDay,
        stats60Day: {
          averageVolume: Math.round(averageVolume),
          drift: parseFloat(drift.toFixed(6)),
          volatility: parseFloat(volatility.toFixed(6)),
        },
        predictions,
        currentRealPrice: parseFloat(currentRealPrice.toFixed(2))
      };
    } catch (error: any) {
      logger.error(`Error generating comparison data for ${symbol}:`, error);
      throw error;
    }
  }
}

export const forecastService = new ForecastService();
