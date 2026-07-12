import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabase.service';
import { toast } from 'sonner';

const DEFAULT_WATCHLIST = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'ICICIBANK', 'HINDUNILVR', 'LT'];

export function useWatchlist() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<string[]>(() => {
        // Fallback to localStorage for unauthenticated users
        const saved = localStorage.getItem('watchlist');
        return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    });
    const [loading, setLoading] = useState(true);

    // Fetch watchlist from Supabase when user is authenticated
    useEffect(() => {
        async function fetchWatchlist() {
            if (user?.uid) {
                try {
                    // Try to get profile
                    let profile = await supabaseService.getProfile(user.uid);

                    if (!profile) {
                        // Create profile if it doesn't exist
                        profile = await supabaseService.createProfile({
                            id: user.uid,
                            email: user.email || '',
                            display_name: user.displayName || '',
                            watchlist: watchlist // Use current local watchlist as initial
                        });
                    }

                    setWatchlist(profile.watchlist || []);
                } catch (error) {
                    console.error('Failed to fetch watchlist from Supabase:', error);
                    toast.error('Failed to load your watchlist');
                } finally {
                    setLoading(false);
                }
            } else {
                // Not authenticated - use localStorage
                setLoading(false);
            }
        }

        fetchWatchlist();
    }, [user]);

    // Persist to localStorage for all users (as fallback)
    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }, [watchlist]);

    // Listen for cross-component sync events
    useEffect(() => {
        const handleSync = (e: CustomEvent) => {
            setWatchlist(e.detail);
        };
        window.addEventListener('watchlist-updated', handleSync as EventListener);
        return () => window.removeEventListener('watchlist-updated', handleSync as EventListener);
    }, []);

    const addToWatchlist = async (symbol: string) => {
        if (watchlist.includes(symbol)) {
            toast.error(`${symbol} is already in your watchlist`);
            return;
        }

        const newWatchlist = [...watchlist, symbol];
        setWatchlist(newWatchlist);
        window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: newWatchlist }));

        if (user?.uid) {
            try {
                await supabaseService.updateWatchlist(user.uid, newWatchlist);
                toast.success(`Added ${symbol} to watchlist`);
            } catch (error) {
                console.error('Failed to sync add to watchlist with DB:', error);
                // Don't rollback, allow local state to persist
            }
        } else {
            toast.success(`Added ${symbol} to watchlist`);
        }
    };

    const removeFromWatchlist = async (symbol: string) => {
        const baseSymbol = symbol.replace('.NS', '');
        const newWatchlist = watchlist.filter((s) => s.replace('.NS', '') !== baseSymbol);
        setWatchlist(newWatchlist);
        window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: newWatchlist }));

        if (user?.uid) {
            try {
                await supabaseService.updateWatchlist(user.uid, newWatchlist);
                toast.success(`Removed ${symbol} from watchlist`);
            } catch (error) {
                console.error('Failed to sync remove from watchlist with DB:', error);
                // Don't rollback, allow local state to persist
            }
        } else {
            toast.success(`Removed ${symbol} from watchlist`);
        }
    };

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        loading,
    };
}
