import { supabase } from '@/lib/supabase';

export interface SupabaseUserProfile {
    id: string;
    email: string;
    display_name?: string;
    watchlist: string[];
    persona?: string;
    interests?: string[];
    created_at: string;
    updated_at: string;
}

export interface SupabaseAlertSetting {
    symbol: string;
    price_alert: boolean;
    volume_spike: boolean;
    negative_sentiment: boolean;
    analyst_downgrade: boolean;
    price_threshold?: number;
    volume_threshold_multiplier?: number;
}

/**
 * Handle user profile operations in Supabase
 */
export const supabaseService = {
    // Profiles
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
        return data as SupabaseUserProfile | null;
    },

    async createProfile(profile: Partial<SupabaseUserProfile>) {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                ...profile,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as SupabaseUserProfile;
    },

    async updateWatchlist(userId: string, watchlist: string[]) {
        const { error } = await supabase
            .from('profiles')
            .update({
                watchlist,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;
    },

    async updatePersonalization(userId: string, persona: string, interests: string[]) {
        const { error } = await supabase
            .from('profiles')
            .update({
                persona,
                interests,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;
    },

    // Alert Settings
    async getAlertSettings(userId: string) {
        const { data, error } = await supabase
            .from('alert_settings')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Transform Supabase format to app format if needed
        return data.map(item => ({
            symbol: item.symbol,
            priceAlert: item.price_alert,
            volumeSpike: item.volume_spike,
            negativeSentiment: item.negative_sentiment,
            analystDowngrade: item.analyst_downgrade,
            priceThreshold: item.price_threshold,
            volumeThresholdMultiplier: item.volume_threshold_multiplier
        }));
    },

    async saveAlertSettings(userId: string, alerts: any[]) {
        // First delete existing alerts for this user to simplify sync
        const { error: deleteError } = await supabase
            .from('alert_settings')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        if (alerts.length === 0) return;

        // Transform app format to Supabase format
        const supabaseAlerts = alerts.map(alert => ({
            user_id: userId,
            symbol: alert.symbol,
            price_alert: !!alert.priceAlert,
            volume_spike: !!alert.volumeSpike,
            negative_sentiment: !!alert.negativeSentiment,
            analyst_downgrade: !!alert.analystDowngrade,
            price_threshold: alert.priceThreshold,
            volume_threshold_multiplier: alert.volumeThresholdMultiplier,
            updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
            .from('alert_settings')
            .insert(supabaseAlerts);

        if (insertError) throw insertError;
    }
};
