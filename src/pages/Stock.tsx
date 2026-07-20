import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StockSearch } from "@/components/market/StockSearch";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  Activity,
  Zap,
  Info,
  Loader2,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  X,
  Clock
} from "lucide-react";
import {
  useHistoricalData,
  useStockQuote,
  useStockForecast,
  useStockForecastComparison
} from "@/hooks/useStocks";
import { ForecastCandlestickChart } from "@/components/charts/ForecastCandlestickChart";

const periodOptions = [
  { label: '1 Month', value: '1mo' },
  { label: '3 Months', value: '3mo' },
  { label: '6 Months', value: '6mo' },
  { label: '1 Year', value: '1y' },
  { label: '5 Years', value: '5y' },
  { label: '15 Years', value: '15y' },
];

// Timeframe intervals grouped for the TradingView-style picker
const timeframeGroups = [
  {
    label: 'MINUTES',
    options: [
      { label: '1 minute', interval: '1m', period: '1d' },
      { label: '2 minutes', interval: '2m', period: '1d' },
      { label: '3 minutes', interval: '3m', period: '5d' },
      { label: '5 minutes', interval: '5m', period: '5d' },
      { label: '10 minutes', interval: '10m', period: '5d' },
      { label: '15 minutes', interval: '15m', period: '5d' },
      { label: '30 minutes', interval: '30m', period: '60d' },
    ],
  },
  {
    label: 'HOURS',
    options: [
      { label: '1 hour', interval: '60m', period: '60d' },
      { label: '4 hours', interval: '4h', period: '60d' },
    ],
  },
  {
    label: 'DAYS',
    options: [
      { label: '1 day', interval: '1d', period: '1y' },
      { label: '1 week', interval: '1wk', period: '5y' },
      { label: '1 month', interval: '1mo', period: '15y' },
    ],
  },
];

const allTimeframeOptions = timeframeGroups.flatMap(g => g.options);

