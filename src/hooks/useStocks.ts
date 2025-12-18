import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { stocksApi } from '@/services/stocks.api';
import type { Stock, MarketIndex, TopStock } from '@/types/stock.types';

/**
 * Hook to fetch watchlist stocks
 */
export const useWatchlistStocks = (symbols: string[]): UseQueryResult<Stock[], Error> => {
  return useQuery({
    queryKey: ['stocks', 'watchlist', symbols],
    queryFn: () => stocksApi.getWatchlist(symbols),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
    enabled: symbols.length > 0,
  });
};

/**
 * Hook to fetch a single stock quote
 */
export const useStockQuote = (symbol: string): UseQueryResult<Stock, Error> => {
  return useQuery({
    queryKey: ['stocks', 'quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol),
    staleTime: 60000,
    refetchInterval: 60000,
    enabled: !!symbol,
  });
};

/**
 * Hook to fetch top gainers
 */
export const useTopGainers = (): UseQueryResult<TopStock[], Error> => {
  return useQuery({
    queryKey: ['stocks', 'gainers'],
    queryFn: () => stocksApi.getTopGainers(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });
};

/**
 * Hook to fetch top losers
 */
export const useTopLosers = (): UseQueryResult<TopStock[], Error> => {
  return useQuery({
    queryKey: ['stocks', 'losers'],
    queryFn: () => stocksApi.getTopLosers(),
    staleTime: 300000,
    refetchInterval: 300000,
  });
};

/**
 * Hook to fetch high volume stocks
 */
export const useHighVolume = (): UseQueryResult<TopStock[], Error> => {
  return useQuery({
    queryKey: ['stocks', 'volume'],
    queryFn: () => stocksApi.getHighVolume(),
    staleTime: 300000,
    refetchInterval: 300000,
  });
};

/**
 * Hook to fetch market indices
 */
export const useMarketIndices = (): UseQueryResult<MarketIndex[], Error> => {
  return useQuery({
    queryKey: ['indices'],
    queryFn: () => stocksApi.getMarketIndices(),
    staleTime: 60000,
    refetchInterval: 60000,
  });
};
