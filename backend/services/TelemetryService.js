import Telemetry from "../models/Telemetry.js";
import logger from "../utils/logger.js";
// import { predictAnomaly } from "./mlService.js"; // ML integration - commented for now
import THRESHOLDS, { calculateStatus, isAnomalousReading } from "../config/thresholds.js";

/**
 * Process and save telemetry data with anomaly detection
 */
export const processTelemetry = async (data) => {
  try {
    const {
      robot_id,
      battery_level,
      motor_current,
      cpu_load,
      temperature,
      velocity,
      encoder_ok = true,
      lidar_ok = true,
      camera_ok = true,
      pc_cpu_load,
      pc_memory_load,
      pc_disk_usage,
      pc_network_sent,
      pc_network_recv,
      pc_temperature,
      timestamp,
    } = data;

    if (!robot_id) {
      throw new Error("robot_id is required");
    }

    const telemetryData = {
      battery_level,
      motor_current,
      cpu_load,
      temperature,
      velocity,
      encoder_ok,
      lidar_ok,
      camera_ok
    };

    // Calculate status based on thresholds
    const status = calculateStatus(telemetryData);

    // Only consider CRITICAL status as an anomaly
    const is_anomaly = status === THRESHOLDS.STATUS_LEVELS.CRITICAL;

    // Save telemetry to database
    const telemetry = await Telemetry.create({
      robot_id,
      timestamp: new Date(timestamp || Date.now()),
      battery_level,
      motor_current,
      cpu_load,
      temperature, // stores PC temperature
      velocity,
      encoder_ok,
      lidar_ok,
      camera_ok,
      pc_cpu_load,
      pc_memory_load,
      pc_disk_usage,
      pc_network_sent,
      pc_network_recv,
      pc_temperature,
      is_anomaly,
      status,
    });

    // Log based on status
    if (is_anomaly) {
      logger.warn(`⚠️ ANOMALY: ${status} | Bat:${battery_level}% Temp:${temperature}°C CPU:${cpu_load}% Motor:${motor_current}A | E:${encoder_ok} L:${lidar_ok} C:${camera_ok}`);
    } else {
      logger.debug(`✅ ${status}: Bat:${battery_level}% Temp:${temperature}°C CPU:${cpu_load}% Motor:${motor_current}A | E:${encoder_ok} L:${lidar_ok} C:${camera_ok}`);
    }

    return {
      telemetry,
      detection_method: is_anomaly ? "Rule-based" : "Normal"
    };

  } catch (error) {
    logger.error("Error processing telemetry:", error.message);
    throw error;
  }
};


/**
 * Get latest telemetry for a specific robot
 */
export const getLatestTelemetry = async (robot_id) => {
  try {
    const telemetry = await Telemetry.findOne({ robot_id })
      .sort({ timestamp: -1 })
      .lean();

    if (!telemetry) {
      logger.debug(`No telemetry found for robot: ${robot_id}`);
      return null;
    }

    logger.debug(`Latest telemetry retrieved for ${robot_id}`);
    return telemetry;
  } catch (error) {
    logger.error("Error getting latest telemetry:", error.message);
    throw error;
  }
};

/**
 * Get telemetry history for a robot with optional filters
 */
