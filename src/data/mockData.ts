// Mock data for the application

export const watchlistStocks = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2954.20, change: 12.45, changePercent: 0.42 },
  { symbol: "TCS", name: "Tata Consultancy", price: 3942.80, change: 24.55, changePercent: 0.70 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1445.60, change: -5.20, changePercent: -0.36 },
  { symbol: "INFY", name: "Infosys", price: 1422.30, change: 15.40, changePercent: 1.09 },
  { symbol: "ITC", name: "ITC Limited", price: 428.95, change: 2.15, changePercent: 0.50 },
  { symbol: "SBIN", name: "State Bank of India", price: 812.45, change: -3.25, changePercent: -0.40 },
];

export const marketIndices = [
  { name: "NIFTY 50", value: 22456.50, change: 101.25, changePercent: 0.45 },
  { name: "SENSEX", value: 73872.30, change: -238.45, changePercent: -0.32 },
  { name: "BANKNIFTY", value: 47832.80, change: 147.42, changePercent: 0.30 },
  { name: "NIFTY IT", value: 35069.53, change: 228.94, changePercent: 0.65 },
];

export const topGainers = [
  { symbol: "TATASTEEL", value: "₹155.38", change: 5.24 },
  { symbol: "M&M", value: "₹2105.95", change: 3.87 },
  { symbol: "WIPRO", value: "₹472.42", change: 3.12 },
];

export const topLosers = [
  { symbol: "BAJAJFINSV", value: "₹1580.54", change: -4.23 },
  { symbol: "ASIANPAINT", value: "₹2893.87", change: -2.89 },
  { symbol: "MARUTI", value: "₹11110.23", change: -1.98 },
];

export const highVolume = [
  { symbol: "HDFCBANK", value: "82.3M", change: -0.36 },
  { symbol: "TATASTEEL", value: "61.8M", change: 5.24 },
  { symbol: "RELIANCE", value: "47.2M", change: 0.42 },
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
