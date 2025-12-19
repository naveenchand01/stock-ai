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
}

function validateEnv(): EnvConfig {
  // Validate required env variables
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for AI features');
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
    CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '120', 10),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
}

export const env = validateEnv();
