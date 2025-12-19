// Yahoo Finance quote data interface
interface YahooQuoteData {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
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
 * Transform Yahoo Finance quote response to Stock format
 */
export function transformYahooQuoteToStock(yahooData: any, displaySymbol: string, companyName?: string): Stock {
  const data: YahooQuoteData = yahooData;

  const symbol = displaySymbol;
  const name = companyName || data.shortName || data.longName || symbol;
  const price = data.regularMarketPrice || 0;
  const change = data.regularMarketChange || 0;
  const changePercent = data.regularMarketChangePercent || 0;

  return {
    symbol,
    name,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}

/**
 * Transform Yahoo Finance index quote to MarketIndex format
 */
export function transformYahooIndexToMarketIndex(yahooData: any, displayName: string): MarketIndex {
  const data: YahooQuoteData = yahooData;

  const value = data.regularMarketPrice || 0;
  const change = data.regularMarketChange || 0;
  const changePercent = data.regularMarketChangePercent || 0;

  return {
    name: displayName,
    value: parseFloat(value.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
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
