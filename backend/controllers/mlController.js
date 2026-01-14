// backend/controllers/mlController.js
import Telemetry from "../models/telemetry.js";
import { predictAnomaly } from "../services/mlService.js";

/**
 * POST /api/ml/predict
 * Predict anomaly for a telemetry JSON sent in request body
 */
export const predictTelemetry = async (req, res) => {
  try {
    const telemetryData = req.body;

    if (!telemetryData || Object.keys(telemetryData).length === 0) {
      return res.status(400).json({ success: false, message: "Telemetry data is required" });
    }

    // Required fields validation
    const requiredFields = [
      "battery_level",
      "battery_health",
      "battery_drop_rate",
      "battery_trend",
      "temperature",
      "motor_current",
      "cpu_load",
      "velocity",
    ];

    const missingFields = requiredFields.filter((f) => !(f in telemetryData));

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Call ML service
    const prediction = await predictAnomaly(telemetryData);

    res.status(200).json(prediction);
  } catch (error) {
    console.error("ML Prediction Error:", error.message);
    res.status(500).json({ success: false, message: "Prediction failed", error: error.message });
  }
};

/**
 * GET /api/ml/predict/:id
 * Predict anomaly for a stored telemetry by ID
 */
export const predictTelemetryById = async (req, res) => {
  try {
    const { id } = req.params;
    const telemetryData = await Telemetry.findById(id);

    if (!telemetryData) {
      return res.status(404).json({ success: false, message: "Telemetry not found" });
    }

    const prediction = await predictAnomaly(telemetryData.toObject());

    res.status(200).json(prediction);
  } catch (error) {
    console.error("ML Prediction Error:", error.message);
    res.status(500).json({ success: false, message: "Prediction failed", error: error.message });
  }
};

/**
 * POST /api/ml/predict/batch
 * Predict anomalies for multiple telemetry records at once
 * Request body: Array of telemetry JSON objects
 */
export const predictTelemetriesBatch = async (req, res) => {
  try {
    const telemetryList = req.body;

    if (!Array.isArray(telemetryList) || telemetryList.length === 0) {
      return res.status(400).json({ success: false, message: "Telemetry array is required" });
    }

    const predictions = await Promise.all(
      telemetryList.map(async (t) => {
        try {
          return await predictAnomaly(t);
        } catch (err) {
          console.error("Prediction error for one telemetry:", err.message);
          return { success: false };
        }
      })
    );

    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    console.error("Batch ML Prediction Error:", error.message);
    res.status(500).json({ success: false, message: "Batch prediction failed", error: error.message });
  }
};
