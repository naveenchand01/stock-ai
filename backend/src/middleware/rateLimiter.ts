import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check and the news endpoint
  // (news makes multiple slow external calls and would eat rate limit budget)
  skip: (req) => req.path === '/api/health' || req.path.startsWith('/api/stocks/news'),
});
