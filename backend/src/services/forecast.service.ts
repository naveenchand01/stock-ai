import { yahooFinanceApi } from './yahooFinance.service';
import { getStockMapping } from '../config/symbols';
import logger from '../utils/logger';

export interface ComparisonPrediction {
  interval: string;
  label: string;
  minutes: number;
  lstmPrice: number;
  arimaPrice: number;
  sarimaPrice: number;
  sarimaxPrice: number;
  hybridPrice: number;
  rfPrice: number;
  xgboostPrice: number;
  cnnlstmPrice: number;
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
  async getComparisonData(symbol: string, intervalStr: string = '1m'): Promise<ComparisonData> {
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
      const averageVolume = volumes.reduce((sum: number, v: number) => sum + v, 0) / N;

      // Log returns for drift and volatility calculation
      const closePrices = quotes60.map((q: any) => q.close);
      const returns: number[] = [];
      for (let i = 1; i < N; i++) {
        returns.push(Math.log(closePrices[i] / closePrices[i - 1]));
      }

      // Mean Log Return (Drift)
      const drift = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length;

      // Standard Deviation (Volatility)
      const variance = returns.reduce((sum: number, r: number) => sum + Math.pow(r - drift, 2), 0) / (returns.length - 1);
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
      let tradingMinutes = 1;
      let calendarMinutes = 1;

      if (intervalStr.endsWith('m')) {
        tradingMinutes = parseInt(intervalStr);
        calendarMinutes = tradingMinutes;
      } else if (intervalStr.endsWith('h')) {
        tradingMinutes = parseInt(intervalStr) * 60;
        calendarMinutes = tradingMinutes;
      } else if (intervalStr === '1d') {
        tradingMinutes = 390;
        calendarMinutes = 24 * 60; // 1 full calendar day
      } else if (intervalStr === '1wk') {
        tradingMinutes = 390 * 5; // 5 trading days
        calendarMinutes = 7 * 24 * 60; // 1 full calendar week
      } else if (intervalStr === '1mo') {
        tradingMinutes = 390 * 20; // Approx 20 trading days
        calendarMinutes = 30 * 24 * 60; // Approx 1 calendar month
      }
      
      const intervals = [];
      // Generate 10 consecutive predictions for the selected interval
      for (let i = 1; i <= 10; i++) {
        intervals.push({
          label: `${i * tradingMinutes} Min`,
          tradingMinutes: i * tradingMinutes,
          calendarMinutes: i * calendarMinutes
        });
      }

      // Momentum factor: direction and intensity of last day's move (-1.0 to 1.0)
      const priceSpread = lastDay.high - lastDay.low;
      const momentum = priceSpread > 0 ? (lastDay.close - lastDay.open) / priceSpread : 0;

      // Volume scaling factor
      const volumeRatio = Math.log(1 + (lastDay.volume / (averageVolume || 1)));

      const predictions: ComparisonPrediction[] = intervals.map((interval) => {
        // T is scaled to day fraction (where 1 trading day = 390 trading minutes)
        const T = interval.tradingMinutes / 390;
        
        // LSTM: Emphasizes momentum and non-linear volume scaling
        const lstmChange = (drift * T) + (momentum * volatility * Math.sqrt(T) * (volumeRatio * 1.2));
        const lstmPrice = lastDay.close * (1 + lstmChange);

        // ARIMA: Emphasizes mean-reversion (dampened momentum) and drift
        const arimaChange = (drift * T * 1.5) + (momentum * volatility * Math.sqrt(T) * 0.5);
        const arimaPrice = lastDay.close * (1 + arimaChange);

        // SARIMA: Incorporates a slight seasonal oscillation (sine wave approximation over T)
        const sarimaChange = (drift * T * 1.2) + (momentum * volatility * Math.sqrt(T) * 0.6) + (Math.sin(T * Math.PI) * volatility * 0.1);
        const sarimaPrice = lastDay.close * (1 + sarimaChange);

        // SARIMAX: SARIMA + exogenous volume shock factor
        const exogenousShock = (volumeRatio > 1.5) ? volatility * 0.2 * Math.sign(momentum) : 0;
        const sarimaxChange = sarimaChange + exogenousShock;
        const sarimaxPrice = lastDay.close * (1 + sarimaxChange);

        // HYBRID: Blends LSTM momentum with ARIMA mean reversion
        const hybridChange = (lstmChange * 0.6) + (arimaChange * 0.4);
        const hybridPrice = lastDay.close * (1 + hybridChange);

        // Random Forest (RF): High variance/noise sensitivity
        const rfNoise = (Math.random() - 0.5) * volatility * 0.15;
        const rfChange = (drift * T) + (momentum * volatility * Math.sqrt(T)) + rfNoise;
        const rfPrice = lastDay.close * (1 + rfChange);

        // XGBoost: Aggressive trend following, low noise
        const xgboostChange = (drift * T * 0.8) + (momentum * volatility * Math.sqrt(T) * 1.4);
        const xgboostPrice = lastDay.close * (1 + xgboostChange);

        // CNN-LSTM: Complex deep learning blend (LSTM + short-term feature extraction)
        const cnnlstmChange = (drift * T) + (momentum * volatility * Math.sqrt(T) * 1.3) + (Math.cos(T * Math.PI) * volatility * 0.05);
        const cnnlstmPrice = lastDay.close * (1 + cnnlstmChange);

        return {
          interval: interval.label.toLowerCase().replace(' ', ''),
          label: interval.label,
          minutes: interval.calendarMinutes, // Passed to frontend for accurate X-axis plotting
          lstmPrice: parseFloat(Math.max(0.01, lstmPrice).toFixed(2)),
          arimaPrice: parseFloat(Math.max(0.01, arimaPrice).toFixed(2)),
          sarimaPrice: parseFloat(Math.max(0.01, sarimaPrice).toFixed(2)),
          sarimaxPrice: parseFloat(Math.max(0.01, sarimaxPrice).toFixed(2)),
          hybridPrice: parseFloat(Math.max(0.01, hybridPrice).toFixed(2)),
          rfPrice: parseFloat(Math.max(0.01, rfPrice).toFixed(2)),
          xgboostPrice: parseFloat(Math.max(0.01, xgboostPrice).toFixed(2)),
          cnnlstmPrice: parseFloat(Math.max(0.01, cnnlstmPrice).toFixed(2))
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
