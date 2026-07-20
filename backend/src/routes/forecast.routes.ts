import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

// Python ML Service URL
const PYTHON_SERVICE_URL = 'http://localhost:5000/predict';

/**
 * GET /api/forecast/:symbol
 * Fetches LSTM or ARIMA predictions from the Python ML service
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const modelType = (req.query.model as string || 'LSTM').toUpperCase();
  const forecastDays = parseInt(req.query.days as string || '30', 10);

  logger.info(`Forecast request received for ${symbol} using ${modelType} (Days: ${forecastDays})`);

  try {
    const response = await fetch(PYTHON_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: symbol,
        model_type: modelType,
        forecast_days: forecastDays
      })
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      logger.error(`Python ML service returned error:`, errorData);
      return res.status(response.status).json({
        error: errorData.error || 'Failed to fetch predictions from ML service',
        details: errorData.details
      });
    }

    const predictionData = await response.json();
    return res.json(predictionData);

  } catch (error: any) {
    logger.error(`Error connecting to Python ML service:`, {
      message: error.message,
      url: PYTHON_SERVICE_URL
    });
    
    return res.status(503).json({
      error: 'Forecasting service is temporarily unavailable',
      details: 'Please ensure the Python prediction server (app.py) is running on port 5000.'
    });
  }
});

/**
 * GET /api/forecast/compare/:symbol
 * Fetches comparison forecast data using drift/volatility formula vs real Yahoo price
 */
router.get('/compare/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const { interval } = req.query;
  logger.info(`Comparison forecast request received for ${symbol}, interval: ${interval}`);

  try {
    const { forecastService } = require('../services/forecast.service');
    const data = await forecastService.getComparisonData(symbol, (interval as string) || '1m');
    return res.json(data);
  } catch (error: any) {
    logger.error(`Error generating forecast comparison data:`, error);
    return res.status(500).json({
      error: 'Failed to generate prediction comparison data',
      details: error.message || error
    });
  }
});

export default router;
