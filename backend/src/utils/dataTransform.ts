interface GrowwQuoteData {
  ltp?: number;
  lastPrice?: number;
  close?: number;
  chng?: number;
  change?: number;
  chngPcnt?: number;
  changePercent?: number;
  changePer?: number;
  tradingSymbol?: string;
  trading_symbol?: string;
  companyName?: string;
  company_name?: string;
  searchId?: string;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Transform Groww API quote response to Stock format
 */
export function transformGrowwQuoteToStock(growwData: any): Stock {
  const data: GrowwQuoteData = growwData.data || growwData;

  const symbol = data.tradingSymbol || data.trading_symbol || data.searchId || 'UNKNOWN';
  const name = data.companyName || data.company_name || symbol;
  const price = data.ltp || data.lastPrice || 0;
  const change = data.chng || data.change || 0;
  const changePercent = data.chngPcnt || data.changePercent || data.changePer || 0;

  return {
    symbol,
    name,
    price,
    change,
    changePercent,
  };
}

/**
 * Transform Groww API index response to MarketIndex format
 */
export function transformGrowwIndexToMarketIndex(growwData: any, displayName: string): MarketIndex {
  const data: GrowwQuoteData = growwData.data || growwData;

  const value = data.ltp || data.lastPrice || 0;
  const change = data.chng || data.change || 0;
  const changePercent = data.chngPcnt || data.changePercent || data.changePer || 0;

  return {
    name: displayName,
    value,
    change,
    changePercent,
  };
}

/**
 * Calculate sentiment based on price change percentage
 * Returns a value between -1 (very negative) and 1 (very positive)
 */
export function calculateSentiment(changePercent: number): number {
  // Normalize to -1 to 1 range (assuming max ±10% = ±1 sentiment)
  return Math.max(-1, Math.min(1, changePercent / 10));
}

/**
 * Generate mock stock data for US stocks
 */
export function generateMockStock(symbol: string): Stock {
  const mockPrices: Record<string, { name: string; basePrice: number }> = {
    'AAPL': { name: 'Apple Inc.', basePrice: 175.50 },
    'GOOGL': { name: 'Alphabet Inc.', basePrice: 140.30 },
    'MSFT': { name: 'Microsoft Corporation', basePrice: 380.75 },
    'TSLA': { name: 'Tesla Inc.', basePrice: 242.80 },
    'AMZN': { name: 'Amazon.com Inc.', basePrice: 155.20 },
    'META': { name: 'Meta Platforms Inc.', basePrice: 482.30 },
    'NVDA': { name: 'NVIDIA Corporation', basePrice: 725.50 },
  };

  const stock = mockPrices[symbol] || { name: symbol, basePrice: 100 };
  const randomChange = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
  const price = stock.basePrice * (1 + randomChange / 100);
  const change = price - stock.basePrice;
  const changePercent = (change / stock.basePrice) * 100;

  return {
    symbol,
    name: stock.name,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}

/**
 * Generate mock market index data
 */
export function generateMockIndex(name: string): MarketIndex {
  const mockIndices: Record<string, number> = {
    'NASDAQ': 15800,
    'S&P 500': 4800,
    'DOW JONES': 38500,
  };

  const baseValue = mockIndices[name] || 10000;
  const randomChange = (Math.random() - 0.5) * 2; // Random change between -1% and +1%
  const value = baseValue * (1 + randomChange / 100);
  const change = value - baseValue;
  const changePercent = (change / baseValue) * 100;

  return {
    name,
    value: parseFloat(value.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}
