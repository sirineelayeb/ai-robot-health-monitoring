// routes/alertRoutes.js - UPDATED
import express from 'express';
import { authMiddleware, requireAdmin } from '../middlewares/authMiddleware.js';
import * as alertController from '../controllers/alertController.js';

const router = express.Router();

// All alert routes require authentication
// router.use(authMiddleware);

// Get recent alerts
router.get('/recent', alertController.getRecentAlerts);

// Get alert statistics
router.get('/stats', alertController.getAlertStats);

// Get alerts for specific robot
router.get('/robot/:robotId', alertController.getRobotAlerts);

// Clear old alerts (admin only)
router.delete('/clear-old', requireAdmin, alertController.clearOldAlerts);

export default router;