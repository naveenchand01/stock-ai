import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowRight, BarChart3, Brain, Newspaper, Bell, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { stocksApi } from "@/services/stocks.api";

// Indian market indices + key stocks we'll show on the landing page
const TICKER_SYMBOLS = [
  { symbol: "^NSEI", label: "Nifty 50" },
  { symbol: "^BSESN", label: "Sensex" },
  { symbol: "^NSEBANK", label: "Bank Nifty" },
  { symbol: "^CNXIT", label: "Nifty IT" },
  { symbol: "RELIANCE.NS", label: "Reliance" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
  { symbol: "INFY.NS", label: "Infosys" },
];

// Hero preview stocks with a nice visual card representation
const PREVIEW_SYMBOLS = [
  { symbol: "^NSEI", label: "Nifty 50", color: "text-primary" },
  { symbol: "^BSESN", label: "Sensex", color: "text-success" },
  { symbol: "^CNXIT", label: "Nifty IT", color: "text-warning" },
  { symbol: "RELIANCE.NS", label: "Reliance", color: "text-primary" },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank", color: "text-success" },
  { symbol: "TCS.NS", label: "TCS", color: "text-warning" },
];

interface LiveQuote {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

function useMarketTicker(symbols: typeof TICKER_SYMBOLS) {
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const results = await stocksApi.getWatchlist(symbols.map(s => s.symbol));
      const mapped: LiveQuote[] = results.map((q: any, i: number) => ({
        symbol: symbols[i].symbol,
        label: symbols[i].label,
        price: q.price || 0,
        change: q.change || 0,
        changePercent: q.changePercent || 0,
      })).filter(q => q.price > 0);
      setQuotes(mapped);
    } catch {
      // Silently fail on landing page — it's public
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 30000); // refresh every 30 sec
    return () => clearInterval(timer);
  }, []);

  return { quotes, isLoading, refetch: fetchAll };
}

