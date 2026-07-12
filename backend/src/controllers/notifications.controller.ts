import { Request, Response } from 'express';
import { emailService } from '../services/email.service';
import { whatsappService } from '../services/whatsapp.service';
import { pushNotificationService } from '../services/push.service';
import logger from '../utils/logger';

export class NotificationsController {
    /**
     * POST /api/notifications/test-email
     * Test email notification service
     */
    async testEmail(req: Request, res: Response) {
        try {
            const { to } = req.body;
            const email = to || 'naveenchand01042002@gmail.com'; // Default to user's email

            const result = await emailService.sendPriceAlert({
                to: email,
                symbol: 'AAPL',
                currentPrice: 181.50,
                threshold: 180.00,
                condition: 'crossed above',
            });

            if (result) {
                return res.json({
                    success: true,
                    message: `Test email sent successfully to ${email}!`,
                    note: 'Check your inbox (or spam folder)'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send email. Check server logs for details.'
                });
            }
        } catch (error: any) {
            logger.error('Error sending test email:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to send test email'
            });
        }
    }

    /**
     * POST /api/notifications/test-whatsapp
     * Test WhatsApp notification service
     */
    async testWhatsApp(req: Request, res: Response) {
        try {
            const { to } = req.body;

            if (!to) {
                return res.status(400).json({ error: 'Phone number is required (format: +1234567890)' });
            }

            const result = await whatsappService.sendPriceAlert({
                to,
                symbol: 'TSLA',
                currentPrice: 245.00,
                threshold: 240.00,
                condition: 'crossed above',
            });

            if (result) {
                return res.json({
                    success: true,
                    message: `Test WhatsApp sent to ${to}!`
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send WhatsApp message'
                });
            }
        } catch (error: any) {
            logger.error('Error sending test WhatsApp:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to send WhatsApp message'
            });
        }
    }

    /**
     * GET /api/notifications/vapid-key
     * Get VAPID public key for browser push
     */
    async getVapidKey(req: Request, res: Response) {
        try {
            const publicKey = pushNotificationService.getPublicKey();

            if (!publicKey) {
                return res.status(503).json({
                    error: 'VAPID keys not configured. Generate them and add to .env'
                });
            }

            return res.json({ publicKey });
        } catch (error: any) {
            logger.error('Error getting VAPID key:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/notifications/status
     * Check notification services status
     */
    async getStatus(req: Request, res: Response) {
        try {
            const status = {
                email: false,
                whatsapp: false,
                push: false,
            };

            // Test email service
            try {
                status.email = await emailService.testConnection();
            } catch (e) {
                logger.warn('Email service not available');
            }

            // Test WhatsApp service
            try {
                status.whatsapp = await whatsappService.testConnection();
            } catch (e) {
                logger.warn('WhatsApp service not available');
            }

            // Check push service
            status.push = !!pushNotificationService.getPublicKey();

            return res.json({
                services: status,
                message: 'Notification services status',
                configured: {
                    email: status.email ? '✅ Ready' : '❌ Not configured',
                    whatsapp: status.whatsapp ? '✅ Ready' : '❌ Not configured (optional)',
                    push: status.push ? '✅ Ready' : '❌ Not configured (optional)',
                }
            });
        } catch (error: any) {
            logger.error('Error checking notification status:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/notifications/send-alert
     * Send real price alert
     */
    async sendAlert(req: Request, res: Response) {
        try {
            const { email, whatsapp, symbol, currentPrice, threshold, condition } = req.body;

            let emailSuccess = false;
            let whatsappSuccess = false;

            if (email) {
                emailSuccess = await emailService.sendPriceAlert({
                    to: email,
                    symbol,
                    currentPrice,
                    threshold,
                    condition,
                });
            }

            if (whatsapp) {
                whatsappSuccess = await whatsappService.sendPriceAlert({
                    to: whatsapp,
                    symbol,
                    currentPrice,
                    threshold,
                    condition,
                });
            }

            return res.json({
                success: true,
                emailDelivered: email ? emailSuccess : false,
                whatsappDelivered: whatsapp ? whatsappSuccess : false,
            });
        } catch (error: any) {
            logger.error('Error sending alert:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/notifications/send-batch-alerts
     * Send batch alerts across configured channels for a single user
     */
    async sendBatchAlerts(req: Request, res: Response) {
        try {
            const { email, whatsapp, alerts } = req.body;

            if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
                return res.status(400).json({ error: 'Alerts array is required' });
            }

            let emailSuccess = false;
            let whatsappSuccess = false;

            if (email) {
                emailSuccess = await emailService.sendBatchPriceAlerts({
                    to: email,
                    alerts
                });
            }

            if (whatsapp) {
                whatsappSuccess = await whatsappService.sendBatchPriceAlerts({
                    to: whatsapp,
                    alerts
                });
            }

            return res.json({
                success: true,
                emailDelivered: email ? emailSuccess : false,
                whatsappDelivered: whatsapp ? whatsappSuccess : false,
            });
        } catch (error: any) {
            logger.error('Error sending batch alert:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const notificationsController = new NotificationsController();
