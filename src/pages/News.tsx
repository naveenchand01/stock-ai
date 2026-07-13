import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stocksApi } from "@/services/stocks.api";
import { Search, MessageSquare, Loader2, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabase.service";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  category: string;
  sentiment: number;
  summary?: string;
  url?: string;
}

const News = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTopic, setSearchTopic] = useState("stock market India");
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userPersona, setUserPersona] = useState<string>("swing");
  const navigate = useNavigate();
  const filters = ["all", "positive", "negative", "neutral"];

  // Interest -> search query mapping
  const interestQueryMap: Record<string, string> = {
    Tech: "technology stocks India NSE",
    Banking: "banking finance stocks India",
    Crypto: "cryptocurrency Bitcoin Ethereum",
    Healthcare: "pharma healthcare stocks India",
    Energy: "oil energy stocks India",
    "Real Estate": "real estate REITs India",
    Consumer: "FMCG consumer goods stocks India",
    Industrial: "manufacturing industrial stocks India",
    Utilities: "utilities infrastructure stocks India",
    Materials: "metals mining materials stocks India",
  };

  // Load user persona and interests from Supabase to personalise news
  useEffect(() => {
    async function loadPersonalization() {
      if (!user?.uid) return;
      try {
        const profile = await supabaseService.getProfile(user.uid);
        if (profile) {
          const interests = profile.interests || [];
          const persona = profile.persona || "swing";
          setUserInterests(interests);
          setUserPersona(persona);
          // Automatically seed the news topic from their top interest
          if (interests.length > 0) {
            const topInterest = interests[0];
            setSearchTopic(interestQueryMap[topInterest] || `${topInterest} stocks India`);
          }
        }
      } catch (err) {
        console.error("Failed to load personalization for News:", err);
      }
    }
    loadPersonalization();
  }, [user]);

  const fetchNews = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const data = await stocksApi.getNews(query);
      setNewsData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setNewsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(searchTopic);
  }, [searchTopic, fetchNews]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchTopic(searchQuery.trim());
    }
  };

  const filteredNews = newsData.filter((news) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "positive") return news.sentiment > 0.1;
    if (selectedFilter === "negative") return news.sentiment < -0.1;
    return Math.abs(news.sentiment) <= 0.1;
  });

  // Compute heatmap from actual news sentiment
  const heatmapData = newsData.reduce((acc, news) => {
    if (!acc[news.source]) {
      acc[news.source] = { total: 0, count: 0 };
    }
    acc[news.source].total += news.sentiment;
    acc[news.source].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const heatmapItems = Object.entries(heatmapData).map(([source, data]) => ({
    name: source,
    sentiment: data.total / data.count,
  }));

  // Top trending topics from headlines
  const trendingWords = (() => {
    const stopWords = new Set(["the", "a", "an", "to", "in", "for", "of", "and", "is", "on", "at", "by", "with", "from", "as", "its", "it", "has", "are", "be", "was", "will", "have", "this", "that", "or", "not", "but", "up", "over", "after", "into", "out", "more", "than", "new", "about", "said", "also"]);
    const wordCount: Record<string, number> = {};
    newsData.forEach(n => {
      n.headline.split(/\s+/).forEach(w => {
        const cleaned = w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
          wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
        }
      });
    });
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, count]) => ({ text, weight: count * 30 }));
  })();

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">News & Sentiment Center</h1>
            <p className="text-muted-foreground">
              {userInterests.length > 0
                ? `Personalised for your ${userPersona} persona · ${userInterests.join(", ")}`
                : "Live market news"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNews(searchTopic)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
              <label className="text-sm font-medium mb-2 block">Search Topic</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full mt-2"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>

            {/* Quick Topics — personalized if user has set interests */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                {userInterests.length > 0 ? (
                  <><Sparkles className="h-3 w-3 text-primary" /> Your Interests</>
                ) : (
                  "Quick Topics"
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {userInterests.length > 0 ? (
                  userInterests.map((interest) => {
                    const query = interestQueryMap[interest] || `${interest} stocks India`;
                    return (
                      <Button
                        key={interest}
                        variant={searchTopic === query ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSearchTopic(query)}
                        className="text-xs"
                      >
                        {interest}
                      </Button>
                    );
                  })
                ) : (
                  ["Nifty 50", "Sensex", "Reliance", "TCS", "Crypto", "Fed Reserve"].map((topic) => (
                    <Button
                      key={topic}
                      variant={searchTopic === topic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchTopic(topic)}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))
                )}
              </div>
              {userInterests.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Set interests in <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/settings")}>Settings</Button> for personalized news
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sentiment Filter</label>
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
              <h3 className="font-semibold">Source Sentiment Heatmap</h3>
              <span className="text-xs text-muted-foreground">
                {newsData.length} articles · AI analyzed
              </span>
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {heatmapItems.length > 0 ? (
                heatmapItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg ${item.sentiment > 0.1
                      ? "bg-success/20 border border-success/30"
                      : item.sentiment < -0.1
                        ? "bg-destructive/20 border border-destructive/30"
                        : "bg-secondary border border-border"
                      }`}
                  >
                    <div className="font-medium text-sm truncate max-w-[120px]">{item.name}</div>
                    <div className={`font-mono text-xs ${item.sentiment > 0.1 ? "text-success" : item.sentiment < -0.1 ? "text-destructive" : "text-muted-foreground"
                      }`}>
                      {item.sentiment > 0 ? "+" : ""}{(item.sentiment * 100).toFixed(0)}%
                    </div>
                  </motion.div>
                ))
              ) : isLoading ? (
                <div className="flex items-center justify-center w-full py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">No source data available</div>
              )}
            </div>
          </div>

          {/* News List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="glass-card p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Fetching live news & running AI sentiment analysis...
                  </p>
                </div>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">
                No news articles found for the current filter.
              </div>
            ) : (
              filteredNews.map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => news.url && window.open(news.url, '_blank')}
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{news.headline}</h4>
                      {news.summary && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {news.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{news.source}</span>
                        <span>{news.time}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                          {news.category}
                        </span>
                        {news.url && (
                          <ExternalLink className="h-3 w-3" />
                        )}
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
                      <span className={`font-mono text-sm ${news.sentiment > 0 ? "text-success" : news.sentiment < 0 ? "text-destructive" : "text-muted-foreground"
                        }`}>
                        {news.sentiment > 0 ? "+" : ""}{(news.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
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
            <h3 className="font-semibold mb-4">Trending Keywords</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : trendingWords.length > 0 ? (
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
                      onClick={() => setSearchTopic(word.text)}
                    >
                      {word.text}
                    </motion.span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trending keywords yet</p>
            )}
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/avatar")}
            >
              "Explain today's Buzz"
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default News;
