import { apiClient } from './api';
import type { Stock, MarketIndex, TopStock } from '@/types/stock.types';

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
};
