// telemetryRoutes.js
import express from 'express';
import {
  getLatestTelemetry,
  getTelemetryHistory,
  getTelemetryByRobot,
  getAnomalies,
  getStatistics,
  getTelemetryCount,
  getSensorHealth,
  getTelemetryByTimeRange
} from '../controllers/telemetryController.js';

const router = express.Router();

// ============================================
// GENERAL ROUTES (query-based, no robotId param)
// ============================================

// Latest telemetry for a robot (query param: robot_id)
// GET /api/telemetry/latest?robot_id=robot_001
router.get('/latest', getLatestTelemetry);

// Telemetry history for a robot (query params: robot_id, limit, skip, onlyAnomalies, status, startTime, endTime)
// GET /api/telemetry/history?robot_id=robot_001&limit=50&onlyAnomalies=true
router.get('/history', getTelemetryHistory);

// Get telemetry by time range (query params: startTime, endTime, robot_id, limit, skip)
// GET /api/telemetry/range?startTime=2024-01-01&endTime=2024-01-02&robot_id=robot_001
router.get('/range', getTelemetryByTimeRange);

// ============================================
// ROBOT-SPECIFIC ROUTES (URL param: robotId)
// ============================================
// IMPORTANT: These must come AFTER the named routes above to avoid conflicts

// All telemetry for a specific robot (params: robotId, query: limit, skip)
// GET /api/telemetry/robot_001?limit=100&skip=0
router.get('/:robotId', getTelemetryByRobot);

// Anomalies for a robot (params: robotId, query: startDate, endDate, limit, skip)
// GET /api/telemetry/robot_001/anomalies?startDate=2024-01-01&limit=20
router.get('/:robotId/anomalies', getAnomalies);

// Statistics for a robot (params: robotId, query: hours)
// GET /api/telemetry/robot_001/stats?hours=48
router.get('/:robotId/stats', getStatistics);

// Total count of telemetry records for a robot (params: robotId, query: startTime, endTime, onlyAnomalies)
// GET /api/telemetry/robot_001/count?onlyAnomalies=true
router.get('/:robotId/count', getTelemetryCount);

// Sensor health summary for a robot (params: robotId)
// GET /api/telemetry/robot_001/sensor-health
router.get('/:robotId/sensor-health', getSensorHealth);

export default router;