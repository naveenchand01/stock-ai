import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useWatchlistStocks, useHistoricalData } from "@/hooks/useStocks";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlistAlertMonitoring } from "@/hooks/useWatchlistAlertMonitoring";
import { CandlestickChart } from "@/components/charts/CandlestickChart";
import { stocksApi } from "@/services/stocks.api";
import { supabaseService } from "@/services/supabase.service";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '@/services/alerts.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Bell,
  Mail,
  MessageSquare,
  Save,
  TrendingDown,
  TrendingUp,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  ArrowUpDown,
  DollarSign,
  Activity,
  LineChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface AlertConfig {
  symbol: string;
  priceAlert: boolean;
  volumeSpike: boolean;
  negativeSentiment: boolean;
  analystDowngrade: boolean;
  priceThreshold: number;
  volumeThresholdMultiplier: number;
  saved: boolean; // Track if settings have been saved
  dirty: boolean; // Track if settings have unsaved changes
}

interface SearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  typeDisp?: string;
  quoteType?: string;
}

// Storage keys
const ALERTS_STORAGE_KEY = "watchlist_alerts";

// Period to Interval mapping for charts
const PERIOD_INTERVAL_MAP: Record<string, string> = {
  '1d': '5m',
  '5d': '1h',
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '5y': '1mo'
};

