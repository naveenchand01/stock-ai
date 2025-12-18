export interface StockMapping {
  exchange: string;
  segment: string;
  tradingSymbol: string;
  isMock?: boolean;
}

export interface IndexMapping {
  exchange: string;
  tradingSymbol: string;
  displayName: string;
}

// Stock symbol mappings for Groww API
export const STOCK_MAPPINGS: Record<string, StockMapping> = {
  // Indian Stocks (NSE)
  'TCS': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'TCS' },
  'INFY': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'INFY' },
  'RELIANCE': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'RELIANCE' },
  'HDFCBANK': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'HDFCBANK' },
  'ICICIBANK': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'ICICIBANK' },
  'WIPRO': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'WIPRO' },
  'ITC': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'ITC' },
  'SBIN': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'SBIN' },
  'BHARTIARTL': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'BHARTIARTL' },
  'HINDUNILVR': { exchange: 'NSE', segment: 'CASH', tradingSymbol: 'HINDUNILVR' },

  // US Stocks (fallback to mock data for now)
  'AAPL': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'AAPL', isMock: true },
  'GOOGL': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'GOOGL', isMock: true },
  'MSFT': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'MSFT', isMock: true },
  'TSLA': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'TSLA', isMock: true },
  'AMZN': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'AMZN', isMock: true },
  'META': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'META', isMock: true },
  'NVDA': { exchange: 'MOCK', segment: 'CASH', tradingSymbol: 'NVDA', isMock: true },
};

// Market indices mappings
export const MARKET_INDICES: Record<string, IndexMapping> = {
  'NIFTY 50': { exchange: 'NSE', tradingSymbol: 'NIFTY', displayName: 'NIFTY 50' },
  'SENSEX': { exchange: 'BSE', tradingSymbol: 'SENSEX', displayName: 'SENSEX' },
  'BANKNIFTY': { exchange: 'NSE', tradingSymbol: 'BANKNIFTY', displayName: 'BANK NIFTY' },
  'NIFTY IT': { exchange: 'NSE', tradingSymbol: 'CNXIT', displayName: 'NIFTY IT' },
  'FINNIFTY': { exchange: 'NSE', tradingSymbol: 'FINNIFTY', displayName: 'FIN NIFTY' },
  // US indices - mock for now
  'NASDAQ': { exchange: 'MOCK', tradingSymbol: 'NASDAQ', displayName: 'NASDAQ' },
  'S&P 500': { exchange: 'MOCK', tradingSymbol: 'SPX', displayName: 'S&P 500' },
  'DOW JONES': { exchange: 'MOCK', tradingSymbol: 'DJI', displayName: 'DOW JONES' },
};

export function getStockMapping(symbol: string): StockMapping | null {
  return STOCK_MAPPINGS[symbol.toUpperCase()] || null;
}

export function getIndexMapping(name: string): IndexMapping | null {
  return MARKET_INDICES[name] || null;
}

export function isRealStock(symbol: string): boolean {
  const mapping = getStockMapping(symbol);
  return mapping !== null && !mapping.isMock;
}
