import twilio from 'twilio';
import { env } from '../config/env';
import logger from '../utils/logger';

class WhatsAppService {
    private client: twilio.Twilio;
    private fromNumber: string;

    constructor() {
        this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        this.fromNumber = env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
    }

    /**
     * Send WhatsApp price alert
     */
    async sendPriceAlert(options: {
        to: string;
        symbol: string;
        currentPrice: number;
        threshold: number;
        condition: string;
    }): Promise<boolean> {
        return this.sendBatchPriceAlerts({
            to: options.to,
            alerts: [options]
        });
    }

    /**
     * Send batch WhatsApp price alerts
     */
    async sendBatchPriceAlerts(options: {
        to: string;
        alerts: {
            symbol: string;
            currentPrice: number;
            threshold: number;
            condition: string;
        }[]
    }): Promise<boolean> {
        try {
            const { to, alerts } = options;

            let message = `🚨 *Market Navigator AI - Daily Alert Digest*\n\n`;

            alerts.forEach(a => {
                message += `*${a.symbol}* has ${a.condition} your threshold!\n`;
                message += `📊 Curr: $${a.currentPrice.toFixed(2)} | 🎯 Target: $${a.threshold.toFixed(2)}\n\n`;
            });

            message += `View details: http://localhost:8080/alerts`;

            await this.client.messages.create({
                from: this.fromNumber,
                to: `whatsapp:${to}`,
                body: message,
            });

            logger.info(`WhatsApp batch alert sent to ${to} for ${alerts.length} symbols`);
            return true;
        } catch (error) {
            logger.error('Failed to send WhatsApp message:', error);
            return false;
        }
    }

    /**
     * Test WhatsApp configuration
     */
    async testConnection(): Promise<boolean> {
        try {
            // Verify Twilio credentials by fetching account info
            const accountSid = env.TWILIO_ACCOUNT_SID;
            if (!accountSid) {
                logger.warn('Twilio Account SID not configured');
                return false;
            }
            await this.client.api.accounts(accountSid).fetch();
            logger.info('WhatsApp service is ready');
            return true;
        } catch (error) {
            logger.error('WhatsApp service configuration error:', error);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