export const getTelemetryHistory = async (robot_id, options = {}) => {
  try {
    const {
      startTime,
      endTime,
      limit = 100,
      skip = 0,
      onlyAnomalies = false,
      status
    } = options;

    // Build query
    const query = { robot_id };

    // Add time range filter
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    // Filter by anomalies
    if (onlyAnomalies) {
      query.is_anomaly = true;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const telemetry = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Telemetry.countDocuments(query);

    logger.debug(`Retrieved ${telemetry.length} telemetry records for ${robot_id}`);

    return {
      data: telemetry,
      total,
      limit,
      skip,
      hasMore: total > skip + limit
    };
  } catch (error) {
    logger.error("Error getting telemetry history:", error.message);
    throw error;
  }
};

/**
 * Get telemetry by time range (for multiple robots or ML training data)
 */
export const getTelemetryByTimeRange = async (startTime, endTime, options = {}) => {
  try {
    const { robot_id, limit = 1000, skip = 0 } = options;

    const query = {
      timestamp: {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      }
    };

    if (robot_id) {
      query.robot_id = robot_id;
    }

    const telemetry = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    logger.debug(`Retrieved ${telemetry.length} telemetry records for time range`);
    return telemetry;
  } catch (error) {
    logger.error("Error getting telemetry by time range:", error.message);
    throw error;
  }
};

/**
 * Get telemetry count for a robot
 */
export const getTelemetryCount = async (robot_id, options = {}) => {
  try {
    const { startTime, endTime, onlyAnomalies = false } = options;

    const query = { robot_id };

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    if (onlyAnomalies) {
      query.is_anomaly = true;
    }

    const count = await Telemetry.countDocuments(query);
    logger.debug(`Telemetry count for ${robot_id}: ${count}`);
    return count;
  } catch (error) {
    logger.error("Error getting telemetry count:", error.message);
    throw error;
  }
};

/**
 * Get anomalies for a robot
 */
export const getAnomalies = async (robot_id, options = {}) => {
  try {
    const { limit = 50, skip = 0, startTime, endTime } = options;

    const query = {
      robot_id,
      is_anomaly: true
    };

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const anomalies = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Telemetry.countDocuments(query);

    logger.debug(`Retrieved ${anomalies.length} anomalies for ${robot_id}`);

    return {
      data: anomalies,
      total,
      limit,
      skip
    };
  } catch (error) {
    logger.error("Error getting anomalies:", error.message);
    throw error;
  }
};

/**
 * Get telemetry statistics for a robot
 */
export const getTelemetryStats = async (robot_id, hours = 24) => {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await Telemetry.aggregate([
      {
        $match: {
          robot_id,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          avgBattery: { $avg: "$battery_level" },
          minBattery: { $min: "$battery_level" },
          maxBattery: { $max: "$battery_level" },
          avgTemperature: { $avg: "$temperature" },
          maxTemperature: { $max: "$temperature" },
          avgVelocity: { $avg: "$velocity" },
          maxVelocity: { $max: "$velocity" },
          avgCpuLoad: { $avg: "$cpu_load" },
          maxCpuLoad: { $max: "$cpu_load" },
          avgMotorCurrent: { $avg: "$motor_current" },
          maxMotorCurrent: { $max: "$motor_current" },
          totalAnomalies: {
            $sum: { $cond: ["$is_anomaly", 1, 0] }
          },
          totalRecords: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ["$status", "CRITICAL"] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ["$status", "WARNING"] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      avgBattery: 0,
      minBattery: 0,
      maxBattery: 0,
      avgTemperature: 0,
      maxTemperature: 0,
      avgVelocity: 0,
      maxVelocity: 0,
      avgCpuLoad: 0,
      maxCpuLoad: 0,
      avgMotorCurrent: 0,
      maxMotorCurrent: 0,
      totalAnomalies: 0,
      totalRecords: 0,
      criticalCount: 0,
      warningCount: 0
    };

    logger.debug(`Statistics calculated for ${robot_id} (last ${hours}h)`);
    return result;
  } catch (error) {
    logger.error("Error calculating telemetry stats:", error.message);
    throw error;
  }
};

/**
 * Delete old telemetry data (data retention)
 */
export const cleanupOldTelemetry = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await Telemetry.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Deleted ${result.deletedCount} old telemetry records (older than ${daysToKeep} days)`);
    return result.deletedCount;
  } catch (error) {
    logger.error("Error cleaning up old telemetry:", error.message);
    throw error;
  }
};

/**
 * Get sensor health summary
 */
export const getSensorHealthSummary = async (robot_id) => {
  try {
    const latest = await getLatestTelemetry(robot_id);
    
    if (!latest) {
      return null;
    }

    const recentIssues = await Telemetry.countDocuments({
      robot_id,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      $or: [
        { encoder_ok: false },
        { lidar_ok: false },
        { camera_ok: false }
      ]
    });

    return {
      robot_id,
      encoder_ok: latest.encoder_ok,
      lidar_ok: latest.lidar_ok,
      camera_ok: latest.camera_ok,
      all_sensors_healthy: latest.encoder_ok && latest.lidar_ok && latest.camera_ok,
      recent_issues_count: recentIssues,
      last_checked: latest.timestamp
    };
  } catch (error) {
    logger.error("Error getting sensor health summary:", error.message);
    throw error;
  }
};

// ========== ML TRAINING DATA EXPORT - COMMENTED FOR NOW ==========
/**
 * Export telemetry data for ML training
 * This will be used later when training the ML model
 */
// export const exportTelemetryForTraining = async (robot_id, options = {}) => {
//   try {
//     const {
//       startTime,
//       endTime,
//       includeAnomaliesOnly = false
//     } = options;

//     const query = { robot_id };

//     if (startTime || endTime) {
//       query.timestamp = {};
//       if (startTime) query.timestamp.$gte = new Date(startTime);
//       if (endTime) query.timestamp.$lte = new Date(endTime);
//     }

//     if (includeAnomaliesOnly) {
//       query.is_anomaly = true;
//     }

//     const data = await Telemetry.find(query)
//       .select('battery_level motor_current cpu_load temperature encoder_ok lidar_ok camera_ok is_anomaly status timestamp')
//       .sort({ timestamp: 1 })
//       .lean();

//     logger.info(`Exported ${data.length} records for ML training`);
//     return data;
//   } catch (error) {
//     logger.error("Error exporting telemetry for training:", error.message);
//     throw error;
//   }
// };
// ================================================================

export default {
  processTelemetry,
  getLatestTelemetry,
  getTelemetryHistory,
  getTelemetryByTimeRange,
  getTelemetryCount,
  getAnomalies,
  getTelemetryStats,
  cleanupOldTelemetry,
  getSensorHealthSummary
  // exportTelemetryForTraining // ML - commented for later
};