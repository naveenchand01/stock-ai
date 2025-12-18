import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StockCard } from "@/components/market/StockCard";
import { IndexCard } from "@/components/market/IndexCard";
import { MiniChart } from "@/components/market/MiniChart";
import { InsightCard } from "@/components/insights/InsightCard";
import { Button } from "@/components/ui/button";
import { generateChartData } from "@/data/mockData";
import { useWatchlistStocks, useMarketIndices, useTopGainers, useTopLosers, useHighVolume } from "@/hooks/useStocks";
import { TrendingUp, TrendingDown, BarChart3, Plus, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Watchlist symbols - can be made dynamic later (e.g., from user preferences)
  const watchlistSymbols = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'WIPRO'];

  // Fetch data using React Query hooks
  const { data: watchlistStocks = [], isLoading: loadingWatchlist, error: watchlistError } = useWatchlistStocks(watchlistSymbols);
  const { data: marketIndices = [], isLoading: loadingIndices } = useMarketIndices();
  const { data: topGainers = [], isLoading: loadingGainers } = useTopGainers();
  const { data: topLosers = [] } = useTopLosers();
  const { data: highVolume = [] } = useHighVolume();

  const intradayData = generateChartData(50, "volatile");

  // Loading state
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
        {/* Left Column - Watchlist */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Watchlist</h2>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {watchlistStocks.map((stock) => (
                <Link key={stock.symbol} to="/avatar" className="block">
                  <StockCard {...stock} />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center Column - Live View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-6 space-y-6"
        >
          {/* Market Indices */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: "fit-content" }}>
              {marketIndices.map((index) => (
                <IndexCard key={index.name} {...index} />
              ))}
            </div>
          </div>

          {/* Intraday Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Intraday Overview</h3>
                <p className="text-sm text-muted-foreground">Market performance today</p>
              </div>
              <div className="flex gap-2">
                {["1D", "1W", "1M", "3M"].map((period) => (
                  <Button
                    key={period}
                    variant={period === "1D" ? "default" : "ghost"}
                    size="sm"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <MiniChart data={intradayData} height={200} color="primary" />
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

        {/* Right Column - AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
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

          <Link to="/forecast">
            <Button variant="outline" className="w-full mt-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              Predict Market
            </Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