const Forecast = () => {
  const [searchParams] = useSearchParams();
  const urlSymbol = searchParams.get('symbol');

  const [selectedModel, setSelectedModel] = useState("LSTM");
  const [selectedSymbol, setSelectedSymbol] = useState(urlSymbol || "RELIANCE.NS");

  const urlMode = searchParams.get('mode') as "forecast" | "comparison" | "intraday" | null;
  const [viewMode, setViewMode] = useState<"forecast" | "comparison" | "intraday">(urlMode || "forecast");

  // Keep synced if URL changes
  useEffect(() => {
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol);
    }
    if (urlMode) {
      setViewMode(urlMode);
    }
  }, [urlSymbol, urlMode]);

  const [selectedPeriod, setSelectedPeriod] = useState("1y");
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);

  // Intraday / multi-timeframe state (Live Intraday tab)
  const [selectedTimeframe, setSelectedTimeframe] = useState(allTimeframeOptions[0]); // default: 1 minute
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);
  // Custom timeframe date range
  const [customTfStart, setCustomTfStart] = useState('');
  const [customTfEnd, setCustomTfEnd] = useState('');
  const [isCustomTf, setIsCustomTf] = useState(false);

  // Comparison chart timeframe state
  const [compareTimeframe, setCompareTimeframe] = useState(allTimeframeOptions[0]); // default: 1 minute
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);
  const [isCustomCompareTf, setIsCustomCompareTf] = useState(false);
  const [customCompareStart, setCustomCompareStart] = useState('');
  const [customCompareEnd, setCustomCompareEnd] = useState('');
  const [customCompareIntervalNum, setCustomCompareIntervalNum] = useState('20');
  const [customCompareIntervalUnit, setCustomCompareIntervalUnit] = useState('m');
  const [appliedCustomCompareInterval, setAppliedCustomCompareInterval] = useState('20m');

  const models = ["LSTM", "ARIMA"];

  // Custom Accuracy Calculator State
  const [calcActual, setCalcActual] = useState('');
  const [calcPredicted, setCalcPredicted] = useState('');

  // Fetch standard historical data
  const { data: historicalData = [], isLoading: isHistoryLoading } = useHistoricalData(
    selectedSymbol,
    selectedPeriod === "custom" ? "max" : selectedPeriod,
    "1d",
    customDateRange?.start,
    customDateRange?.end
  );

  const { data: stockQuote } = useStockQuote(selectedSymbol);

  // Multi-timeframe intraday data via useHistoricalData (reactive, cached)
  const {
    data: intradayData = [],
    isLoading: isIntradayLoading,
    refetch: refetchIntraday,
  } = useHistoricalData(
    selectedSymbol,
    isCustomTf ? 'max' : selectedTimeframe.period,
    selectedTimeframe.interval,
    isCustomTf ? customTfStart : undefined,
    isCustomTf ? customTfEnd : undefined
  );

  // Fetch actual predictions from our Python ML backend (falls back gracefully if offline)
  const { data: forecastData, isLoading: isForecastLoading } = useStockForecast(
    selectedSymbol,
    selectedModel,
    30
  );

  // Fetch forecast comparison data (quantitative calculations vs live data)
  const {
    data: comparisonData,
    isLoading: isComparisonLoading,
    isRefetching: isComparisonRefetching,
    refetch: refetchComparison
  } = useStockForecastComparison(
    selectedSymbol,
    isCustomCompareTf ? appliedCustomCompareInterval : compareTimeframe.interval
  );

  // Helper to prevent requesting too much history for granular intraday intervals (which YF rejects)
  const getSafePeriodForInterval = (intervalStr: string) => {
    const match = intervalStr.match(/^(\d+)([mhd])$/);
    if (!match) return '1mo';
    const val = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'm') {
      if (val < 15) return '1d';
      if (val < 60) return '5d';
      return '1mo';
    }
    if (unit === 'h') return '1mo';
    if (unit === 'd') return '1y';
    return '1mo';
  };

  // Intraday data for Comparison Mode — driven by compareTimeframe
  const { data: intradayCompareData = [], isLoading: isIntradayCompareLoading } = useHistoricalData(
    selectedSymbol,
    isCustomCompareTf ? getSafePeriodForInterval(appliedCustomCompareInterval) : compareTimeframe.period,
    isCustomCompareTf ? appliedCustomCompareInterval : compareTimeframe.interval,
    undefined,
    undefined
  );

  const isLoading = isHistoryLoading || isForecastLoading || (viewMode === "comparison" && (isComparisonLoading || isIntradayCompareLoading));

  // Trajectory Forecast Calculations
  const { predictions } = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return { predictions: [] };
    }

    // Process historical data just to find the start value for fallback predictions
    const processedData = historicalData.map((d) => ({
      timestamp: new Date(d.date).getTime(),
      historical: d.close,
    }));

    const lastHistorical = processedData[processedData.length - 1];
    const startValue = lastHistorical.historical;

    let predictionData: any[] = [];
    let stdDev = startValue * 0.02; // default fallback

    // 1. If we have real forecast data from the backend, use it!
    if (forecastData && forecastData.forecast && forecastData.forecast.length > 0) {
      predictionData = forecastData.forecast.map((f: any) => ({
        time: new Date(f.date).getTime(),
        prediction: f.price,
      }));
    } else {
      // 2. Fallback to client-side mathematical simulation
      const last30Days = processedData.slice(-30);
      const firstOf30 = last30Days[0].historical;
      const naiveTrend = (startValue - firstOf30) / 30; // average daily change
      stdDev = Math.sqrt(
        last30Days.reduce((sq, val) => sq + Math.pow(val.historical - startValue, 2), 0) / 30
      ) || startValue * 0.02;

      const futurePoints = 30; // Predict 30 days out
      const lastDate = last30Days[last30Days.length - 1].timestamp;

      let movingValue = startValue;

      for (let i = 1; i <= futurePoints; i++) {
        const futureTime = new Date(lastDate + i * 24 * 60 * 60 * 1000);

        // Deterministic noise
        const pseudoRandom = Math.sin((lastDate / 100000) + (i * 4.567)) * 0.5 + 0.5;
        const noise = (pseudoRandom - 0.5) * stdDev * 0.8;

        switch (selectedModel) {
          case "LSTM":
            movingValue += naiveTrend * 1.8 + Math.sin(i / 4) * (stdDev * 0.15) + (noise * 0.5);
            break;
          case "ARIMA":
            movingValue += naiveTrend * 0.4 + (noise * 2.5) + Math.cos(i * 1.5) * (stdDev * 0.25);
            break;
          case "SARIMA":
            movingValue += naiveTrend * 0.5 + (noise * 2.0) + Math.cos(i * 1.8) * (stdDev * 0.3);
            break;
          case "SARIMAX":
            movingValue += naiveTrend * 0.8 + (noise * 1.5) + Math.sin(i * 1.2) * (stdDev * 0.4);
            break;
          case "HYBRID":
            movingValue += naiveTrend * 1.1 + Math.sin(i / 3) * (stdDev * 0.1) + (noise * 1.2);
            break;
          case "RF":
            movingValue += naiveTrend * 1.5 + Math.sin(i / 2) * (stdDev * 0.1) + (noise * 0.4);
            break;
          case "XGBOOST":
            movingValue += naiveTrend * 1.6 + Math.cos(i / 3) * (stdDev * 0.2) + (noise * 0.6);
            break;
          case "CNN-LSTM":
            movingValue += naiveTrend * 1.9 + Math.sin(i / 5) * (stdDev * 0.2) + (noise * 0.3);
            break;
          default:
            movingValue += noise * 0.15;
            break;
        }

        predictionData.push({
          time: futureTime.getTime(),
          prediction: parseFloat(movingValue.toFixed(2)),
        });
      }
    }

    return {
      predictions: predictionData
    };
  }, [historicalData, forecastData, selectedModel]);

  // Comparison Calculations
  const comparisonResults = useMemo(() => {
    if (!comparisonData || !comparisonData.predictions) return [];

    const livePrice = comparisonData.currentRealPrice;
    const lastClose = comparisonData.lastDay?.close || livePrice;

    return comparisonData.predictions.map((p: any) => {
      const pred = p.predictedPrice;
      const diffVal = livePrice - pred;
      const diffPercent = (diffVal / pred) * 100;

      // Calculate Mean Absolute Percentage Error (MAPE) for a single point
      const mape = 100 * Math.abs((livePrice - pred) / livePrice);

      // Accuracy (%) = 100 - MAPE
      const accuracy = Math.max(0, 100 - mape);

      return {
        ...p,
        realPrice: livePrice,
        deviation: diffVal,
        deviationPercent: diffPercent,
        accuracy: accuracy
      };
    });
  }, [comparisonData]);

  // Map comparison results to prediction line data for the Candlestick chart
  const comparisonPredictionData = useMemo(() => {
    if (!comparisonData || !comparisonData.predictions || intradayCompareData.length === 0) return [];

    // Base timestamp is the very last available intraday candle's time
    const lastIntradayTime = new Date(intradayCompareData[intradayCompareData.length - 1].date).getTime();

    return comparisonData.predictions.map((p: any) => {
      // p.minutes is e.g. 5, 10, 30, 60...
      const futureTime = lastIntradayTime + (p.minutes * 60 * 1000);
      return {
        time: futureTime,
        prediction: selectedModel === "ARIMA" ? p.arimaPrice : p.lstmPrice,
      };
    });
  }, [comparisonData, intradayCompareData]);

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
          <div>
            <h1 className="text-2xl font-bold">Stock Prediction</h1>
            <p className="text-muted-foreground"></p>
          </div>
          <StockSearch
            onSelect={(symbol) => {
              setSelectedSymbol(symbol);
              setViewMode("comparison");
            }}
            selectedSymbol={selectedSymbol}
          />
        </div>

        {/* View Mode & Engine Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-secondary p-1 border border-border">
            <Button
              variant={viewMode === "forecast" ? "default" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setViewMode("forecast")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Historical Data
            </Button>
            <Button
              variant={viewMode === "comparison" ? "default" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setViewMode("comparison")}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Real-Time Compare
            </Button>
            <Button
              variant={viewMode === "intraday" ? "default" : "ghost"}
              size="sm"
              className="h-8 relative overflow-hidden"
              onClick={() => setViewMode("intraday")}
            >
              <Activity className="h-4 w-4 mr-2 text-primary" />
              Live Intraday (1m)
              {viewMode === "intraday" && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium ml-2">Algorithm:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-secondary text-white text-sm border-border rounded-md px-3 py-1.5 focus:ring-primary focus:border-primary h-8"
            >
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === "forecast" ? (
          <motion.div
            key="forecast-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            {/* Chart Area */}
            <div className="space-y-4">
              <div className="glass-card p-6 min-h-[500px] flex flex-col">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg uppercase text-primary font-mono mt-1">
                      {selectedSymbol} {stockQuote?.name ? `- ${stockQuote.name}` : ''}
                    </h3>
                  </div>

                  {/* Date Range Selector */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <select
                        value={customDateRange ? "custom" : selectedPeriod}
                        onChange={(e) => {
                          if (e.target.value !== "custom") {
                            setSelectedPeriod(e.target.value);
                            setCustomDateRange(null);
                          } else {
                            setCustomDateRange({ start: '', end: '' });
                          }
                        }}
                        className="bg-secondary text-white text-sm border-border rounded-md px-3 py-1.5 focus:ring-primary focus:border-primary"
                      >
                        {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        <option value="custom">Custom Range</option>
                      </select>

                      {customDateRange && (
                        <div className="flex items-center gap-2 bg-secondary rounded-md px-2 py-1">
                          <input
                            type="date"
                            value={customDateRange.start}
                            onChange={e => setCustomDateRange(prev => ({ start: e.target.value, end: prev?.end || '' }))}
                            className="bg-transparent text-white text-sm border-none focus:ring-0 w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="date"
                            value={customDateRange.end}
                            onChange={e => setCustomDateRange(prev => ({ start: prev?.start || '', end: e.target.value }))}
                            className="bg-transparent text-white text-sm border-none focus:ring-0 w-32"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs mt-2 md:mt-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Historical Candles</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-[450px]">
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <span className="text-muted-foreground">Loading interactive chart...</span>
                    </div>
                  ) : historicalData.length > 0 ? (
                    <ForecastCandlestickChart
                      historicalData={historicalData}
                      predictionData={[]}
                      height={450}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No historical data found for {selectedSymbol}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>The dashed blue line represents live algorithmic prediction intervals mapping +30 Days. Scroll to zoom, drag to pan.</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : viewMode === "comparison" ? (
          // Comparison Mode Dashboard
          <motion.div
            key="comparison-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="h-96 flex flex-col items-center justify-center glass-card p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Running mathematical drift models and fetching live quote...</p>
              </div>
            ) : comparisonData ? (
              <>
                {/* 60D Stats & Last Day metrics panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">60-Day Drift (Mean Return)</p>
                      <h4 className={`text-xl font-bold mt-1 ${comparisonData.stats60Day.drift >= 0 ? "text-success" : "text-destructive"}`}>
                        {comparisonData.stats60Day.drift >= 0 ? "+" : ""}{(comparisonData.stats60Day.drift * 100).toFixed(4)}%
                      </h4>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">60-Day Volatility (Std Dev)</p>
                      <h4 className="text-xl font-bold mt-1 text-warning">
                        {(comparisonData.stats60Day.volatility * 100).toFixed(4)}%
                      </h4>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Last Day Close Performance</p>
                      <h4 className="text-xl font-bold mt-1 text-foreground">
                        ₹{comparisonData.lastDay?.close.toFixed(2)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vol: {(comparisonData.lastDay?.volume / 1000000).toFixed(2)}M
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Zap className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Real-Time Yahoo Price</p>
                      <h4 className="text-xl font-bold mt-1 text-primary animate-pulse-glow">
                        ₹{comparisonData.currentRealPrice.toFixed(2)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" /> Live via API
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Primary Chart (Full Width) */}
                <div className="glass-card p-6 w-full">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                    <div>
                      <h3 className="font-bold text-xl text-primary mb-1">
                        {selectedSymbol} {stockQuote?.name ? `- ${stockQuote.name}` : ''}
                      </h3>
                      <h4 className="font-semibold text-md text-foreground">Predicted Horizon vs. Live Quote</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Interval: <span className="text-primary font-medium">{compareTimeframe.label}</span> · Discrete interval comparison based on drift &amp; momentum scaling</p>
                    </div>

                    {/* Right side controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* TradingView-style timeframe dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setCompareDropdownOpen(v => !v)}
                          className="flex items-center gap-2 bg-secondary border border-border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                        >
                          <Clock className="h-4 w-4 text-primary" />
                          {isCustomCompareTf ? 'Custom' : compareTimeframe.label}
                          <svg className={`h-3.5 w-3.5 ml-1 transition-transform ${compareDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>

                        {compareDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setCompareDropdownOpen(false)} />
                            <div className="absolute right-0 mt-2 z-20 bg-[#1a1f2e] border border-border rounded-xl shadow-2xl w-52 py-2 backdrop-blur-xl">
                              {timeframeGroups.map(group => (
                                <div key={group.label}>
                                  <div className="flex items-center justify-between px-4 py-1.5">
                                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{group.label}</span>
                                    <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                                  </div>
                                  {group.options.map(opt => (
                                    <button
                                      key={opt.interval + opt.label}
                                      onClick={() => {
                                        setCompareTimeframe(opt);
                                        setIsCustomCompareTf(false);
                                        setCompareDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-6 py-2 text-sm transition-colors ${!isCustomCompareTf && compareTimeframe.label === opt.label
                                        ? 'bg-primary/20 text-primary font-semibold'
                                        : 'text-foreground hover:bg-secondary/60'
                                        }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              ))}

                              {/* Divider */}
                              <div className="border-t border-border my-1" />

                              {/* Custom option */}
                              <button
                                onClick={() => {
                                  setIsCustomCompareTf(true);
                                  setCompareDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${isCustomCompareTf
                                  ? 'bg-primary/20 text-primary font-semibold'
                                  : 'text-foreground hover:bg-secondary/60'
                                  }`}
                              >
                                Custom Range...
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground font-medium">ML Prediction</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchComparison()}
                        disabled={isComparisonRefetching}
                        className="h-8"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isComparisonRefetching ? "animate-spin" : ""}`} />
                        Refresh Live
                      </Button>
                    </div>
                  </div>

                  {/* Custom date-range inputs for Comparison */}
                  {isCustomCompareTf && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-secondary/30 rounded-lg border border-border"
                    >
                      <span className="text-sm text-muted-foreground">Custom Interval:</span>
                      <div className="flex items-center -space-x-px">
                        <input
                          type="number"
                          min="1"
                          value={customCompareIntervalNum}
                          onChange={e => setCustomCompareIntervalNum(e.target.value)}
                          className="w-16 bg-background border border-border rounded-l-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:z-10 relative"
                        />
                        <select
                          value={customCompareIntervalUnit}
                          onChange={e => setCustomCompareIntervalUnit(e.target.value)}
                          className="bg-secondary border border-border rounded-r-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:z-10 relative"
                        >
                          <option value="m">minutes</option>
                          <option value="h">hours</option>
                          <option value="d">days</option>
                        </select>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="ml-2 h-8"
                        onClick={() => setAppliedCustomCompareInterval(`${customCompareIntervalNum}${customCompareIntervalUnit}`)}
                      >
                        Search
                      </Button>
                    </motion.div>
                  )}

                  <div className="h-[350px] w-full">
                    {intradayCompareData.length > 0 ? (
                      <ForecastCandlestickChart
                        historicalData={intradayCompareData}
                        predictionData={comparisonPredictionData}
                        height={350}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground border border-border rounded-md">
                        No intraday data available for {selectedSymbol} today. Market might be closed.
                      </div>
                    )}
                  </div>

                </div>

                {/* OHLCV & Accuracy Report Below */}
                {intradayCompareData.length > 0 && (
                  <div className="glass-card p-6 w-full mt-6">
                    {/* Live OHLCV Snapshot */}
                    <div className="mb-6 border-b border-border pb-4">
                      <h3 className="font-semibold text-lg mb-3">Live Market Status (Today)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-secondary/30 rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground uppercase font-medium">Open</p>
                          <p className="text-lg font-mono mt-1">₹{Number(intradayCompareData[0]?.open || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-secondary/30 rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground uppercase font-medium">High</p>
                          <p className="text-lg font-mono mt-1 text-success">₹{Math.max(...intradayCompareData.map(d => Number(d.high) || 0)).toFixed(2)}</p>
                        </div>
                        <div className="bg-secondary/30 rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground uppercase font-medium">Low</p>
                          <p className="text-lg font-mono mt-1 text-destructive">₹{Math.min(...intradayCompareData.map(d => Number(d.low) || 0)).toFixed(2)}</p>
                        </div>
                        <div className="bg-secondary/30 rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground uppercase font-medium">Prev Close</p>
                          <p className="text-lg font-mono mt-1 text-primary">₹{Number(comparisonData?.lastDay?.close || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-secondary/30 rounded p-3 text-center">
                          <p className="text-xs text-muted-foreground uppercase font-medium">Volume</p>
                          <p className="text-lg font-mono mt-1">{(intradayCompareData.reduce((sum, d) => sum + (Number(d.volume) || 0), 0) / 1000).toFixed(1)}K</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-4">Algorithm Prediction Report</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground pb-2 text-xs uppercase font-medium">
                            <th className="py-2">Algorithm</th>
                            <th className="py-2 text-right">Actual Price</th>
                            <th className="py-2 text-right">Predicted Price ({comparisonData?.predictions?.[0]?.label || '1D'})</th>
                            <th className="py-2 text-right">Accuracy</th>
                            <th className="py-2 text-right">Est. Confidence</th>
                            <th className="py-2 text-right">Signal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(() => {
                            const lstmBase = comparisonData.predictions?.[0]?.lstmPrice || comparisonData.currentRealPrice;
                            const arimaBase = comparisonData.predictions?.[0]?.arimaPrice || comparisonData.currentRealPrice;
                            const livePrice = comparisonData.currentRealPrice;

                            const algoPredictions = [
                              { name: "LSTM", value: lstmBase, conf: 95 },
                              { name: "ARIMA", value: arimaBase, conf: 85 }
                            ];

                            return algoPredictions.map((algo) => {
                              const signal = algo.value > livePrice * 1.002 ? "Buy" : algo.value < livePrice * 0.998 ? "Sell" : "Hold";
                              const signalColor = signal === "Buy" ? "text-success bg-success/10 border-success/30" : signal === "Sell" ? "text-destructive bg-destructive/10 border-destructive/30" : "text-warning bg-warning/10 border-warning/30";

                              const accuracy = Math.max(0, 100 - Math.abs(((algo.value - livePrice) / livePrice) * 100));

                              return (
                                <tr key={algo.name} className="hover:bg-secondary/20 transition-colors">
                                  <td className="py-3 font-medium text-foreground">{algo.name}</td>
                                  <td className="py-3 text-right font-mono text-primary">₹{livePrice.toFixed(2)}</td>
                                  <td className="py-3 text-right font-mono font-semibold">₹{algo.value.toFixed(2)}</td>
                                  <td className="py-3 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success/20 text-success border border-success/30">
                                      {accuracy.toFixed(2)}%
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${algo.conf}%` }}></div>
                                      </div>
                                      <span className="text-xs font-mono">{algo.conf}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${signalColor}`}>
                                      {signal}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Accuracy Calculator */}
                <div className="glass-card p-5 bg-secondary/10 mt-6 mb-6 border border-border/50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16.01" y1="10" y2="10" /><line x1="12" x2="12.01" y1="10" y2="10" /><line x1="8" x2="8.01" y1="10" y2="10" /><line x1="8" x2="8.01" y1="14" y2="14" /><line x1="12" x2="12.01" y1="14" y2="14" /><line x1="16" x2="16.01" y1="14" y2="14" /><line x1="8" x2="8.01" y1="18" y2="18" /><line x1="12" x2="12.01" y1="18" y2="18" /><line x1="16" x2="16.01" y1="18" y2="18" /></svg>
                      Manual Accuracy Calculator
                    </h4>
                    <button
                      onClick={() => { setCalcActual(''); setCalcPredicted(''); }}
                      className="text-xs px-3 py-1.5 rounded bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                      <label className="text-xs text-muted-foreground uppercase font-medium mb-1 block">Actual Price</label>
                      <input
                        type="number"
                        value={calcActual}
                        onChange={(e) => setCalcActual(e.target.value)}
                        placeholder="e.g. 1328.80"
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
                      />
                    </div>
                    <div className="flex-1 w-full relative">
                      <label className="text-xs text-muted-foreground uppercase font-medium mb-1 block">Predicted Price</label>
                      <input
                        type="number"
                        value={calcPredicted}
                        onChange={(e) => setCalcPredicted(e.target.value)}
                        placeholder="e.g. 1329.71"
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
                      />
                    </div>
                    <div className="flex-1 w-full sm:pt-5">
                      <div className="h-[38px] bg-secondary/30 rounded flex items-center justify-between px-4 border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase font-medium">Result:</span>
                        <span className="font-mono font-semibold text-primary">
                          {calcActual && calcPredicted && !isNaN(Number(calcActual)) && !isNaN(Number(calcPredicted)) && Number(calcActual) > 0
                            ? Math.max(0, 100 - Math.abs(((Number(calcPredicted) - Number(calcActual)) / Number(calcActual)) * 100)).toFixed(2) + '%'
                            : '--.--%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mathematical Details Card */}
                <div className="glass-card p-5 bg-secondary/20">
                  <h4 className="font-semibold mb-2 text-foreground">Formula &amp; Drift Details</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This backtesting dashboard generates predictions using the Geometric Brownian Expected Return model combined with intraday volume scaling and momentum.
                    The historical mean log return (drift = {comparisonData.stats60Day.drift}) and volatility (standard deviation = {comparisonData.stats60Day.volatility}) are computed over the last 60 trading days.
                    The projection adjusts for relative trading volume (VolumeRatio = {Math.log(1 + (comparisonData.lastDay?.volume / (comparisonData.stats60Day.averageVolume || 1))).toFixed(4)})
                    and previous close momentum to predict targets.
                  </p>
                </div>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground glass-card">
                No comparison forecast data found for {selectedSymbol}.
              </div>
            )}
          </motion.div>
        ) : viewMode === "intraday" ? (
          <motion.div
            key="intraday-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 min-h-[500px]"
          >
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-semibold text-lg uppercase text-primary font-mono flex items-center gap-2">
                  <Activity className="h-5 w-5 animate-pulse" />
                  {selectedSymbol} &mdash; {isCustomTf ? 'Custom Range' : selectedTimeframe.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isCustomTf
                    ? `From ${customTfStart || '—'} to ${customTfEnd || '—'} · ${selectedTimeframe.label} candles`
                    : `Interval: ${selectedTimeframe.interval} · Period: ${selectedTimeframe.period}`
                  }
                </p>
              </div>

              {/* TradingView-style timeframe picker */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() => setTimeframeDropdownOpen(v => !v)}
                    className="flex items-center gap-2 bg-secondary border border-border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-primary" />
                    {isCustomTf ? 'Custom' : selectedTimeframe.label}
                    <svg className={`h-3.5 w-3.5 ml-1 transition-transform ${timeframeDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>

                  {timeframeDropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setTimeframeDropdownOpen(false)}
                      />
                      {/* Dropdown panel */}
                      <div className="absolute right-0 mt-2 z-20 bg-[#1a1f2e] border border-border rounded-xl shadow-2xl w-52 py-2 backdrop-blur-xl">
                        {timeframeGroups.map(group => (
                          <div key={group.label}>
                            {/* Group header */}
                            <div className="flex items-center justify-between px-4 py-1.5">
                              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{group.label}</span>
                              <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                            </div>
                            {/* Options */}
                            {group.options.map(opt => (
                              <button
                                key={opt.interval + opt.label}
                                onClick={() => {
                                  setSelectedTimeframe(opt);
                                  setIsCustomTf(false);
                                  setTimeframeDropdownOpen(false);
                                }}
                                className={`w-full text-left px-6 py-2 text-sm transition-colors ${!isCustomTf && selectedTimeframe.label === opt.label
                                  ? 'bg-primary/20 text-primary font-semibold'
                                  : 'text-foreground hover:bg-secondary/60'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        ))}

                        {/* Divider */}
                        <div className="border-t border-border my-1" />

                        {/* Custom option */}
                        <button
                          onClick={() => {
                            setIsCustomTf(true);
                            setTimeframeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${isCustomTf
                            ? 'bg-primary/20 text-primary font-semibold'
                            : 'text-foreground hover:bg-secondary/60'
                            }`}
                        >
                          Custom Range...
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Refresh button */}
                <button
                  onClick={() => refetchIntraday()}
                  className="flex items-center gap-2 bg-secondary border border-border rounded-md px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Custom date-range inputs */}
            {isCustomTf && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-secondary/30 rounded-lg border border-border"
              >
                <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">From</span>
                <input
                  type="datetime-local"
                  value={customTfStart}
                  onChange={e => setCustomTfStart(e.target.value)}
                  className="bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="datetime-local"
                  value={customTfEnd}
                  onChange={e => setCustomTfEnd(e.target.value)}
                  className="bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Interval:</span>
                <select
                  value={selectedTimeframe.interval}
                  onChange={e => {
                    const found = allTimeframeOptions.find(o => o.interval === e.target.value);
                    if (found) setSelectedTimeframe(found);
                  }}
                  className="bg-secondary border border-border rounded-md px-2 py-1 text-sm text-foreground"
                >
                  {allTimeframeOptions.map(o => (
                    <option key={o.interval + o.label} value={o.interval}>{o.label}</option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Chart */}
            {isIntradayLoading ? (
              <div className="h-[500px] flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <span className="text-muted-foreground text-sm">Loading {isCustomTf ? 'custom' : selectedTimeframe.label} data...</span>
              </div>
            ) : intradayData.length > 0 ? (
              <ForecastCandlestickChart
                historicalData={intradayData}
                predictionData={[]}
                height={500}
              />
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Activity className="h-10 w-10 opacity-30" />
                <p>No data available for <span className="font-medium text-foreground">{selectedTimeframe.label}</span> interval.</p>
                <p className="text-xs">The market may be closed or the interval is unsupported for this period.</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Forecast;
