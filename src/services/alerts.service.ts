import { supabase } from '@/lib/supabase';

export interface AlertRule {
    id?: string;
    userId: string;
    symbol: string;
    type: 'price_above' | 'price_below' | 'percent_change';
    threshold: number;
    active: boolean;
    notifyEmail: boolean;
    notifyWhatsApp: boolean;
    notifyBrowser: boolean;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationPreferences {
    email?: string;
    whatsapp?: string; // Phone number
    browserEnabled: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
}

const ALERTS_TABLE = 'manual_alerts';
const PREFERENCES_TABLE = 'user_preferences';

/**
 * Create a new alert rule
 */
export const createAlert = async (userId: string, alert: Omit<AlertRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const alertData = {
        user_id: userId,
        symbol: alert.symbol,
        type: alert.type,
        threshold: alert.threshold,
        active: alert.active,
        notify_email: alert.notifyEmail,
        notify_whatsapp: alert.notifyWhatsApp,
        notify_browser: alert.notifyBrowser,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from(ALERTS_TABLE)
        .insert(alertData)
        .select()
        .single();

    if (error) throw error;
    return data.id;
};

/**
 * Get all alerts for a user
 */
export const getUserAlerts = async (userId: string): Promise<AlertRule[]> => {
    const { data, error } = await supabase
        .from(ALERTS_TABLE)
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;

    return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        symbol: item.symbol,
        type: item.type,
        threshold: item.threshold,
        active: item.active,
        notifyEmail: item.notify_email,
        notifyWhatsApp: item.notify_whatsapp,
        notifyBrowser: item.notify_browser,
        lastTriggered: item.last_triggered ? new Date(item.last_triggered) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
    })) as AlertRule[];
};

/**
 * Update an alert rule
 */
export const updateAlert = async (alertId: string, updates: Partial<AlertRule>): Promise<void> => {
    // Map to snake_case
    const supabaseUpdates: any = {
        updated_at: new Date().toISOString()
    };
    if (updates.active !== undefined) supabaseUpdates.active = updates.active;
    if (updates.threshold !== undefined) supabaseUpdates.threshold = updates.threshold;
    if (updates.notifyEmail !== undefined) supabaseUpdates.notify_email = updates.notifyEmail;
    if (updates.notifyWhatsApp !== undefined) supabaseUpdates.notify_whatsapp = updates.notifyWhatsApp;
    if (updates.notifyBrowser !== undefined) supabaseUpdates.notify_browser = updates.notifyBrowser;

    const { error } = await supabase
        .from(ALERTS_TABLE)
        .update(supabaseUpdates)
        .eq('id', alertId);

    if (error) throw error;
};

/**
 * Delete an alert rule
 */
export const deleteAlert = async (alertId: string): Promise<void> => {
    const { error } = await supabase
        .from(ALERTS_TABLE)
        .delete()
        .eq('id', alertId);

    if (error) throw error;
};

/**
 * Toggle alert active status
 */
export const toggleAlert = async (alertId: string, active: boolean): Promise<void> => {
    await updateAlert(alertId, { active });
};

/**
 * Get notification preferences for a user
 */
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
    const { data, error } = await supabase
        .from(PREFERENCES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) return null;

    return {
        email: data.email,
        whatsapp: data.whatsapp,
        browserEnabled: data.browser_enabled,
        emailEnabled: data.email_enabled,
        whatsappEnabled: data.whatsapp_enabled
    };
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
    userId: string,
    preferences: NotificationPreferences
): Promise<void> => {
    const supabaseData = {
        user_id: userId,
        email: preferences.email,
        whatsapp: preferences.whatsapp,
        browser_enabled: preferences.browserEnabled,
        email_enabled: preferences.emailEnabled,
        whatsapp_enabled: preferences.whatsappEnabled,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from(PREFERENCES_TABLE)
        .upsert(supabaseData, { onConflict: 'user_id' });

    if (error) {
        console.error("Supabase upsert error:", error);
        throw error;
    }
};

/**
 * Initialize default preferences for new user
 */
export const initializePreferences = async (userId: string, email?: string): Promise<void> => {
    const defaultPrefs: NotificationPreferences = {
        email: email || undefined,
        whatsapp: undefined,
        browserEnabled: false,
        emailEnabled: false,
        whatsappEnabled: false,
    };

    await updateNotificationPreferences(userId, defaultPrefs);
};
