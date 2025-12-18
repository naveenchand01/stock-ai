import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsItems, trendingWords, watchlistStocks } from "@/data/mockData";
import { Search, Filter, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const News = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const filters = ["all", "positive", "negative", "neutral"];

  const filteredNews = newsItems.filter((news) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "positive") return news.sentiment > 0.3;
    if (selectedFilter === "negative") return news.sentiment < -0.3;
    return Math.abs(news.sentiment) <= 0.3;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-2">News & Sentiment Center</h1>
        <p className="text-muted-foreground">Real-time market sentiment analysis</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass-card p-4 space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search news..." className="pl-9" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Stock</label>
              <select className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm">
                <option value="">All Stocks</option>
                {watchlistStocks.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">News Source</label>
              <select className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm">
                <option value="">All Sources</option>
                <option value="bloomberg">Bloomberg</option>
                <option value="reuters">Reuters</option>
                <option value="wsj">WSJ</option>
                <option value="cnbc">CNBC</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sentiment Type</label>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Duration</label>
              <select className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm">
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* News Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-6"
        >
          {/* Sentiment Heatmap Header */}
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Stock Sentiment Heatmap</h3>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {watchlistStocks.slice(0, 5).map((stock, index) => {
                const sentiment = Math.random() * 2 - 1;
                return (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg ${
                      sentiment > 0.3
                        ? "bg-success/20 border border-success/30"
                        : sentiment < -0.3
                        ? "bg-destructive/20 border border-destructive/30"
                        : "bg-secondary border border-border"
                    }`}
                  >
                    <div className="font-medium text-sm">{stock.symbol}</div>
                    <div className={`font-mono text-xs ${
                      sentiment > 0.3 ? "text-success" : sentiment < -0.3 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {sentiment > 0 ? "+" : ""}{(sentiment * 100).toFixed(0)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* News List */}
          <div className="space-y-4">
            {filteredNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{news.headline}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{news.source}</span>
                      <span>{news.time}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                        {news.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-destructive">-</span>
                        <span className="text-success">+</span>
                      </div>
                      <div className="h-2 rounded-full bg-gradient-to-r from-destructive via-secondary to-success relative">
                        <motion.div
                          initial={{ left: "50%" }}
                          animate={{ left: `${(news.sentiment + 1) * 50}%` }}
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background"
                        />
                      </div>
                    </div>
                    <span className={`font-mono text-sm ${
                      news.sentiment > 0 ? "text-success" : "text-destructive"
                    }`}>
                      {news.sentiment > 0 ? "+" : ""}{(news.sentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trending Words Cloud */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4">Social Buzz</h3>
            <div className="flex flex-wrap gap-2">
              {trendingWords.map((word, index) => {
                const size = Math.max(12, word.weight / 8);
                return (
                  <motion.span
                    key={word.text}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="px-3 py-1 rounded-full bg-secondary hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors"
                    style={{ fontSize: `${size}px` }}
                  >
                    {word.text}
                  </motion.span>
                );
              })}
            </div>
          </div>

          {/* Ask Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4 mt-4 border-primary/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Ask Avatar</h4>
                <p className="text-xs text-muted-foreground">Get AI insights</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              "Explain today's Buzz"
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default News;
