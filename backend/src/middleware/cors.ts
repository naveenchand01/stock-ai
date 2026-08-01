import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    const configuredOrigins = env.FRONTEND_URL ? env.FRONTEND_URL.split(',').map(o => o.trim()) : [];
    
    if (
      env.NODE_ENV !== 'production' ||
      configuredOrigins.includes('*') ||
      configuredOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600, // 10 minutes
});

