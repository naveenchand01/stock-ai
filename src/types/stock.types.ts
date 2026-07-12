export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface StockQuote extends Stock {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface TopStock extends Stock {
  value: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  symbol?: string;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface SearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}
