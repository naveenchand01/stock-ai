import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Trash2, TrendingUp, TrendingDown, Percent, Mail, MessageCircle, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWatchlistAlertMonitoring } from '@/hooks/useWatchlistAlertMonitoring';
import { AlertTriangle, Activity, TrendingDown as TrendingDownIcon, Search, Volume2 } from 'lucide-react';

const Alerts = () => {
    const { user } = useAuth();
    const { alerts: configAlerts, loading: configsLoading } = useAlerts();
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        deleteNotification,
        loading: monitoringLoading
    } = useWatchlistAlertMonitoring();

    const activeCount = notifications.filter(n => !n.read).length;
    const inactiveCount = notifications.filter(n => n.read).length;
    const totalCount = notifications.length;

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'price_above':
                return <TrendingUp className="h-4 w-4" />;
            case 'price_below':
                return <TrendingDown className="h-4 w-4" />;
            case 'percent_change':
                return <Percent className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getAlertDescription = (alert: any) => {
        const condition = alert.type === 'price_above' ? 'goes above' :
            alert.type === 'price_below' ? 'goes below' :
                'changes by';
        const value = alert.type === 'percent_change' ? `${alert.threshold}%` : `$${alert.threshold.toFixed(2)}`;
        return `${alert.symbol} ${condition} ${value}`;
    };

    if (!user) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Sign in to Create Alerts</h2>
                    <p className="text-muted-foreground mb-6">
                        Get notified when stocks reach your target prices
                    </p>
                    <Link to="/login">
                        <Button size="lg">Sign In</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Bell className="h-8 w-8 text-primary" />
                            Price Alerts
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Real-time triggers for your watchlisted stocks
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Alerts Detected</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        <div className="text-4xl font-black">{totalCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-semibold text-warning uppercase tracking-wider">Active (Unread)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        <div className="text-4xl font-black text-warning">
                            {activeCount}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Inactive (Read)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        <div className="text-4xl font-black text-muted-foreground">
                            {inactiveCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Market Watchlist Alerts Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Market Alert History
                    </h2>
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs h-8"
                            >
                                Mark All as Read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllNotifications}
                                className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 h-8"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>

                {monitoringLoading && notifications.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-pulse text-muted-foreground">
                        <Activity className="h-4 w-4 animate-spin" />
                        <span>Scanning market for watchlist triggers...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-1">No alerts detected yet</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-sm">
                                Alerts will appear here automatically based on your Watchlist settings.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {notifications.map((alert, idx) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => markAsRead(alert.id)}
                                    className="cursor-pointer"
                                >
                                    <Card className={`overflow-hidden h-full transition-all duration-300 ${alert.read
                                        ? "opacity-60 bg-muted/30 border-muted"
                                        : "border-warning/30 bg-gradient-to-br from-warning/10 to-transparent ring-1 ring-warning/20 shadow-lg shadow-warning/5"
                                        }`}>
                                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className={`text-lg font-bold ${alert.read ? 'text-muted-foreground' : 'text-warning'}`}>
                                                        {alert.symbol}
                                                    </CardTitle>
                                                    {!alert.read && (
                                                        <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                                                    )}
                                                </div>
                                                <CardDescription className="text-xs">
                                                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${alert.read ? 'bg-muted' : 'bg-warning/20'}`}>
                                                    <Volume2 className={`h-4 w-4 ${alert.read ? 'text-muted-foreground' : 'text-warning'}`} />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(alert.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className={`text-sm ${alert.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                                                {alert.message}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-border/10 flex justify-between items-center">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                                    {alert.read ? 'Dismissed' : 'Action Required'}
                                                </span>
                                                {!alert.read && (
                                                    <span className="text-[10px] font-bold text-warning uppercase">New</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Custom Price Alert Rules
            </h2>
            {configsLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Loading alerts...</p>
                </div>
            ) : configAlerts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No custom rules set</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Go to your Watchlist to enable specific triggers like Volume Spikes or Price Crosses for your favorite stocks.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {configAlerts.map((alert, index) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={alert.active ? '' : 'opacity-60'}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`p-3 rounded-full ${alert.active ? 'bg-primary/10' : 'bg-muted'}`}>
                                                {getAlertIcon(alert.type)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{alert.symbol}</h3>
                                                    {alert.active && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-muted-foreground mb-3">
                                                    {getAlertDescription(alert)}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {alert.notifyEmail && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            Email
                                                        </div>
                                                    )}
                                                    {alert.notifyWhatsApp && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MessageCircle className="h-3 w-3" />
                                                            WhatsApp
                                                        </div>
                                                    )}
                                                    {alert.notifyBrowser && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Chrome className="h-3 w-3" />
                                                            Browser
                                                        </div>
                                                    )}
                                                </div>

                                                {alert.lastTriggered && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">{alert.active ? 'Monitoring' : 'Paused'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

        </DashboardLayout>
    );
};

export default Alerts;
