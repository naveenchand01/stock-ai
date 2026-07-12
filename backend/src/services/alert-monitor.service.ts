import cron from 'node-cron';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { stocksService } from './stocks.service';
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import logger from '../utils/logger';

interface Alert {
    id: string;
    userId: string;
    symbol: string;
    type: 'price_above' | 'price_below' | 'percent_change';
    threshold: number;
    active: boolean;
    notifyEmail: boolean;
    notifyWhatsApp: boolean;
    notifyBrowser: boolean;
    lastTriggered?: Date;
}

class AlertMonitorService {
    private isRunning = false;
    private checkInterval: NodeJS.Timeout | null = null;

    /**
     * Start monitoring alerts
     */
    start() {
        if (this.isRunning) {
            logger.warn('Alert monitor already running');
            return;
        }

        logger.info('🚀 Starting alert monitoring service...');
        this.isRunning = true;

        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkAllAlerts();
        }, 60000); // 60 seconds

        // Also run immediately
        this.checkAllAlerts();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        logger.info('⏹️ Alert monitoring service stopped');
    }

    /**
     * Check all active alerts
     */
    private async checkAllAlerts() {
        try {
            logger.info('📊 Checking all active alerts...');

            // TODO: In production, use Firebase Admin SDK on backend
            // For now, this is a placeholder showing the logic

            logger.info('✅ Alert check complete');
        } catch (error) {
            logger.error('Error checking alerts:', error);
        }
    }

    /**
     * Check a single alert
     */
    private async checkAlert(alert: Alert) {
        try {
            // Get current stock price
            const quote = await stocksService.getQuote(alert.symbol);
            const currentPrice = quote.price;

            let shouldTrigger = false;
            let condition = '';

            // Check alert condition
            switch (alert.type) {
                case 'price_above':
                    shouldTrigger = currentPrice > alert.threshold;
                    condition = 'crossed above';
                    break;
                case 'price_below':
                    shouldTrigger = currentPrice < alert.threshold;
                    condition = 'crossed below';
                    break;
                case 'percent_change': {
                    // Calculate percent change from previous close
                    const percentChange = Math.abs(((currentPrice - (quote.previousClose || currentPrice)) / (quote.previousClose || currentPrice)) * 100);
                    shouldTrigger = percentChange >= alert.threshold;
                    condition = `changed by ${percentChange.toFixed(2)}%`;
                    break;
                }
            }

            if (!shouldTrigger) {
                return;
            }

            // Check cooldown period
            if (alert.lastTriggered) {
                const cooldownMinutes = 15; // Configurable
                const timeSinceLastTrigger = Date.now() - alert.lastTriggered.getTime();
                const cooldownMs = cooldownMinutes * 60 * 1000;

                if (timeSinceLastTrigger < cooldownMs) {
                    logger.info(`⏱️ Alert ${alert.id} in cooldown period`);
                    return;
                }
            }

            // Send notifications
            logger.info(`🚨 Triggering alert ${alert.id} for ${alert.symbol}`);

            // TODO: Get user preferences (email, phone)
            const userEmail = 'user@example.com'; // Fetch from Firestore
            const userPhone = '+1234567890'; // Fetch from Firestore

            if (alert.notifyEmail) {
                await emailService.sendPriceAlert({
                    to: userEmail,
                    symbol: alert.symbol,
                    currentPrice,
                    threshold: alert.threshold,
                    condition,
                });
            }

            if (alert.notifyWhatsApp) {
                await whatsappService.sendPriceAlert({
                    to: userPhone,
                    symbol: alert.symbol,
                    currentPrice,
                    threshold: alert.threshold,
                    condition,
                });
            }

            // TODO: Update lastTriggered in Firestore
            logger.info(`✅ Alert ${alert.id} triggered and notifications sent`);
        } catch (error) {
            logger.error(`Error checking alert ${alert.id}:`, error);
        }
    }
}

export const alertMonitorService = new AlertMonitorService();