const Landing = () => {
  const { quotes: tickerQuotes, isLoading: tickerLoading } = useMarketTicker(TICKER_SYMBOLS);
  const [previewQuotes, setPreviewQuotes] = useState<LiveQuote[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Curated financial news channels — opens fresh YouTube results in new tab (no embed blocks)
  const newsChannels = [
    {
      title: "Nifty 50 & Sensex Daily Analysis",
      channel: "ET Markets",
      tag: "🇮🇳 India",
      color: "from-blue-600 to-blue-800",
      searchUrl: "https://www.youtube.com/results?search_query=nifty+50+sensex+market+analysis+today",
      channelUrl: "https://www.youtube.com/@ETMarkets",
    },
    {
      title: "Bank Nifty & Option Chain Recap",
      channel: "CNBC TV18",
      tag: "🏦 Banking",
      color: "from-purple-600 to-purple-800",
      searchUrl: "https://www.youtube.com/results?search_query=bank+nifty+option+chain+today+cnbc",
      channelUrl: "https://www.youtube.com/@CNBCtv18",
    },
    {
      title: "Nasdaq & Dow Jones Wrap",
      channel: "Bloomberg Markets",
      tag: "🇺🇸 US Markets",
      color: "from-red-600 to-red-800",
      searchUrl: "https://www.youtube.com/results?search_query=nasdaq+dow+jones+market+recap+today",
      channelUrl: "https://www.youtube.com/@BloombergTV",
    },
    {
      title: "Tesla & EV Stocks News",
      channel: "CNBC",
      tag: "⚡ Tech/EV",
      color: "from-green-600 to-green-800",
      searchUrl: "https://www.youtube.com/results?search_query=tesla+stock+news+today+2025",
      channelUrl: "https://www.youtube.com/@CNBC",
    },
    {
      title: "Nifty IT & Tech Sector Outlook",
      channel: "ET Now",
      tag: "💻 IT Sector",
      color: "from-yellow-600 to-yellow-800",
      searchUrl: "https://www.youtube.com/results?search_query=nifty+IT+tech+stocks+TCS+Infosys+today",
      channelUrl: "https://www.youtube.com/@ETNow",
    },
    {
      title: "Global Market Movers Today",
      channel: "NDTV Profit",
      tag: "🌐 Global",
      color: "from-orange-600 to-orange-800",
      searchUrl: "https://www.youtube.com/results?search_query=global+stock+market+news+today+2025",
      channelUrl: "https://www.youtube.com/@NDTVProfit",
    },
  ];

  // Load preview quotes separately
  useEffect(() => {
    async function loadPreview() {
      try {
        const results = await stocksApi.getWatchlist(PREVIEW_SYMBOLS.map(s => s.symbol));
        setPreviewQuotes(results.map((q: any, i: number) => ({
          symbol: PREVIEW_SYMBOLS[i].symbol,
          label: PREVIEW_SYMBOLS[i].label,
          price: q.price || 0,
          change: q.change || 0,
          changePercent: q.changePercent || 0,
        })).filter((q: LiveQuote) => q.price > 0));
      } catch { } finally {
        setPreviewLoading(false);
      }
    }
    loadPreview();
  }, []);

  // Rotate the featured preview card every 3 seconds
  useEffect(() => {
    if (previewQuotes.length === 0) return;
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % previewQuotes.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [previewQuotes.length]);

  const featured = previewQuotes[activeIdx];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-lg">Market Navigator AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Live Ticker Bar */}
        <div className="border-t border-border/30 bg-background/60 overflow-hidden py-1.5">
          {tickerLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-0.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading live market data...
            </div>
          ) : tickerQuotes.length > 0 ? (
            <div className="relative flex overflow-hidden">
              <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                {/* Duplicate for seamless loop */}
                {[...tickerQuotes, ...tickerQuotes].map((q, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-xs px-2">
                    <span className="font-semibold text-foreground">{q.label}</span>
                    <span className="font-mono">{q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    <span className={`inline-flex items-center gap-0.5 font-medium ${q.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                      {q.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                    </span>
                  </span>
                ))}
              </motion.div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 chart-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="gradient-text">AI-Driven Avatar System</span> for Real-Time{" "}
                <span className="gradient-text">Stock Market News Presentation</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Forecast. Narrate. Personalize Your Finance. Experience market insights
                like never before with AI-powered analysis and real-time briefings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard">
                  Launch Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="gap-2" onClick={() => setShowVideoModal(true)}>
                <Play className="h-5 w-5" />
                Watch Live Feed
              </Button>
            </motion.div>

            {/* Live Market Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-3xl mx-auto"
            >
              <div className="glass-card p-8 rounded-2xl">
                <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 chart-grid opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                  {/* Live Market Data Inside Preview */}
                  <div className="relative z-10 w-full px-6">
                    {previewLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow flex items-center justify-center">
                          <Brain className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm">Loading live market data...</p>
                      </div>
                    ) : featured ? (
                      <div className="flex flex-col items-center gap-4">
                        {/* AI Avatar */}
                        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow flex items-center justify-center">
                          <Brain className="h-10 w-10 text-primary" />
                        </div>

                        {/* Featured Index Card */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={featured.symbol}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                          >
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{featured.label}</div>
                            <div className="text-3xl font-bold font-mono">
                              {featured.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </div>
                            <div className={`flex items-center justify-center gap-1 mt-1 text-lg font-semibold ${featured.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                              {featured.changePercent >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                              {featured.changePercent >= 0 ? "+" : ""}{featured.changePercent.toFixed(2)}%
                              <span className="text-sm ml-1">({featured.changePercent >= 0 ? "+" : ""}{featured.change.toFixed(2)})</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              "{featured.label} {featured.changePercent >= 0 ? "advances" : "declines"} {Math.abs(featured.changePercent).toFixed(2)}% — live market update"
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {/* Dot indicators */}
                        <div className="flex gap-1.5">
                          {previewQuotes.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveIdx(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? "bg-primary w-4" : "bg-muted-foreground/40"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow flex items-center justify-center">
                          <Brain className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm">"AI-powered market insights at your fingertips"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini Index Row below preview */}
                {previewQuotes.length > 0 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                    {previewQuotes.map((q, i) => (
                      <button
                        key={q.symbol}
                        onClick={() => setActiveIdx(i)}
                        className={`flex-shrink-0 flex flex-col items-start px-3 py-2 rounded-lg transition-all text-left border ${i === activeIdx ? "border-primary/50 bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/30"}`}
                      >
                        <span className="text-xs text-muted-foreground">{q.label}</span>
                        <span className="text-sm font-mono font-medium">{q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                        <span className={`text-xs font-medium ${q.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                          {q.changePercent >= 0 ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -left-4 glass-card p-3 rounded-lg"
              >
                <BarChart3 className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-4 -right-4 glass-card p-3 rounded-lg"
              >
                <Newspaper className="h-6 w-6 text-success" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 right-12 glass-card p-3 rounded-lg"
              >
                <Bell className="h-6 w-6 text-warning" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Smart Investing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay ahead of the market
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: "AI Avatar Briefings", description: "Get personalized market summaries narrated by your AI assistant" },
              { icon: BarChart3, title: "Advanced Forecasting", description: "LSTM, ARIMA, and XGBoost models for price predictions" },
              { icon: Newspaper, title: "Sentiment Analysis", description: "Real-time news and social media sentiment tracking" },
              { icon: Bell, title: "Smart Alerts", description: "Custom triggers for price, volume, and sentiment changes" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted APIs */}
      <section className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted APIs & Data Sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Alpha Vantage", "Polygon", "Yahoo Finance", "Reuters", "Bloomberg"].map((api, index) => (
              <span key={index} className="text-lg font-medium">{api}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold mb-2">Group 4</h3>
            <p className="text-sm text-muted-foreground mb-6">Team Members</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {["Naveen Chand", "Pratham Singh", "Suman Mandal", "Lokesh Ghosh", "Riya Singh", "Santanu Ghosh"].map((member) => (
                <div key={member} className="glass-card p-3 rounded-lg">
                  <p className="text-sm font-medium">{member}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Market Navigator AI. For informational purposes only. Not financial advice.</p>
          </div>
        </div>
      </footer>
      {/* YouTube News Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative z-10 w-full max-w-3xl glass-card rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-semibold text-base">📺 Live Market News Feed</span>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* News Cards Grid */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
                {newsChannels.map((nc, i) => (
                  <motion.a
                    key={i}
                    href={nc.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.03 }}
                    className="group block rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer"
                  >
                    {/* Gradient Thumbnail */}
                    <div className={`h-28 bg-gradient-to-br ${nc.color} flex flex-col items-center justify-center relative`}>
                      <div className="absolute inset-0 bg-black/10" />
                      {/* YouTube-like play button */}
                      <div className="relative z-10 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                      <span className="relative z-10 text-white/80 text-xs mt-2 font-medium">{nc.tag}</span>
                    </div>

                    {/* Card Info */}
                    <div className="p-3 bg-secondary/50">
                      <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{nc.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{nc.channel}</span>
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Watch on YouTube →</span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Click any card to open latest videos on YouTube</p>
                <a
                  href="https://www.youtube.com/results?search_query=stock+market+news+india+today"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Browse all market news →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
