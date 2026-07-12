import { supabase } from '@/lib/supabase';

export interface NotificationLimit {
    maxAlertsPerDay: number;
    maxAlertsPerHour: number;
    minCooldownMinutes: number;
    enableEmailDigest: boolean;
    digestTime: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
}

export interface AdminSettings {
    globalNotificationLimits: NotificationLimit;
    userOverrides: { [userId: string]: NotificationLimit };
    enableNotifications: boolean;
    maintenanceMode: boolean;
    updatedAt: string;
}

export interface NotificationStats {
    totalAlertsSent: number;
    emailsSent: number;
    whatsappSent: number;
    browserPushSent: number;
    last24Hours: number;
    byUser: { [userId: string]: number };
}

const ADMIN_TABLE = 'admin_settings';
const STATS_TABLE = 'notification_stats';

/**
 * Get admin settings
 */
export const getAdminSettings = async (): Promise<AdminSettings> => {
    const { data, error } = await supabase
        .from(ADMIN_TABLE)
        .select('*')
        .eq('id', 'global')
        .single();

    if (error || !data) {
        // Return defaults
        return {
            globalNotificationLimits: {
                maxAlertsPerDay: 50,
                maxAlertsPerHour: 10,
                minCooldownMinutes: 15,
                enableEmailDigest: false,
                digestTime: '09:00',
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
            },
            userOverrides: {},
            enableNotifications: true,
            maintenanceMode: false,
            updatedAt: new Date().toISOString(),
        };
    }

    return {
        ...data,
        globalNotificationLimits: data.global_notification_limits,
        userOverrides: data.user_overrides,
        enableNotifications: data.enable_notifications,
        maintenanceMode: data.maintenance_mode,
        updatedAt: data.updated_at
    } as AdminSettings;
};

/**
 * Update admin settings
 */
export const updateAdminSettings = async (settings: Partial<AdminSettings>): Promise<void> => {
    // Transform to snake_case for Supabase
    const supabaseData = {
        global_notification_limits: settings.globalNotificationLimits,
        user_overrides: settings.userOverrides,
        enable_notifications: settings.enableNotifications,
        maintenance_mode: settings.maintenanceMode,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from(ADMIN_TABLE)
        .upsert({ id: 'global', ...supabaseData });

    if (error) throw error;
};

/**
 * Get notification stats
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
    const { data, error } = await supabase
        .from(STATS_TABLE)
        .select('*')
        .eq('id', 'global')
        .single();

    if (error || !data) {
        return {
            totalAlertsSent: 0,
            emailsSent: 0,
            whatsappSent: 0,
            browserPushSent: 0,
            last24Hours: 0,
            byUser: {},
        };
    }

    return {
        totalAlertsSent: data.total_alerts_sent,
        emailsSent: data.emails_sent,
        whatsappSent: data.whatsapp_sent,
        browserPushSent: data.browser_push_sent,
        last24Hours: data.last_24_hours,
        byUser: data.by_user
    } as NotificationStats;
};

/**
 * Increment notification stats
 */
export const incrementNotificationStats = async (
    userId: string,
    channels: { email?: boolean; whatsapp?: boolean; browser?: boolean }
): Promise<void> => {
    const currentStats = await getNotificationStats();

    const updatedStats = {
        total_alerts_sent: currentStats.totalAlertsSent + 1,
        emails_sent: currentStats.emailsSent + (channels.email ? 1 : 0),
        whatsapp_sent: currentStats.whatsappSent + (channels.whatsapp ? 1 : 0),
        browser_push_sent: currentStats.browserPushSent + (channels.browser ? 1 : 0),
        last_24_hours: currentStats.last24Hours + 1,
        by_user: {
            ...currentStats.byUser,
            [userId]: (currentStats.byUser[userId] || 0) + 1,
        }
    };

    const { error } = await supabase
        .from(STATS_TABLE)
        .upsert({ id: 'global', ...updatedStats });

    if (error) throw error;
};

/**
 * Check if user can receive notification (rate limiting)
 */
export const canSendNotification = async (
    userId: string,
    alertId: string
): Promise<{ allowed: boolean; reason?: string }> => {
    const settings = await getAdminSettings();

    // Check maintenance mode
    if (settings.maintenanceMode) {
        return { allowed: false, reason: 'System in maintenance mode' };
    }

    // Check global notifications enabled
    if (!settings.enableNotifications) {
        return { allowed: false, reason: 'Notifications disabled globally' };
    }

    // Get user's limits (check overrides first)
    const limits = settings.userOverrides[userId] || settings.globalNotificationLimits;

    // Check quiet hours
    if (limits.quietHoursStart && limits.quietHoursEnd) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime >= limits.quietHoursStart || currentTime <= limits.quietHoursEnd) {
            return { allowed: false, reason: 'Quiet hours active' };
        }
    }

    // Check daily/hourly limits
    const stats = await getNotificationStats();
    const userAlerts = stats.byUser[userId] || 0;

    if (userAlerts >= limits.maxAlertsPerDay) {
        return { allowed: false, reason: 'Daily limit reached' };
    }

    return { allowed: true };
};
