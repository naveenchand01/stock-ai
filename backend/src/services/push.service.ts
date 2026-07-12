import webpush from 'web-push';
import { env } from '../config/env';
import logger from '../utils/logger';

class PushNotificationService {
    private vapidConfigured = false;

    constructor() {
        // Set VAPID keys for web push
        try {
            if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
                // Trim any whitespace from keys
                const publicKey = env.VAPID_PUBLIC_KEY.trim();
                const privateKey = env.VAPID_PRIVATE_KEY.trim();

                webpush.setVapidDetails(
                    'mailto:support@marketnavigator.ai',
                    publicKey,
                    privateKey
                );
                this.vapidConfigured = true;
                logger.info('✅ Web Push VAPID keys configured successfully');
            } else {
                logger.warn('⚠️ VAPID keys not found - Browser push notifications disabled');
            }
        } catch (error) {
            logger.error('❌ Failed to configure VAPID keys:', error);
            logger.warn('Browser push notifications will be disabled');
            this.vapidConfigured = false;
        }
    }

    /**
     * Send browser push notification
     */
    async sendPushNotification(options: {
        subscription: webpush.PushSubscription;
        symbol: string;
        currentPrice: number;
        threshold: number;
        condition: string;
    }): Promise<boolean> {
        try {
            if (!this.vapidConfigured) {
                logger.warn('VAPID not configured - skipping push notification');
                return false;
            }

            const { subscription, symbol, currentPrice, threshold, condition } = options;

            const payload = JSON.stringify({
                title: `🚨 ${symbol} Price Alert`,
                body: `${symbol} ${condition} $${threshold.toFixed(2)}. Current: $${currentPrice.toFixed(2)}`,
                icon: '/logo.png',
                badge: '/badge.png',
                data: {
                    url: '/alerts',
                    symbol,
                    currentPrice,
                    threshold,
                },
            });

            await webpush.sendNotification(subscription, payload);
            logger.info(`Push notification sent for ${symbol}`);
            return true;
        } catch (error) {
            logger.error('Failed to send push notification:', error);
            return false;
        }
    }

    /**
     * Get VAPID public key for frontend
     */
    getPublicKey(): string | undefined {
        return env.VAPID_PUBLIC_KEY;
    }

    /**
     * Generate VAPID keys (run once during setup)
     */
    static generateVapidKeys(): { publicKey: string; privateKey: string } {
        return webpush.generateVAPIDKeys();
    }
}

export const pushNotificationService = new PushNotificationService();
