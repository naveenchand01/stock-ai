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
// All are Indian Nifty 50 stocks, using .NS suffix
export const STOCK_MAPPINGS: Record<string, StockMapping> = {
  'ADANIENT': { yahooSymbol: 'ADANIENT.NS', displaySymbol: 'ADANIENT', name: 'Adani Enterprises' },
  'ADANIPORTS': { yahooSymbol: 'ADANIPORTS.NS', displaySymbol: 'ADANIPORTS', name: 'Adani Ports' },
  'APOLLOHOSP': { yahooSymbol: 'APOLLOHOSP.NS', displaySymbol: 'APOLLOHOSP', name: 'Apollo Hospitals' },
  'ASIANPAINT': { yahooSymbol: 'ASIANPAINT.NS', displaySymbol: 'ASIANPAINT', name: 'Asian Paints' },
  'AXISBANK': { yahooSymbol: 'AXISBANK.NS', displaySymbol: 'AXISBANK', name: 'Axis Bank' },
  'BAJAJ-AUTO': { yahooSymbol: 'BAJAJ-AUTO.NS', displaySymbol: 'BAJAJ-AUTO', name: 'Bajaj Auto' },
  'BAJAJFINSV': { yahooSymbol: 'BAJAJFINSV.NS', displaySymbol: 'BAJAJFINSV', name: 'Bajaj Finserv' },
  'BAJFINANCE': { yahooSymbol: 'BAJFINANCE.NS', displaySymbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  'BHARTIARTL': { yahooSymbol: 'BHARTIARTL.NS', displaySymbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  'BPCL': { yahooSymbol: 'BPCL.NS', displaySymbol: 'BPCL', name: 'Bharat Petroleum' },
  'BRITANNIA': { yahooSymbol: 'BRITANNIA.NS', displaySymbol: 'BRITANNIA', name: 'Britannia Industries' },
  'CIPLA': { yahooSymbol: 'CIPLA.NS', displaySymbol: 'CIPLA', name: 'Cipla' },
  'COALINDIA': { yahooSymbol: 'COALINDIA.NS', displaySymbol: 'COALINDIA', name: 'Coal India' },
  'DIVISLAB': { yahooSymbol: 'DIVISLAB.NS', displaySymbol: 'DIVISLAB', name: 'Divi\'s Laboratories' },
  'DRREDDY': { yahooSymbol: 'DRREDDY.NS', displaySymbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories' },
  'EICHERMOT': { yahooSymbol: 'EICHERMOT.NS', displaySymbol: 'EICHERMOT', name: 'Eicher Motors' },
  'GRASIM': { yahooSymbol: 'GRASIM.NS', displaySymbol: 'GRASIM', name: 'Grasim Industries' },
  'HCLTECH': { yahooSymbol: 'HCLTECH.NS', displaySymbol: 'HCLTECH', name: 'HCL Technologies' },
  'HDFCBANK': { yahooSymbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank' },
  'HDFCLIFE': { yahooSymbol: 'HDFCLIFE.NS', displaySymbol: 'HDFCLIFE', name: 'HDFC Life Insurance' },
  'HEROMOTOCO': { yahooSymbol: 'HEROMOTOCO.NS', displaySymbol: 'HEROMOTOCO', name: 'Hero MotoCorp' },
  'HINDALCO': { yahooSymbol: 'HINDALCO.NS', displaySymbol: 'HINDALCO', name: 'Hindalco Industries' },
  'HINDUNILVR': { yahooSymbol: 'HINDUNILVR.NS', displaySymbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  'ICICIBANK': { yahooSymbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank' },
  'ITC': { yahooSymbol: 'ITC.NS', displaySymbol: 'ITC', name: 'ITC Limited' },
  'INDUSINDBK': { yahooSymbol: 'INDUSINDBK.NS', displaySymbol: 'INDUSINDBK', name: 'IndusInd Bank' },
  'INFY': { yahooSymbol: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys' },
  'JSWSTEEL': { yahooSymbol: 'JSWSTEEL.NS', displaySymbol: 'JSWSTEEL', name: 'JSW Steel' },
  'KOTAKBANK': { yahooSymbol: 'KOTAKBANK.NS', displaySymbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  'LT': { yahooSymbol: 'LT.NS', displaySymbol: 'LT', name: 'Larsen & Toubro' },
  'LTM': { yahooSymbol: 'LTM.NS', displaySymbol: 'LTM', name: 'LTIMindtree' },
  'M&M': { yahooSymbol: 'M&M.NS', displaySymbol: 'M&M', name: 'Mahindra & Mahindra' },
  'MARUTI': { yahooSymbol: 'MARUTI.NS', displaySymbol: 'MARUTI', name: 'Maruti Suzuki' },
  'NTPC': { yahooSymbol: 'NTPC.NS', displaySymbol: 'NTPC', name: 'NTPC Limited' },
  'NESTLEIND': { yahooSymbol: 'NESTLEIND.NS', displaySymbol: 'NESTLEIND', name: 'Nestle India' },
  'ONGC': { yahooSymbol: 'ONGC.NS', displaySymbol: 'ONGC', name: 'ONGC' },
  'POWERGRID': { yahooSymbol: 'POWERGRID.NS', displaySymbol: 'POWERGRID', name: 'Power Grid Corp' },
  'RELIANCE': { yahooSymbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries' },
  'SBILIFE': { yahooSymbol: 'SBILIFE.NS', displaySymbol: 'SBILIFE', name: 'SBI Life Insurance' },
  'SBIN': { yahooSymbol: 'SBIN.NS', displaySymbol: 'SBIN', name: 'State Bank of India' },
  'SUNPHARMA': { yahooSymbol: 'SUNPHARMA.NS', displaySymbol: 'SUNPHARMA', name: 'Sun Pharma' },
  'TCS': { yahooSymbol: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services' },
  'TATACONSUM': { yahooSymbol: 'TATACONSUM.NS', displaySymbol: 'TATACONSUM', name: 'Tata Consumer Products' },
  'TMPV': { yahooSymbol: 'TMPV.NS', displaySymbol: 'TMPV', name: 'Tata Motors Passenger Vehicles' },
  'TMCV': { yahooSymbol: 'TMCV.NS', displaySymbol: 'TMCV', name: 'Tata Motors Commercial Vehicles' },
  'TATASTEEL': { yahooSymbol: 'TATASTEEL.NS', displaySymbol: 'TATASTEEL', name: 'Tata Steel' },
  'TECHM': { yahooSymbol: 'TECHM.NS', displaySymbol: 'TECHM', name: 'Tech Mahindra' },
  'TITAN': { yahooSymbol: 'TITAN.NS', displaySymbol: 'TITAN', name: 'Titan Company' },
  'ULTRACEMCO': { yahooSymbol: 'ULTRACEMCO.NS', displaySymbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
  'WIPRO': { yahooSymbol: 'WIPRO.NS', displaySymbol: 'WIPRO', name: 'Wipro Limited' },
  'SHRIRAMFIN': { yahooSymbol: 'SHRIRAMFIN.NS', displaySymbol: 'SHRIRAMFIN', name: 'Shriram Finance' },
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
