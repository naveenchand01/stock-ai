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
    interval: string = '1d'
  ): Promise<HistoricalData[]> => {
    return apiClient.get(`/stocks/historical/${symbol}?period=${period}&interval=${interval}`);
  },
};
