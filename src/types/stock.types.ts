export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockQuote extends Stock {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface TopStock {
  symbol: string;
  value: string;
  change: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}
