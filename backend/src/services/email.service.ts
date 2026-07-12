import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    // For production, use services like SendGrid, AWS SES, or Gmail with App Password
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Send price alert email
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
   * Send batch price alerts email
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

      const subject = `🚨 Market Navigator: ${alerts.length} New Alerts Triggered!`;

      const alertsHtml = alerts.map(a => `
              <div class="alert-box">
                <h2>${a.symbol} Triggered!</h2>
                <p><strong>${a.symbol}</strong> has ${a.condition} your threshold.</p>
                <p>Current Price: <span class="price">$${a.currentPrice.toFixed(2)}</span></p>
                <p>Your Alert: ${a.condition} <strong>$${a.threshold.toFixed(2)}</strong></p>
              </div>
            `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { color: #1a1a1a; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
            .alert-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
            .price { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="header">📊 Market Navigator AI - Daily Alert Digest</h1>
            
            ${alertsHtml}

            <div class="footer">
              <p>You received this email because you configured alerts in Market Navigator AI.</p>
              <p>To manage your notifications, visit your dashboard.</p>
            </div>
          </div>
        </body>
        </html>
            `;
      await this.transporter.sendMail({
        from: `"Market Navigator AI" <${env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      logger.info(`Batch price alert email sent to ${to} for ${alerts.length} symbols`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready');
      return true;
    } catch (error) {
      logger.error('Email service configuration error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
