import { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StockCard } from "@/components/market/StockCard";
import { IndexCard } from "@/components/market/IndexCard";
import { MiniChart } from "@/components/market/MiniChart";
import { InsightCard } from "@/components/insights/InsightCard";
import { StockSearch } from "@/components/market/StockSearch";
import { Button } from "@/components/ui/button";
import { useWatchlistStocks, useMarketIndices, useTopGainers, useTopLosers, useHighVolume, useHistoricalData } from "@/hooks/useStocks";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TrendingUp, TrendingDown, BarChart3, MessageSquare, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { TopStock } from "@/types/stock.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  // Watchlist Management (now synced with Firestore)
  const { watchlist: watchlistSymbols, addToWatchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const navigate = useNavigate();

  // State for selected time period
  const [timePeriod, setTimePeriod] = useState("1d");
  const [overviewSymbol, setOverviewSymbol] = useState("^NSEI"); // Default to Nifty 50

  // Fetch historical data for the overview chart
  const { data: historicalData = [], isLoading: loadingHistory } = useHistoricalData(overviewSymbol, timePeriod, timePeriod === "1d" ? "5m" : "1d");

  // Transform historical data for MiniChart
  const chartData = historicalData.map(item => ({
    time: new Date(item.date).getTime() / 1000,
    value: item.close
  }));

  // Fetch data using React Query hooks
  const { data: watchlistStocks = [], isLoading: loadingWatchlist, error: watchlistError } = useWatchlistStocks(watchlistSymbols);
  const { data: marketIndices = [], isLoading: loadingIndices } = useMarketIndices();
  const { data: topGainers = [], isLoading: loadingGainers } = useTopGainers();
  const { data: topLosers = [] } = useTopLosers();
  const { data: highVolume = [] } = useHighVolume();

  // Loading state
  const renderStockList = (stocks: TopStock[]) => {
    return (
      <div className="glass-card rounded-xl overflow-hidden mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Market Price</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.symbol}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {stock.symbol.substring(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{stock.name || stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">₹{stock.price ? stock.price.toFixed(2) : stock.value}</div>
                  <div className={`text-sm font-mono ${(stock.changePercent ?? stock.change) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {(stock.changePercent ?? stock.change) >= 0 ? '+' : ''}{(stock.changePercent ?? stock.change ?? 0).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">{stock.volume ? stock.volume.toLocaleString() : '-'}</div>
                </TableCell>
              </TableRow>
            ))}
            {stocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No stocks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loadingWatchlist || loadingIndices || loadingGainers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-center">Loading market data...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (watchlistError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold mb-2">Failed to load market data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please check if the backend server is running on port 3001
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Watchlist */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-1 lg:order-3 lg:col-span-3"
        >
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Watchlist</h2>
              <StockSearch
                className="w-[140px] h-8 text-xs"
                placeholder="Search..."
                onSelect={(symbol) => {
                  addToWatchlist(symbol);
                }}
              />
            </div>
            <div className="space-y-3">
              {watchlistStocks.map((stock) => (
                <div key={stock.symbol} className="relative group">
                  <StockCard {...stock} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(stock.symbol);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {watchlistStocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Your watchlist is empty.
                  <br />
                  Search to add stocks.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Live View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-2 lg:order-2 lg:col-span-6 space-y-6"
        >
          {/* Market Indices */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: "fit-content" }}>
              {marketIndices.map((index) => (
                <IndexCard
                  key={index.name}
                  {...index}
                  isActive={overviewSymbol === index.symbol}
                  onClick={() => {
                    if (index.symbol) setOverviewSymbol(index.symbol);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Chart Overview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">
                  {marketIndices.find((idx) => idx.symbol === overviewSymbol)?.name || 'Market Overview'} ({overviewSymbol})
                </h3>
                <p className="text-sm text-muted-foreground">Performance trend</p>
              </div>
              <div className="flex gap-2">
                {["1d", "1mo", "3mo", "1y"].map((period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                  >
                    {period.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            {loadingHistory ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : (
              <MiniChart data={chartData} height={200} color="primary" showAxis={true} />
            )}
          </div>

          {/* Ask Avatar CTA */}
          <Link to="/avatar">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass-card p-6 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ask Avatar to Summarize Market</h3>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered insights on today's market movements
                    </p>
                  </div>
                </div>
                <Button variant="hero">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Briefing
                </Button>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* AI Insights Today */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="order-3 lg:order-1 lg:col-span-3 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">AI Insights Today</h2>
          </div>

          <InsightCard
            title="Top Gainers"
            icon={TrendingUp}
            items={topGainers}
          />
          <InsightCard
            title="Top Losers"
            icon={TrendingDown}
            items={topLosers}
          />
          <InsightCard
            title="High Volume"
            icon={BarChart3}
            items={highVolume}
          />

          <Link to={`/stock?symbol=${overviewSymbol}&mode=comparison`}>
            <Button variant="outline" className="w-full mt-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              Predict Market
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Market Data Explorer */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">Market Movers</h2>
          <p className="text-sm text-muted-foreground">Discover top performing and high volume stocks today.</p>
        </div>

        <Tabs defaultValue="gainers" className="w-full">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="gainers" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Top gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="gap-2">
              <TrendingDown className="h-4 w-4" /> Top losers
            </TabsTrigger>
            <TabsTrigger value="volume" className="gap-2">
              <BarChart3 className="h-4 w-4" /> High volume
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gainers">
            {loadingGainers ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(topGainers)}
          </TabsContent>

          <TabsContent value="losers">
            {loadingGainers ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(topLosers)}
          </TabsContent>

          <TabsContent value="volume">
            {loadingGainers ? <div className="text-center py-10 text-muted-foreground">Loading market data...</div> : renderStockList(highVolume)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
