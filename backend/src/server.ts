import express, { Application } from 'express';
import helmet from 'helmet';
import path from 'path';
import { exec } from 'child_process';
import { env } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import logger from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Serve static dissertation report at /report
const reportPath = path.join(__dirname, '../ml_service/dissertation_results/report');
app.use('/report', express.static(reportPath));
app.get('/report', (req, res) => {
  res.sendFile(path.join(reportPath, 'dissertation_report.html'));
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  logger.info(`📈 Using Yahoo Finance API for real-time stock data`);
  logger.info(`✅ Server is ready to accept requests`);
  
  // Auto-open the dissertation report page when running in dev mode
  if (env.NODE_ENV === 'development') {
    const reportUrl = `http://localhost:${PORT}/report`;
    logger.info(`📄 Dissertation Report available at: ${reportUrl}`);
    exec(`start ${reportUrl}`);
  }
  console.log('🔄 Restarted backend to pick up new .env credentials');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
