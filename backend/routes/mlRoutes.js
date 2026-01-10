// backend/routes/mlRoutes.js
import express from "express";
import {
  predictTelemetry,
  predictTelemetryById,
  predictTelemetriesBatch,
} from "../controllers/mlController.js";

const router = express.Router();

// --------------------
// Single telemetry prediction (send telemetry JSON)
// POST /api/ml/predict
router.post("/predict", predictTelemetry);

// --------------------
// Predict stored telemetry by ID
// GET /api/ml/predict/:id
router.get("/predict/:id", predictTelemetryById);

// --------------------
// Batch prediction for multiple telemetry records
// POST /api/ml/predict/batch
router.post("/predict/batch", predictTelemetriesBatch);

export default router;
