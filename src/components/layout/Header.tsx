import { Bell, Search, User, Menu, LogOut, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { StockSearch } from "@/components/market/StockSearch";
import { getUserAlerts, AlertRule } from "@/services/alerts.service";
import { stocksApi } from "@/services/stocks.api";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Stock", path: "/stock" },
  { label: "Avatar", path: "/avatar" },
  { label: "News", path: "/news" },
  { label: "Watchlist", path: "/watchlist" },
  { label: "Alerts", path: "/alerts" },
  { label: "Settings", path: "/settings" },
];

interface AlertNotification {
  id: string;
  symbol: string;
  type: string;
  threshold: number;
  currentPrice: number;
  changePercent: number;
  read: boolean;
  time: Date;
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load active alerts and current prices to build notification list
  useEffect(() => {
    async function loadAlertNotifications() {
      if (!user?.uid) return;
      try {
        const alerts = await getUserAlerts(user.uid);
        const allActive = alerts.filter((a: AlertRule) => a.active);
        
        // Deduplicate by exact rule in case of duplicate database records
        const uniqueActive = Array.from(new Map(allActive.map(a => [`${a.symbol}-${a.type}-${a.threshold}`, a])).values());
        const activeAlerts = uniqueActive.slice(0, 6);
        
        if (activeAlerts.length === 0) return;

        const symbols = [...new Set(activeAlerts.map((a: AlertRule) => a.symbol))];
        const quotes = await stocksApi.getWatchlist(symbols as string[]);
        const quoteMap: Record<string, any> = {};
        (symbols as string[]).forEach((sym, i) => { quoteMap[sym] = quotes[i]; });

        const notifs: AlertNotification[] = activeAlerts.map((alert: AlertRule) => {
          const quote = quoteMap[alert.symbol];
          const price = quote?.price || 0;
          const changePercent = quote?.changePercent || 0;
          const triggered =
            (alert.type === "price_above" && price >= alert.threshold) ||
            (alert.type === "price_below" && price <= alert.threshold);
          return {
            id: alert.id || alert.symbol,
            symbol: alert.symbol,
            type: alert.type,
            threshold: alert.threshold,
            currentPrice: price,
            changePercent,
            read: !triggered, // unread = currently triggered
            time: new Date(),
          };
        });

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (err) {
        console.error("Failed to load alert notifications:", err);
      }
    }
    loadAlertNotifications();
    const timer = setInterval(loadAlertNotifications, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const typeLabel: Record<string, string> = {
    price_above: "Above ₹",
    price_below: "Below ₹",
    percent_change: "Change %",
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Stock AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex relative">
              <StockSearch
                placeholder="Search any stock..."
                onSelect={(symbol) => navigate(`/stock?symbol=${symbol}&mode=comparison`)}
              />
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotifOpen(prev => !prev)}
                title="Notifications"
              >
                <Bell className={`h-5 w-5 ${notifOpen ? "text-primary" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {unreadCount === 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>

              {/* Dropdown Panel */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 glass-card rounded-xl shadow-2xl border border-border overflow-hidden z-[60]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Alert Notifications</span>
                        {unreadCount > 0 && (
                          <span className="h-5 px-1.5 rounded-full bg-destructive text-white text-[10px] flex items-center font-bold">
                            {unreadCount} triggered
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                          <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />
                          <p className="text-sm text-muted-foreground">No active alerts</p>
                          <p className="text-xs text-muted-foreground mt-1">Set alerts in Watchlist to get notified</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 transition-colors ${notif.read ? "opacity-60" : "bg-primary/5"}`}
                          >
                            {/* Icon */}
                            <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!notif.read ? "bg-destructive/20" : "bg-secondary"}`}>
                              {!notif.read
                                ? <AlertCircle className="h-4 w-4 text-destructive" />
                                : notif.changePercent >= 0
                                  ? <TrendingUp className="h-4 w-4 text-success" />
                                  : <TrendingDown className="h-4 w-4 text-muted-foreground" />
                              }
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-semibold text-sm">{notif.symbol}</span>
                                <span className={`text-xs font-medium ${notif.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                                  {notif.changePercent >= 0 ? "▲" : "▼"}{Math.abs(notif.changePercent).toFixed(2)}%
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {!notif.read ? "🔴 TRIGGERED — " : ""}
                                {typeLabel[notif.type]}{notif.threshold.toLocaleString("en-IN")}
                                {" · "}Current: ₹{notif.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-border/50 bg-secondary/20 flex gap-2">
                      <Link
                        to="/alerts"
                        onClick={() => setNotifOpen(false)}
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        Manage Alerts
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setNotifOpen(false)}
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Watchlist
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
