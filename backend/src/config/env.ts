import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  GROWW_JWT_TOKEN: string;
  GROWW_SECRET_KEY: string;
  GROWW_API_BASE_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CACHE_TTL_SECONDS: number;
  CACHE_CHECK_PERIOD: number;
}

function validateEnv(): EnvConfig {
  const required = [
    'GROWW_JWT_TOKEN',
    'GROWW_SECRET_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
    GROWW_JWT_TOKEN: process.env.GROWW_JWT_TOKEN!,
    GROWW_SECRET_KEY: process.env.GROWW_SECRET_KEY!,
    GROWW_API_BASE_URL: process.env.GROWW_API_BASE_URL || 'https://api.groww.in/v1',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
    CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '120', 10),
  };
}

export const env = validateEnv();