const Watchlist = () => {
  const { user } = useAuth();
  const {
    watchlist: watchlistSymbols,
    addToWatchlist,
    removeFromWatchlist,
    loading: watchlistLoading,
  } = useWatchlist();

  // Fetch watchlist stocks using React Query (auto-refreshes every 60s)
  const {
    data: watchlistStocks = [],
    isLoading,
    error,
  } = useWatchlistStocks(watchlistSymbols);

  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savingSymbol, setSavingSymbol] = useState<string | null>(null);
  const [alertsLoaded, setAlertsLoaded] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    browserEnabled: false,
    emailEnabled: false,
    whatsappEnabled: false,
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getNotificationPreferences(user.uid).then(prefs => {
        if (prefs) setNotificationPrefs(prefs);
      }).catch(console.error);
    }
  }, [user]);

  const handleSavePrefs = async (updates: Partial<NotificationPreferences>) => {
    if (!user?.uid) {
      toast.error('Must be logged in to configure notifications');
      return;
    }
    const newPrefs = { ...notificationPrefs, ...updates };
    setNotificationPrefs(newPrefs);
    setIsSavingPrefs(true);
    try {
      await updateNotificationPreferences(user.uid, newPrefs);
      toast.success('Notification preferences updated!');
    } catch (err: any) {
      console.error("Save prefs error:", err);
      toast.error(`Failed to update preferences: ${err.message || JSON.stringify(err)}`);
      setNotificationPrefs(notificationPrefs); // rollback
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Use the shared monitoring hook for real-time alerts
  const { activeTriggeredAlerts: monitoringAlerts } = useWatchlistAlertMonitoring();

  // Create a map for the UI to easily look up ONLY unread triggered alerts by symbol
  const triggeredAlertsMap = useMemo(() => {
    const map = new Map<string, { message: string, read: boolean }[]>();
    monitoringAlerts.forEach(a => {
      const unreadOnly = a.alerts.filter(item => !item.read);
      if (unreadOnly.length > 0) {
        map.set(a.symbol, unreadOnly);
      }
    });
    return map;
  }, [monitoringAlerts]);

  const [selectedStockForGraph, setSelectedStockForGraph] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1mo");
  const [isGraphDialogOpen, setIsGraphDialogOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch historical data for the selected stock
  const { data: historicalData = [], isLoading: isHistoryLoading } = useHistoricalData(
    selectedStockForGraph || "",
    selectedPeriod,
    PERIOD_INTERVAL_MAP[selectedPeriod] || "1d"
  );

  // Load saved alert settings on mount
  useEffect(() => {
    function loadFromLocalStorage() {
      try {
        const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setAlerts(
            parsed.map((a: AlertConfig) => ({
              ...a,
              saved: true,
              dirty: false,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load from localStorage:", err);
      }
    }

    async function loadAlerts() {
      if (user?.uid) {
        try {
          const savedAlerts = await supabaseService.getAlertSettings(user.uid);
          if (savedAlerts && savedAlerts.length > 0) {
            setAlerts(
              savedAlerts.map((a: any) => ({
                ...a,
                priceThreshold: a.priceThreshold || 0,
                volumeThresholdMultiplier: a.volumeThresholdMultiplier || 2,
                saved: true,
                dirty: false,
              }))
            );
          } else {
            loadFromLocalStorage();
          }
        } catch (err) {
          console.warn("Failed to load alerts from Supabase:", err);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      setAlertsLoaded(true);
    }
    loadAlerts();
  }, [user]);

  // Initialize alerts for new stocks when stocks data is loaded
  useEffect(() => {
    if (watchlistStocks.length > 0 && alertsLoaded) {
      setAlerts((prevAlerts) => {
        const existingSymbols = new Set(prevAlerts.map((a) => a.symbol));
        const currentStockSymbols = new Set(
          watchlistStocks.map((s) => s.symbol)
        );

        const newAlerts = watchlistStocks
          .filter((stock) => !existingSymbols.has(stock.symbol))
          .map((stock) => ({
            symbol: stock.symbol,
            priceAlert: false,
            volumeSpike: false,
            negativeSentiment: false,
            analystDowngrade: false,
            priceThreshold: stock.price,
            volumeThresholdMultiplier: 2,
            saved: false,
            dirty: true,
          }));

        const filtered = prevAlerts.filter((a) =>
          currentStockSymbols.has(a.symbol)
        );

        return [...filtered, ...newAlerts];
      });
    }
  }, [watchlistStocks, alertsLoaded]);

  const toggleAlert = (symbol: string, field: keyof AlertConfig) => {
    setAlerts(
      alerts.map((alert) =>
        alert.symbol === symbol
          ? { ...alert, [field]: !alert[field], dirty: true }
          : alert
      )
    );
  };

  const updateAlertValue = (
    symbol: string,
    field: "priceThreshold" | "volumeThresholdMultiplier",
    value: number
  ) => {
    setAlerts(
      alerts.map((alert) =>
        alert.symbol === symbol
          ? { ...alert, [field]: value, dirty: true }
          : alert
      )
    );
  };

  // Save settings for a specific stock
  const handleSaveSettings = async (symbol: string) => {
    setSavingSymbol(symbol);
    try {
      const alertToSave = alerts.find((a) => a.symbol === symbol);
      if (!alertToSave) return;

      // Mark as saved
      const updatedAlerts = alerts.map((a) =>
        a.symbol === symbol ? { ...a, saved: true, dirty: false } : a
      );
      setAlerts(updatedAlerts);

      if (user?.uid) {
        // Try saving to Supabase first
        try {
          await supabaseService.saveAlertSettings(user.uid, updatedAlerts);
        } catch (supabaseErr) {
          console.warn("Supabase save failed, falling back to localStorage:", supabaseErr);
          localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
        }
      } else {
        // Save to localStorage for unauthenticated users
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      }

      toast.success(`Alert settings saved for ${symbol}`);
    } catch (err) {
      console.error("Failed to save alert settings:", err);
      toast.error("Failed to save settings. Please try again.");
      // Revert saved status
      setAlerts(
        alerts.map((a) =>
          a.symbol === symbol ? { ...a, saved: false, dirty: true } : a
        )
      );
    } finally {
      setSavingSymbol(null);
    }
  };

  // Debounced search function
  const searchStocks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await stocksApi.search(query);
      const quotes = response?.data?.quotes || response?.quotes || [];
      const filtered = quotes.filter(
        (q: SearchResult) =>
          q.quoteType === "EQUITY" ||
          q.quoteType === "ETF" ||
          q.typeDisp === "Equity" ||
          q.typeDisp === "ETF"
      );
      setSearchResults(filtered.slice(0, 15));
    } catch (err) {
      console.error("Stock search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => searchStocks(value), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleAddFromSearch = async (symbol: string) => {
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");
    await addToWatchlist(cleanSymbol);
    setSearchQuery("");
    setSearchResults([]);
    setIsAddDialogOpen(false);
  };

  const handleManualAdd = async () => {
    const symbol = searchQuery.trim().toUpperCase();
    if (!symbol) {
      toast.error("Please enter a stock symbol");
      return;
    }
    await addToWatchlist(symbol);
    setSearchQuery("");
    setSearchResults([]);
    setIsAddDialogOpen(false);
  };

  const handleDeleteStock = async (symbol: string) => {
    await removeFromWatchlist(symbol);
    const updatedAlerts = alerts.filter((a) => a.symbol !== symbol);
    setAlerts(updatedAlerts);

    // Persist removal
    if (user?.uid) {
      try {
        await supabaseService.saveAlertSettings(user.uid, updatedAlerts);
      } catch (err) {
        console.error("Failed to update alert settings after delete:", err);
      }
    } else {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Helper: format volume with K/M/B suffixes
  const formatVolume = (volume: number): string => {
    if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`;
    if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
    return volume.toString();
  };

  // Count active alerts
  const activeAlertCount = useMemo(
    () => triggeredAlertsMap.size,
    [triggeredAlertsMap]
  );

  // Loading state
  if (isLoading || watchlistLoading) {
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
            <p className="text-muted-foreground text-center">
              Loading watchlist...
            </p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
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
            <h3 className="font-semibold mb-2">Failed to load watchlist</h3>
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground">
            Monitor live prices and configure real-time alerts
            {activeAlertCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                {activeAlertCount} active alert{activeAlertCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
      </motion.div>

      {/* Add Stock Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock to Watchlist</DialogTitle>
            <DialogDescription>
              Search any stock, ETF, or index from the global market.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks... (e.g. Apple, TSLA, Reliance)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualAdd();
                }}
                className="pl-9"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          <div className="mt-1">
            {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  No results found for "{searchQuery}"
                </p>
                <Button variant="outline" size="sm" onClick={handleManualAdd}>
                  Add "{searchQuery.toUpperCase()}" manually
                </Button>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                <p className="text-xs text-muted-foreground mb-2">
                  {searchResults.length} result
                  {searchResults.length > 1 ? "s" : ""} found
                </p>
                <AnimatePresence>
                  {searchResults.map((result, idx) => {
                    const isAlreadyAdded = watchlistSymbols.includes(
                      result.symbol.replace(/\.(NS|BO)$/, "")
                    );
                    return (
                      <motion.button
                        key={result.symbol}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() =>
                          !isAlreadyAdded && handleAddFromSearch(result.symbol)
                        }
                        disabled={isAlreadyAdded}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group ${isAlreadyAdded
                          ? "opacity-50 cursor-not-allowed bg-secondary/30"
                          : "hover:bg-secondary/80 cursor-pointer"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {result.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">
                                {result.symbol}
                              </p>
                              {result.exchDisp && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0">
                                  {result.exchDisp}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.longname || result.shortname || ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {isAlreadyAdded ? (
                            <span className="text-xs text-muted-foreground">
                              Added
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="text-center py-6">
                <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Type a company name or symbol to search
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  e.g. "Apple", "TSLA", "Reliance", "NIFTY"
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogChange(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {watchlistSymbols.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[40vh] glass-card p-8 rounded-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No stocks in your watchlist
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
            Start by adding stocks to your watchlist to track prices, set
            alerts, and monitor performance.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Stock
          </Button>
        </motion.div>
      )}

      {/* Stock Alert Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AnimatePresence>
          {alerts.map((alert, index) => {
            const stock = watchlistStocks.find(
              (s) => s.symbol === alert.symbol
            );
            if (!stock) return null;

            const isUp = stock.change >= 0;
            const stockTriggeredAlerts = triggeredAlertsMap.get(alert.symbol) || [];
            const hasTriggeredAlerts = stockTriggeredAlerts.length > 0;
            const hasUnreadAlerts = stockTriggeredAlerts.some(a => !a.read);

            return (
              <motion.div
                key={alert.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-6 relative overflow-hidden ${hasTriggeredAlerts
                  ? "ring-1 ring-warning/50"
                  : ""
                  }`}
                layout
              >
                {/* Triggered alert indicator */}
                {hasUnreadAlerts && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-warning/0 via-warning to-warning/0 animate-pulse" />
                )}
                {!hasUnreadAlerts && hasTriggeredAlerts && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-muted/30" />
                )}

                {/* Stock Header with live data */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${isUp
                        ? "bg-emerald-500/20"
                        : "bg-red-500/20"
                        }`}
                    >
                      <span
                        className={`font-bold text-sm ${isUp ? "text-emerald-400" : "text-red-400"
                          }`}
                      >
                        {alert.symbol.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {alert.symbol}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {stock.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedStockForGraph(alert.symbol);
                        setIsGraphDialogOpen(true);
                      }}
                      title={`View ${alert.symbol} graph`}
                    >
                      <LineChart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteStock(alert.symbol)}
                      title={`Remove ${alert.symbol} from watchlist`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Live Price & Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] uppercase text-muted-foreground font-medium">
                        Price
                      </span>
                    </div>
                    <p className="text-lg font-bold">
                      ₹{stock.price?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] uppercase text-muted-foreground font-medium">
                        Change
                      </span>
                    </div>
                    <p
                      className={`text-sm font-semibold flex items-center gap-1 ${isUp
                        ? "text-emerald-400"
                        : "text-red-400"
                        }`}
                    >
                      {isUp ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {isUp ? "+" : ""}
                      {stock.change?.toFixed(2) || "0.00"} ({stock.changePercent?.toFixed(2) || "0.00"}%)
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] uppercase text-muted-foreground font-medium">
                        Volume
                      </span>
                    </div>
                    <p className={`text-sm font-semibold transition-all duration-500 ${Math.abs(stock.changePercent) > 3 && stock.volume > 1000000
                      ? "text-warning animate-pulse scale-110 origin-left"
                      : ""
                      }`}>
                      {formatVolume(stock.volume)}
                    </p>
                  </div>
                </div>

                {/* Triggered Alerts Banner */}
                {hasTriggeredAlerts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
                      <span className="text-xs font-semibold text-warning">
                        {stockTriggeredAlerts.length} Alert{stockTriggeredAlerts.length > 1 ? "s" : ""} Triggered
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {stockTriggeredAlerts.map((a, i) => (
                        <li
                          key={i}
                          className="text-xs flex items-start gap-1.5 text-muted-foreground"
                        >
                          <span className="text-warning mt-0.5">•</span>
                          {a.message}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Alert Triggers */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5" />
                    Alert Triggers
                    {alert.dirty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">
                        Unsaved
                      </span>
                    )}
                    {alert.saved && !alert.dirty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Saved
                      </span>
                    )}
                  </h4>

                  <div className="space-y-3">
                    {/* Price Alert */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={alert.priceAlert}
                          onCheckedChange={() =>
                            toggleAlert(alert.symbol, "priceAlert")
                          }
                        />
                        <span className="text-sm">Price crosses</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={alert.priceThreshold || ""}
                          onChange={(e) =>
                            updateAlertValue(
                              alert.symbol,
                              "priceThreshold",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28 h-8 text-sm"
                          disabled={!alert.priceAlert}
                          placeholder={stock.price?.toFixed(2) || "0.00"}
                        />
                      </div>
                    </div>

                    {/* Volume Spike */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={alert.volumeSpike}
                          onCheckedChange={() =>
                            toggleAlert(alert.symbol, "volumeSpike")
                          }
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">Volume spike detected</span>
                          <span className="text-[10px] text-muted-foreground">
                            Current: {formatVolume(stock.volume)}
                          </span>
                        </div>
                      </label>
                      <Volume2
                        className={`h-4 w-4 ${stock.volume > 1000000 && Math.abs(stock.changePercent) > 3
                          ? "text-warning"
                          : "text-muted-foreground/40"
                          }`}
                      />
                    </div>

                    {/* Negative Sentiment */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={alert.negativeSentiment}
                          onCheckedChange={() =>
                            toggleAlert(alert.symbol, "negativeSentiment")
                          }
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            Negative sentiment alert
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Triggers on &gt; 2% decline
                          </span>
                        </div>
                      </label>
                      {stock.changePercent < -2 ? (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400/40" />
                      )}
                    </div>

                    {/* Analyst Downgrade */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={alert.analystDowngrade}
                          onCheckedChange={() =>
                            toggleAlert(alert.symbol, "analystDowngrade")
                          }
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">Major decline alert</span>
                          <span className="text-[10px] text-muted-foreground">
                            Triggers on &gt; 5% drop
                          </span>
                        </div>
                      </label>
                      {stock.changePercent < -5 ? (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400/40" />
                      )}
                    </div>
                  </div>

                  {/* Save Settings Button */}
                  <Button
                    variant={alert.dirty ? "default" : "outline"}
                    size="sm"
                    className={`w-full mt-4 ${alert.dirty
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                      }`}
                    onClick={() => handleSaveSettings(alert.symbol)}
                    disabled={savingSymbol === alert.symbol}
                  >
                    {savingSymbol === alert.symbol ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : alert.dirty ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Settings Saved
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Notification Channels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-semibold mb-6">Notification Channels</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium">WhatsApp</h4>
                <p className="text-xs text-muted-foreground">
                  Real-time alerts
                </p>
              </div>
            </div>
            <Input
              placeholder="+1 (555) 000-0000"
              className="mb-3"
              value={notificationPrefs.whatsapp || ''}
              onChange={(e) => setNotificationPrefs(p => ({ ...p, whatsapp: e.target.value }))}
            />
            <Button
              variant={notificationPrefs.whatsappEnabled ? "default" : "outline"}
              className="w-full"
              onClick={() => handleSavePrefs({ whatsappEnabled: !notificationPrefs.whatsappEnabled })}
              disabled={isSavingPrefs}
            >
              {notificationPrefs.whatsappEnabled ? "Disable WhatsApp" : "Connect WhatsApp"}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Email</h4>
                <p className="text-xs text-muted-foreground">Daily digest</p>
              </div>
            </div>
            <Input
              placeholder="you@example.com"
              className="mb-3"
              type="email"
              value={notificationPrefs.email || ''}
              onChange={(e) => setNotificationPrefs(p => ({ ...p, email: e.target.value }))}
            />
            <Button
              variant={notificationPrefs.emailEnabled ? "default" : "outline"}
              className="w-full"
              onClick={() => handleSavePrefs({ emailEnabled: !notificationPrefs.emailEnabled })}
              disabled={isSavingPrefs}
            >
              {notificationPrefs.emailEnabled ? "Disable Email" : "Connect Email"}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-xs text-muted-foreground">Browser alerts</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Enable browser notifications for instant alerts
            </p>
            <Button
              variant={notificationPrefs.browserEnabled ? "default" : "outline"}
              className="w-full"
              onClick={() => handleSavePrefs({ browserEnabled: !notificationPrefs.browserEnabled })}
              disabled={isSavingPrefs}
            >
              {notificationPrefs.browserEnabled ? "Disable Push" : "Enable Push"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stock Graph Dialog */}
      <Dialog open={isGraphDialogOpen} onOpenChange={setIsGraphDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl">
                  {selectedStockForGraph} Performance
                </DialogTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                  <DialogDescription>
                    Candlestick Analysis and Volume Tracking
                  </DialogDescription>
                  <div className="flex flex-wrap gap-1 p-1 bg-secondary/50 border border-border/50 rounded-lg">
                    {['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                      <Button
                        key={p}
                        variant={selectedPeriod === p ? "default" : "ghost"}
                        size="sm"
                        className={`h-7 text-[10px] px-2.5 font-bold uppercase ${selectedPeriod === p
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          }`}
                        onClick={() => setSelectedPeriod(p)}
                      >
                        {p === '1mo' ? '1M' : p === '3mo' ? '3M' : p === '6mo' ? '6M' : p}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 w-full min-h-[400px] relative">
            {isHistoryLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg border border-border/50">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Analyzing historical market data...
                  </p>
                </div>
              </div>
            ) : historicalData && historicalData.length > 0 ? (
              <CandlestickChart data={historicalData} height={400} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 rounded-lg border border-border/50">
                <div className="text-center p-6">
                  <TrendingDown className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No historical data available for this period.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 sm:justify-start gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-muted-foreground font-bold letter-spacing-wider">
                  Period
                </span>
                <span className="text-sm font-semibold uppercase">
                  {selectedPeriod === '1mo' ? '1 Month' :
                    selectedPeriod === '3mo' ? '3 Months' :
                      selectedPeriod === '6mo' ? '6 Months' :
                        selectedPeriod.replace('d', ' Days').replace('y', ' Years')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-muted-foreground font-bold letter-spacing-wider">
                  Interval
                </span>
                <span className="text-sm font-semibold uppercase">
                  {PERIOD_INTERVAL_MAP[selectedPeriod] === '5m' ? '5 Minutes' :
                    PERIOD_INTERVAL_MAP[selectedPeriod] === '1h' ? '1 Hour' :
                      PERIOD_INTERVAL_MAP[selectedPeriod] === '1d' ? '1 Day' :
                        PERIOD_INTERVAL_MAP[selectedPeriod] === '1wk' ? '1 Week' :
                          PERIOD_INTERVAL_MAP[selectedPeriod] === '1mo' ? '1 Month' :
                            PERIOD_INTERVAL_MAP[selectedPeriod]}
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <Button onClick={() => setIsGraphDialogOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Watchlist;
