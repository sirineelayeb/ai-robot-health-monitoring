import express from "express";
import { predictTelemetry } from "../controllers/mlController.js";

const router = express.Router();

// POST /api/ml/predict
router.post("/predict", predictTelemetry);

export default router;
