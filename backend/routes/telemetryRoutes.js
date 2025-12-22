// telemetryRoutes.js
import express from 'express';
import {
  getLatestTelemetry,
  getTelemetryHistory,
  getTelemetryByRobot,
  getAnomalies,
  getStatistics
} from '../controllers/telemetryController.js';

const router = express.Router();

// Latest telemetry for a robot (query param: robot_id)
router.get('/latest', getLatestTelemetry);

// Telemetry history for a robot (query param: robot_id, optional: limit)
router.get('/history', getTelemetryHistory);

// All telemetry for a specific robot (param: robotId)
router.get('/:robotId', getTelemetryByRobot);

// Anomalies for a robot (param: robotId, optional query: startDate, endDate)
router.get('/:robotId/anomalies', getAnomalies);

// Statistics for a robot (param: robotId)
router.get('/:robotId/stats', getStatistics);

export default router;
