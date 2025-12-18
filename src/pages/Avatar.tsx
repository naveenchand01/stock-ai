import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { newsItems, watchlistStocks } from "@/data/mockData";
import { ArrowLeft, Volume2, TrendingUp, Newspaper, LineChart, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";

const Avatar = () => {
  const [selectedStock] = useState(watchlistStocks[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [isPlaying, setIsPlaying] = useState(true);

  const timeframes = ["1D", "1W", "1M", "3M", "1Y"];
  const sentimentScore = 78;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Selected Stock:</span>
              <span className="font-semibold text-lg">{selectedStock.symbol}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={selectedTimeframe === tf ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono ${selectedStock.change >= 0 ? "text-success" : "text-destructive"}`}>
              ${selectedStock.price.toFixed(2)}
            </span>
            <span className={`font-mono text-sm ${selectedStock.change >= 0 ? "text-success" : "text-destructive"}`}>
              ({selectedStock.change >= 0 ? "+" : ""}{selectedStock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <div className="glass-card overflow-hidden">
            {/* Video Container */}
            <div className="aspect-video bg-secondary relative">
              <div className="absolute inset-0 chart-grid opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              
              {/* Avatar Visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
                  transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                  className="relative"
                >
                  <div className="w-48 h-48 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center animate-pulse-glow">
                      <Volume2 className="h-16 w-16 text-primary" />
                    </div>
                  </div>
                  {/* Audio Waves */}
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute w-48 h-48 rounded-full border border-primary/30"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        className="absolute w-48 h-48 rounded-full border border-primary/30"
                      />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Subtitle */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <motion.p
                  key={isPlaying ? "playing" : "paused"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-lg"
                >
                  {isPlaying 
                    ? `"${selectedStock.symbol} ${selectedStock.change >= 0 ? 'rises' : 'falls'} ${Math.abs(selectedStock.changePercent).toFixed(1)}% after quarterly earnings ${selectedStock.change >= 0 ? 'beat expectations' : 'missed targets'}. The stock shows ${selectedStock.change >= 0 ? 'strong momentum' : 'weakness'} in today's trading session..."`
                    : "Click play to start the AI briefing"}
                </motion.p>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Sentiment Widget */}
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">Sentiment Score</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sentimentScore}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-success rounded-full"
                      />
                    </div>
                    <span className="font-mono text-sm text-success">{sentimentScore}%</span>
                  </div>
                </div>

                {/* Volume Indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <span className="text-muted-foreground">Volume Spike Detected</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button variant="glass" className="flex-1 min-w-32">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Summarize News
                </Button>
                <Button variant="glass" className="flex-1 min-w-32">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Predict Trend
                </Button>
                <Button variant="glass" className="flex-1 min-w-32">
                  <LineChart className="h-4 w-4 mr-2" />
                  Show Chart
                </Button>
                <Button variant="glass" className="flex-1 min-w-32">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Explain Reason
                </Button>
              </div>
            </div>
          </div>

          {/* Play/Pause Control */}
          <div className="flex justify-center mt-4">
            <Button
              variant={isPlaying ? "outline" : "hero"}
              size="lg"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "Pause Briefing" : "Resume Briefing"}
            </Button>
          </div>
        </motion.div>

        {/* News Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-4 h-full">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Latest News Headlines
            </h3>
            <div className="space-y-4">
              {newsItems.slice(0, 5).map((news) => (
                <motion.div
                  key={news.id}
                  whileHover={{ x: 4 }}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <h4 className="text-sm font-medium mb-2 line-clamp-2">
                    {news.headline}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{news.source}</span>
                    <span>{news.time}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            news.sentiment > 0 ? "bg-success" : "bg-destructive"
                          }`}
                          style={{ width: `${Math.abs(news.sentiment) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${news.sentiment > 0 ? "text-success" : "text-destructive"}`}>
                        {news.sentiment > 0 ? "+" : ""}{(news.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Avatar;
