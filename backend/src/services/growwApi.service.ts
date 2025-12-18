import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import logger from '../utils/logger';

class GrowwApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.GROWW_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${env.GROWW_JWT_TOKEN}`,
        'X-API-Key': env.GROWW_SECRET_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'MarketNavigatorAI/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Groww API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Groww API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Groww API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Groww API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Get live quote for a single stock
   * @param exchange Exchange name (e.g., NSE, BSE)
   * @param segment Segment (usually CASH)
   * @param tradingSymbol Trading symbol (e.g., TCS, INFY)
   */
  async getQuote(exchange: string, segment: string, tradingSymbol: string) {
    try {
      const response = await this.client.get('/live-data/quote', {
        params: {
          exchange,
          segment,
          trading_symbol: tradingSymbol,
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get quote for ${tradingSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Get Last Traded Price (LTP) for multiple stocks
   * @param segment Segment (usually CASH)
   * @param exchangeSymbols Array of exchange:symbol pairs (e.g., ["NSE:TCS", "NSE:INFY"])
   */
  async getLTP(segment: string, exchangeSymbols: string[]) {
    try {
      const response = await this.client.get('/live-data/ltp', {
        params: {
          segment,
          exchange_symbols: exchangeSymbols.join(','),
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get LTP:', error);
      throw error;
    }
  }

  /**
   * Get OHLC data for stocks
   * @param segment Segment (usually CASH)
   * @param exchangeSymbols Array of exchange:symbol pairs
   */
  async getOHLC(segment: string, exchangeSymbols: string[]) {
    try {
      const response = await this.client.get('/live-data/ohlc', {
        params: {
          segment,
          exchange_symbols: exchangeSymbols.join(','),
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get OHLC:', error);
      throw error;
    }
  }

  /**
   * Search for stocks
   * @param query Search query
   */
  async searchStocks(query: string) {
    try {
      const response = await this.client.get('/search/stocks', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to search stocks with query "${query}":`, error);
      throw error;
    }
  }
}

export const growwApi = new GrowwApiService();
