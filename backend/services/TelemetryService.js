import Telemetry from "../models/Telemetry.js";
import logger from "../utils/logger.js";
import { predictAnomaly } from "./mlService.js"; // <-- ML integration

const processTelemetry = async (data) => {
  try {
    const {
      robot_id,
      battery,
      motor_temp,
      motor_current,
      cpu_load,
      velocity,
      battery_drop_rate
    } = data;

    // Call ML model
    const mlResult = await predictAnomaly({
      battery,
      motor_temp,
      motor_current,
      cpu_load,
      velocity,
      battery_drop_rate,
      timestamp: data.timestamp
    });

    // Determine status based on ML + simulator thresholds
    const status = mlResult.is_anomaly ? "WARNING" : getStatusFromSimulator(data);

    const telemetry = await Telemetry.create({
      robot_id,
      timestamp: new Date(data.timestamp || Date.now()),
      battery,
      motor_temp,
      motor_current,
      cpu_load,
      velocity,
      battery_drop_rate: battery_drop_rate || 0,
      is_anomaly: mlResult.is_anomaly,
      anomaly_score: mlResult.anomaly_score,
      status
    });

    logger.debug("Telemetry saved", {
      robot_id,
      status: telemetry.status,
      is_anomaly: telemetry.is_anomaly
    });

    return telemetry;
  } catch (error) {
    logger.error("Error processing telemetry:", error.message);
    throw error;
  }
};

// Simple fallback simulator thresholds
const getStatusFromSimulator = (data) => {
  if (data.motor_temp > 90 || data.battery < 10 || data.cpu_load > 95 || data.velocity > 4.5) {
    return "CRITICAL";
  }
  return "NORMAL";
};

export default processTelemetry;
