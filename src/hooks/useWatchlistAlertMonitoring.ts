import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWatchlist } from './useWatchlist';
import { useWatchlistStocks } from './useStocks';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabase.service';
import { apiClient } from '@/services/api';
import { getNotificationPreferences, NotificationPreferences } from '@/services/alerts.service';
export interface AlertNotification {
    id: string;
    symbol: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'price_cross' | 'volume_spike' | 'negative_sentiment' | 'downgrade';
}

const ALERTS_STORAGE_KEY = "watchlist_alerts";
const NOTIFICATIONS_STORAGE_KEY = "alert_notifications";
const LAST_ALERTED_STORAGE_KEY = "alert_last_alerted";

export function useWatchlistAlertMonitoring() {
    const { user } = useAuth();
    const { watchlist: watchlistSymbols } = useWatchlist();
    const { data: watchlistStocks = [], isLoading: stocksLoading } = useWatchlistStocks(watchlistSymbols);

    const [alertConfigs, setAlertConfigs] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<AlertNotification[]>([]);
    const [lastAlerted, setLastAlerted] = useState<Record<string, string>>({});
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    // Load notification preferences
    useEffect(() => {
        if (user?.uid) {
            getNotificationPreferences(user.uid).then(setPrefs).catch(console.error);
        }
    }, [user]);

    // Load alert configs
    useEffect(() => {
        async function loadAlerts() {
            if (user?.uid) {
                try {
                    const saved = await supabaseService.getAlertSettings(user.uid);
                    if (saved && saved.length > 0) {
                        setAlertConfigs(saved);
                    } else {
                        const local = localStorage.getItem(ALERTS_STORAGE_KEY);
                        if (local) setAlertConfigs(JSON.parse(local));
                    }
                } catch (err) {
                    console.error("Monitoring: Failed to fetch Supabase alerts", err);
                    const local = localStorage.getItem(ALERTS_STORAGE_KEY);
                    if (local) setAlertConfigs(JSON.parse(local));
                }
            } else {
                const local = localStorage.getItem(ALERTS_STORAGE_KEY);
                if (local) setAlertConfigs(JSON.parse(local));
            }
            setLoading(false);
        }
        loadAlerts();
    }, [user]);

    // Load notifications and lastAlerted from localStorage on mount
    useEffect(() => {
        const storedNotifs = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifs) {
            try {
                setNotifications(JSON.parse(storedNotifs));
            } catch (e) {
                console.error("Failed to parse notifications", e);
            }
        }

        const storedLast = localStorage.getItem(LAST_ALERTED_STORAGE_KEY);
        if (storedLast) {
            try {
                setLastAlerted(JSON.parse(storedLast));
            } catch (e) {
                console.error("Failed to parse lastAlerted", e);
            }
        }
    }, []);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }, [notifications]);

    // Save lastAlerted to localStorage
    useEffect(() => {
        localStorage.setItem(LAST_ALERTED_STORAGE_KEY, JSON.stringify(lastAlerted));
    }, [lastAlerted]);

    // Automated trigger detection
    useEffect(() => {
        if (watchlistStocks.length === 0 || alertConfigs.length === 0) return;

        const newNotifications: AlertNotification[] = [...notifications];
        const newLastAlerted = { ...lastAlerted };
        let changed = false;
        const batchAlerts: any[] = [];
        const todayStr = new Date().toDateString();

        alertConfigs.forEach((config) => {
            const stock = watchlistStocks.find((s) => s.symbol === config.symbol);
            if (!stock) return;

            const checkTrigger = (type: AlertNotification['type'], condition: boolean, message: string) => {
                if (condition) {
                    const triggerKey = `${stock.symbol}-${type}-${config.priceThreshold}-${config.volumeThresholdMultiplier}`;
                    const now = Date.now();
                    const testModeCooldown = now - 60000; // 1 Minute cooldown for UI
                    const lastTime = newLastAlerted[triggerKey] ? new Date(newLastAlerted[triggerKey]).getTime() : 0;

                    if (lastTime < testModeCooldown) {
                        newNotifications.unshift({
                            id: `${stock.symbol}-${type}-${now}`,
                            symbol: stock.symbol,
                            message,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type
                        });
                        newLastAlerted[triggerKey] = new Date(now).toISOString();
                        changed = true;

                        // Only queue for batch sending if we haven't sent a digest today
                        const digestKey = `dailyDigest-${todayStr}`;
                        if (!newLastAlerted[digestKey]) {
                            batchAlerts.push({
                                symbol: stock.symbol,
                                currentPrice: stock.price,
                                threshold: config.priceThreshold || 0,
                                condition: message
                            });
                        }
                    }
                }
            };

            // Price alert
            if (config.priceAlert && typeof stock.price === 'number' && config.priceThreshold && config.priceThreshold > 0) {
                checkTrigger('price_cross', stock.price >= config.priceThreshold,
                    `Price ₹${stock.price?.toFixed(2) || '---'} crossed ₹${config.priceThreshold?.toFixed(2) || '---'}`);
            }

            // Volume spike
            if (config.volumeSpike && typeof stock.volume === 'number' && typeof stock.changePercent === 'number') {
                if (stock.volume > 1000000 && Math.abs(stock.changePercent) > 3) {
                    checkTrigger('volume_spike', true,
                        `Volume spike: ${(stock.volume / 1000000).toFixed(2)}M shares traded`);
                }
            }

            // Negative sentiment
            if (config.negativeSentiment && typeof stock.changePercent === 'number') {
                if (stock.changePercent < -2) {
                    checkTrigger('negative_sentiment', true,
                        `Negative momentum: ${stock.changePercent.toFixed(2)}% decline`);
                }
            }

            // Analyst downgrade
            if (config.analystDowngrade && typeof stock.changePercent === 'number') {
                if (stock.changePercent < -5) {
                    checkTrigger('downgrade', true,
                        `Major drop: ${stock.changePercent.toFixed(2)}% fall detected`);
                }
            }
        });

        if (batchAlerts.length > 0 && user?.uid) {
            console.log(`[ALERT] Batching ${batchAlerts.length} alerts for daily digest...`);
            getNotificationPreferences(user.uid).then(currentPrefs => {
                const emailToUse = currentPrefs?.emailEnabled ? currentPrefs.email : undefined;
                const whatsappToUse = currentPrefs?.whatsappEnabled ? currentPrefs.whatsapp : undefined;

                if (emailToUse || whatsappToUse) {
                    apiClient.post('/notifications/send-batch-alerts', {
                        email: emailToUse,
                        whatsapp: whatsappToUse,
                        alerts: batchAlerts
                    }).then(res => {
                        console.log('[ALERT] Batch API Response:', res);
                        // Mark the digest as sent for today so we don't spam them again today
                        const digestKey = `dailyDigest-${todayStr}`;
                        setLastAlerted(prev => ({ ...prev, [digestKey]: new Date().toISOString() }));
                    }).catch(err => {
                        console.error('[ALERT] Batch API Error:', err);
                    });
                } else {
                    console.log('[ALERT] Email/WA disabled. Not sending batch request.');
                }
            }).catch(console.error);
        }

        if (changed) {
            setLastAlerted(newLastAlerted);
            setNotifications(newNotifications.slice(0, 50));
        }
    }, [watchlistStocks, alertConfigs, user?.uid]); // Add user?.uid to deps

    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        setLastAlerted({}); // Reset timers when clearing history
    }, []);

    const deleteNotification = useCallback((notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // Attempt to reset timer for this specific trigger
        try {
            const parts = notificationId.split('-');
            if (parts.length >= 2) {
                const symbol = parts[0];
                const type = parts[1];
                const triggerKey = `${symbol}-${type}`;
                setLastAlerted(prev => {
                    const next = { ...prev };
                    delete next[triggerKey];
                    return next;
                });
            }
        } catch (e) {
            console.error("Failed to reset timer during deletion:", e);
        }
    }, []);

    // Show all available notifications for "live" triggered view (including read ones)
    const activeTriggeredAlerts = useMemo(() => {
        const symbolMap = new Map<string, { message: string, read: boolean }[]>();
        notifications.forEach(n => {
            const existing = symbolMap.get(n.symbol) || [];
            if (!existing.some(e => e.message === n.message)) {
                symbolMap.set(n.symbol, [...existing, { message: n.message, read: n.read }]);
            }
        });

        return Array.from(symbolMap.entries()).map(([symbol, alerts]) => ({
            symbol,
            alerts
        }));
    }, [notifications]);

    return {
        notifications,
        activeTriggeredAlerts,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        deleteNotification,
        loading: loading || stocksLoading
    };
}
