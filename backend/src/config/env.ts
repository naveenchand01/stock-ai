import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CACHE_TTL_SECONDS: number;
  CACHE_CHECK_PERIOD: number;
  GEMINI_API_KEY: string;

  // Email Configuration
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;

  // Twilio/WhatsApp Configuration
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_NUMBER?: string;

  // Web Push Configuration
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
}

function validateEnv(): EnvConfig {
  // Validate required env variables
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[WARN] GEMINI_API_KEY is not set - AI features will be limited');
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
    CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '120', 10),
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,

    // WhatsApp
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,

    // Web Push
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  };
}

export const env = validateEnv();
