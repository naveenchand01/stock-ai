import { apiClient } from './api';
import type { Stock, MarketIndex, TopStock, HistoricalData } from '@/types/stock.types';

export const stocksApi = {
  /**
   * Get quote for a single stock
   */
  getQuote: async (symbol: string): Promise<Stock> => {
    return apiClient.get(`/stocks/quote/${symbol}`);
  },

  /**
   * Search for stocks
   */
  search: async (query: string): Promise<any> => {
    return apiClient.get(`/stocks/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get quotes for multiple stocks
   */
  getWatchlist: async (symbols: string[]): Promise<Stock[]> => {
    return apiClient.post('/stocks/batch', { symbols });
  },

  /**
   * Get top gaining stocks
   */
  getTopGainers: async (): Promise<TopStock[]> => {
    return apiClient.get('/stocks/gainers');
  },

  /**
   * Get top losing stocks
   */
  getTopLosers: async (): Promise<TopStock[]> => {
    return apiClient.get('/stocks/losers');
  },

  /**
   * Get high volume stocks
   */
  getHighVolume: async (): Promise<TopStock[]> => {
    return apiClient.get('/stocks/volume');
  },

  /**
   * Get all market indices
   */
  getMarketIndices: async (): Promise<MarketIndex[]> => {
    return apiClient.get('/indices');
  },

  /**
   * Get historical data for a stock
   */
  getHistoricalData: async (
    symbol: string,
    period: string = '1mo',
    interval: string = '1d',
    startDate?: string,
    endDate?: string
  ): Promise<HistoricalData[]> => {
    let params = `?period=${period}&interval=${interval}`;
    if (startDate) params += `&startDate=${startDate}`;
    if (endDate) params += `&endDate=${endDate}`;
    return apiClient.get(`/stocks/historical/${symbol}${params}`);
  },

  /**
   * Get live 1-minute intraday data
   */
  getIntradayData: async (symbol: string): Promise<any[]> => {
    return apiClient.get(`/stocks/intraday/${symbol}`);
  },

  /**
   * Get live news with AI sentiment analysis
   */
  getNews: async (query?: string): Promise<any[]> => {
    const params = query ? `?symbolParam=${encodeURIComponent(query)}` : '';
    const response: any = await apiClient.get(`/stocks/news${params}`);
    return response || [];
  },

  /**
   * Get forecasting predictions using LSTM/ARIMA
   */
  getForecast: async (
    symbol: string,
    model: string = 'LSTM',
    days: number = 30
  ): Promise<{
    symbol: string;
    model_type: string;
    forecast_days: number;
    forecast: { date: string; price: number }[];
  }> => {
    return apiClient.get(`/forecast/${symbol}?model=${model}&days=${days}`);
  },

  /**
   * Get forecast comparison data (predicted vs real-time)
   */
  getForecastComparison: async (
    symbol: string,
    interval: string = '1m'
  ): Promise<any> => {
    return apiClient.get(`/forecast/compare/${symbol}?interval=${interval}`);
  },
};
