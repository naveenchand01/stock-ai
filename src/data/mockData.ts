// Mock data for the application

export const watchlistStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 178.52, change: 2.13, changePercent: 1.21 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.31, change: -5.24, changePercent: -2.07 },
  { symbol: "TCS", name: "Tata Consultancy", price: 3542.80, change: 24.55, changePercent: 0.70 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change: 1.45, changePercent: 1.03 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91, change: 4.82, changePercent: 1.29 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.25, change: -1.23, changePercent: -0.69 },
];

export const marketIndices = [
  { name: "NIFTY 50", value: 22456.50, change: 101.25, changePercent: 0.45 },
  { name: "SENSEX", value: 73872.30, change: -238.45, changePercent: -0.32 },
  { name: "NASDAQ", value: 15832.80, change: 47.42, changePercent: 0.30 },
  { name: "S&P 500", value: 5069.53, change: 28.94, changePercent: 0.57 },
  { name: "DOW JONES", value: 38671.69, change: -94.54, changePercent: -0.24 },
];

export const topGainers = [
  { symbol: "NVDA", value: "$875.38", change: 5.24 },
  { symbol: "META", value: "$505.95", change: 3.87 },
  { symbol: "AMD", value: "$172.42", change: 3.12 },
];

export const topLosers = [
  { symbol: "BA", value: "$180.54", change: -4.23 },
  { symbol: "NKE", value: "$93.87", change: -2.89 },
  { symbol: "DIS", value: "$110.23", change: -1.98 },
];

export const highVolume = [
  { symbol: "AAPL", value: "82.3M", change: 1.21 },
  { symbol: "NVDA", value: "61.8M", change: 5.24 },
  { symbol: "TSLA", value: "47.2M", change: -2.07 },
];

export const generateChartData = (points: number, trend: "up" | "down" | "volatile") => {
  const data = [];
  let value = 100;
  
  for (let i = 0; i < points; i++) {
    if (trend === "up") {
      value += Math.random() * 3 - 0.5;
    } else if (trend === "down") {
      value -= Math.random() * 3 - 0.5;
    } else {
      value += Math.random() * 6 - 3;
    }
    data.push({ value: Math.max(50, value), time: i });
  }
  
  return data;
};

export const newsItems = [
  {
    id: 1,
    headline: "Apple Reports Record Q4 Earnings, Beats Analyst Expectations",
    source: "Bloomberg",
    time: "2 hours ago",
    sentiment: 0.85,
    category: "earnings",
  },
  {
    id: 2,
    headline: "Fed Signals Potential Rate Cuts in Coming Months",
    source: "Reuters",
    time: "4 hours ago",
    sentiment: 0.62,
    category: "economy",
  },
  {
    id: 3,
    headline: "Tesla Faces Production Challenges at Berlin Factory",
    source: "WSJ",
    time: "5 hours ago",
    sentiment: -0.45,
    category: "production",
  },
  {
    id: 4,
    headline: "Microsoft Azure Growth Accelerates, Cloud Revenue Up 29%",
    source: "CNBC",
    time: "6 hours ago",
    sentiment: 0.78,
    category: "cloud",
  },
  {
    id: 5,
    headline: "Oil Prices Surge Amid Middle East Tensions",
    source: "Financial Times",
    time: "7 hours ago",
    sentiment: -0.32,
    category: "commodities",
  },
];

export const forecastData = {
  trend: "Bullish",
  confidence: 72,
  volatility: "Moderate",
  momentum: "Strong",
  riskLevel: "Medium",
  prediction: generateChartData(30, "up").concat(
    Array.from({ length: 10 }, (_, i) => ({
      value: 120 + Math.random() * 15,
      time: 30 + i,
      isPrediction: true,
    }))
  ),
};

export const trendingWords = [
  { text: "AI", weight: 95 },
  { text: "Earnings", weight: 82 },
  { text: "Fed", weight: 78 },
  { text: "Growth", weight: 71 },
  { text: "Revenue", weight: 68 },
  { text: "Cloud", weight: 65 },
  { text: "Bitcoin", weight: 60 },
  { text: "IPO", weight: 55 },
  { text: "Dividend", weight: 50 },
  { text: "Merger", weight: 45 },
];
