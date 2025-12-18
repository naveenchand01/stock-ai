import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useWatchlistStocks } from "@/hooks/useStocks";
import { Plus, Trash2, Bell, Mail, MessageSquare, Save, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AlertConfig {
  symbol: string;
  priceAlert: boolean;
  volumeSpike: boolean;
  negativeSentiment: boolean;
  analystDowngrade: boolean;
  priceThreshold?: number;
}

const Watchlist = () => {
  // Watchlist symbols - can be made dynamic later
  const watchlistSymbols = ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK'];

  // Fetch watchlist stocks using React Query
  const { data: watchlistStocks = [], isLoading, error } = useWatchlistStocks(watchlistSymbols);

  const [alerts, setAlerts] = useState<AlertConfig[]>([]);

  // Initialize alerts when stocks data is loaded
  useEffect(() => {
    if (watchlistStocks.length > 0 && alerts.length === 0) {
      setAlerts(
        watchlistStocks.map((stock) => ({
          symbol: stock.symbol,
          priceAlert: true,
          volumeSpike: true,
          negativeSentiment: false,
          analystDowngrade: false,
          priceThreshold: stock.price,
        }))
      );
    }
  }, [watchlistStocks, alerts.length]);

  const toggleAlert = (symbol: string, field: keyof AlertConfig) => {
    setAlerts(alerts.map((alert) =>
      alert.symbol === symbol
        ? { ...alert, [field]: !alert[field] }
        : alert
    ));
  };

  // Loading state
  if (isLoading) {
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
            <p className="text-muted-foreground text-center">Loading watchlist...</p>
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
          <h1 className="text-2xl font-bold">Watchlist & Alerts</h1>
          <p className="text-muted-foreground">Configure your stock alerts and triggers</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
      </motion.div>

      {/* Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {alerts.map((alert, index) => {
          const stock = watchlistStocks.find((s) => s.symbol === alert.symbol);
          if (!stock) return null;

          return (
            <motion.div
              key={alert.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-primary">{alert.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{alert.symbol}</h3>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Triggers</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alert.priceAlert}
                        onCheckedChange={() => toggleAlert(alert.symbol, "priceAlert")}
                      />
                      <span className="text-sm">Price crosses</span>
                    </label>
                    <Input
                      type="number"
                      value={alert.priceThreshold}
                      className="w-24 h-8 text-sm"
                      disabled={!alert.priceAlert}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={alert.volumeSpike}
                      onCheckedChange={() => toggleAlert(alert.symbol, "volumeSpike")}
                    />
                    <span className="text-sm">Volume spike detected</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={alert.negativeSentiment}
                      onCheckedChange={() => toggleAlert(alert.symbol, "negativeSentiment")}
                    />
                    <span className="text-sm">Negative sentiment alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={alert.analystDowngrade}
                      onCheckedChange={() => toggleAlert(alert.symbol, "analystDowngrade")}
                    />
                    <span className="text-sm">Analyst downgrade</span>
                  </label>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </motion.div>
          );
        })}
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
                <p className="text-xs text-muted-foreground">Real-time alerts</p>
              </div>
            </div>
            <Input placeholder="+1 (555) 000-0000" className="mb-3" />
            <Button variant="outline" className="w-full">
              Connect WhatsApp
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
            <Input placeholder="you@example.com" className="mb-3" />
            <Button variant="outline" className="w-full">
              Connect Email
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
            <Button variant="outline" className="w-full">
              Enable Push
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Watchlist;
