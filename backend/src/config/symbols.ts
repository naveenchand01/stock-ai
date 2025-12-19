export interface StockMapping {
  yahooSymbol: string; // Yahoo Finance symbol (e.g., TCS.NS for NSE stocks, AAPL for US)
  displaySymbol: string; // Display name for UI
  name: string; // Company name
}

export interface IndexMapping {
  yahooSymbol: string; // Yahoo Finance symbol (e.g., ^NSEI for NIFTY)
  displayName: string;
}

// Stock symbol mappings for Yahoo Finance API
// NSE stocks use .NS suffix, BSE stocks use .BO suffix
// US stocks use direct symbols
export const STOCK_MAPPINGS: Record<string, StockMapping> = {
  // Indian Stocks (NSE - .NS suffix)
  'TCS': { yahooSymbol: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services' },
  'INFY': { yahooSymbol: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys Limited' },
  'RELIANCE': { yahooSymbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries' },
  'HDFCBANK': { yahooSymbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank' },
  'ICICIBANK': { yahooSymbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank' },
  'WIPRO': { yahooSymbol: 'WIPRO.NS', displaySymbol: 'WIPRO', name: 'Wipro Limited' },
  'ITC': { yahooSymbol: 'ITC.NS', displaySymbol: 'ITC', name: 'ITC Limited' },
  'SBIN': { yahooSymbol: 'SBIN.NS', displaySymbol: 'SBIN', name: 'State Bank of India' },
  'BHARTIARTL': { yahooSymbol: 'BHARTIARTL.NS', displaySymbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  'HINDUNILVR': { yahooSymbol: 'HINDUNILVR.NS', displaySymbol: 'HINDUNILVR', name: 'Hindustan Unilever' },

  // US Stocks (no suffix needed)
  'AAPL': { yahooSymbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.' },
  'GOOGL': { yahooSymbol: 'GOOGL', displaySymbol: 'GOOGL', name: 'Alphabet Inc.' },
  'MSFT': { yahooSymbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft Corporation' },
  'TSLA': { yahooSymbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla Inc.' },
  'AMZN': { yahooSymbol: 'AMZN', displaySymbol: 'AMZN', name: 'Amazon.com Inc.' },
  'META': { yahooSymbol: 'META', displaySymbol: 'META', name: 'Meta Platforms Inc.' },
  'NVDA': { yahooSymbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA Corporation' },
};

// Market indices mappings for Yahoo Finance
// Indian indices use ^, US indices use ^
export const MARKET_INDICES: Record<string, IndexMapping> = {
  // Indian indices
  'NIFTY 50': { yahooSymbol: '^NSEI', displayName: 'NIFTY 50' },
  'SENSEX': { yahooSymbol: '^BSESN', displayName: 'SENSEX' },
  'BANKNIFTY': { yahooSymbol: '^NSEBANK', displayName: 'BANK NIFTY' },
  'NIFTY IT': { yahooSymbol: '^CNXIT', displayName: 'NIFTY IT' },

  // US indices
  'NASDAQ': { yahooSymbol: '^IXIC', displayName: 'NASDAQ' },
  'S&P 500': { yahooSymbol: '^GSPC', displayName: 'S&P 500' },
  'DOW JONES': { yahooSymbol: '^DJI', displayName: 'DOW JONES' },
};

export function getStockMapping(symbol: string): StockMapping | null {
  return STOCK_MAPPINGS[symbol.toUpperCase()] || null;
}

export function getIndexMapping(name: string): IndexMapping | null {
  return MARKET_INDICES[name] || null;
}

export function getAllStockSymbols(): string[] {
  return Object.keys(STOCK_MAPPINGS);
}
