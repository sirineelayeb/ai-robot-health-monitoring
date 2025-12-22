import { predictAnomaly } from "../services/mlService.js";

export const predictTelemetry = async (req, res) => {
  try {
    const telemetryData = req.body;

    if (!telemetryData) return res.status(400).json({ message: "Telemetry data is required" });

    const prediction = await predictAnomaly(telemetryData);

    res.status(200).json(prediction);
  } catch (error) {
    console.error("ML Prediction Error:", error);
    res.status(500).json({ message: error.message });
  }
};
