import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';

const router = Router();

// Test endpoints
router.post('/test-email', (req, res) => notificationsController.testEmail(req, res));
router.post('/test-whatsapp', (req, res) => notificationsController.testWhatsApp(req, res));
router.post('/send-alert', (req, res) => notificationsController.sendAlert(req, res));
router.post('/send-batch-alerts', (req, res) => notificationsController.sendBatchAlerts(req, res));

// Status & Configuration
router.get('/status', (req, res) => notificationsController.getStatus(req, res));
router.get('/vapid-key', (req, res) => notificationsController.getVapidKey(req, res));

export default router;
