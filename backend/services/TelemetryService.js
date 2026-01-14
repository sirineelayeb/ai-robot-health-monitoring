import Telemetry from "../models/telemetry.js";
import logger from "../utils/logger.js";
import { predictAnomaly } from "./mlService.js";
import { detectIssues, calculateStatus, DEFAULT_THRESHOLDS } from '../config/thresholds.js';
import thresholdService from '../services/thresholdService.js';
/**
 * Process telemetry from robot
 * @param {Object} data - Telemetry payload
 * @returns {Object} - Processed telemetry with ML prediction
 */
// services/telemetryService.js - CORRECTED VERSION
export const processTelemetry = async (data, io) => {
  try {
    if (!data || !data.robot_id) {
      logger.error("Invalid telemetry payload: missing robot_id");
      throw new Error("Invalid telemetry payload");
    }

    const robot_id = data.robot_id;
    
    // -------------------- RAW TELEMETRY ONLY --------------------
    const {
      timestamp,
      battery_level,
      battery_health,
      battery_drop_rate,
      battery_trend,
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
    } = data;

    // -------------------- DETECT ALL ISSUES USING THRESHOLDS --------------------
    const issues = await detectIssues({
      robot_id,
      timestamp,
      battery_level,
      battery_health,
      motor_current,
      cpu_load,
      temperature,
      velocity,
      encoder_ok,
      lidar_ok,
      camera_ok,
      pc_cpu_load,
      pc_disk_usage,
      pc_temperature,
      pc_network_sent,
      pc_network_recv
    }, robot_id);

    // -------------------- CALCULATE OVERALL STATUS --------------------
    let status = await calculateStatus({
      battery_level,
      temperature,
      motor_current,
      velocity,
      cpu_load,
      encoder_ok,
      lidar_ok,
      camera_ok,
      pc_cpu_load,
      pc_disk_usage,
      pc_temperature,
      pc_network_sent,
      pc_network_recv
    }, robot_id);

    // -------------------- ML PREDICTION --------------------
    let mlPrediction = null;

    try {
      const telemetryForML = {
        battery_level,
        battery_health,
        battery_drop_rate,
        battery_trend,
        temperature,
        motor_current,
        cpu_load,
        velocity,
      };

      const rawMLPrediction = await predictAnomaly(telemetryForML);
      
      if (rawMLPrediction?.success) {
        mlPrediction = {
          is_anomaly: rawMLPrediction.is_anomaly || false,
          anomaly_type: rawMLPrediction.anomaly_type,
          confidence: rawMLPrediction.confidence || 0,
          model_version: rawMLPrediction.model_version || "v1.0",
          predicted_at: new Date(),
        };
        
        // UPGRADE STATUS IF ML DETECTS ANOMALY
        if (mlPrediction.is_anomaly && mlPrediction.confidence >= 0.6) {
          if (mlPrediction.confidence >= 0.85) {
            status = "CRITICAL";
          } else if (status === "NORMAL") {
            status = "WARNING";
          }
        }
      }
    } catch (err) {
      logger.error("ML prediction failed:", err.message);
    }

    // ================  DETERMINE is_anomaly AND anomaly_type ================
    let is_anomaly = false;
    let anomaly_type = null;
    
    // Helper function to map ISSUE_TYPES to Telemetry enum
    const mapIssueTypeToAnomalyType = (issueType) => {
      const mapping = {
        "SENSOR_FAILURE": "SENSOR_FAILURE",
        "OVERHEATING": "OVERHEATING",
        "LOW_BATTERY": "LOW_BATTERY",
        "BATTERY_DEGRADATION": "BATTERY_DEGRADATION",
        "HIGH_CURRENT": "HIGH_CURRENT",
        "CPU_OVERLOAD": "CPU_OVERLOAD",
        "PC_CPU_OVERLOAD": "PC_CPU_OVERLOAD",
        "PC_DISK_FULL": "PC_DISK_FULL",
        "PC_OVERHEATING": "PC_OVERHEATING",
        "ABNORMAL_VELOCITY": "ABNORMAL_VELOCITY",
        "STALL_DETECTED": "STALL_DETECTED",
        "NETWORK_ISSUE": "SYSTEM_ANOMALY" 
      };
      return mapping[issueType] || "SYSTEM_ANOMALY";
    };

    // Priority 1: ML detection (if ML found anomaly)
    if (mlPrediction?.is_anomaly && mlPrediction.anomaly_type !== "Normal") {
      is_anomaly = true;
      anomaly_type = mlPrediction.anomaly_type; // ML types: MOTOR_OVERHEATING, BATTERY_DEGRADATION, ABNORMAL_VELOCITY
    }
    // Priority 2: Rule-based detection (if no ML anomaly OR ML => "Normal")
    else if (issues.length > 0) {
      is_anomaly = true;
      
      // Determine most severe issue
      const criticalIssues = issues.filter(i => i.severity === "CRITICAL");
      const warningIssues = issues.filter(i => i.severity === "WARNING");
      
      const selectedIssue = criticalIssues[0] || warningIssues[0] || issues[0];
      anomaly_type = mapIssueTypeToAnomalyType(selectedIssue.type);
      
      // Ensure status reflects rule-based issues
      if (status === "NORMAL" && issues.length > 0) {
        status = issues.some(iss => iss.severity === "CRITICAL") ? "CRITICAL" : "WARNING";
      }
    }
    // ==============================================================================

    // -------------------- SAVE TELEMETRY WITH DETECTED ISSUES --------------------
    try {
      const savedTelemetry = await Telemetry.create({
        robot_id,
        timestamp: new Date(timestamp || Date.now()),

        // Raw telemetry
        battery_level,
        battery_health,
        battery_drop_rate,
        battery_trend,
        motor_current,
        cpu_load,
        temperature,
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

        // Status and anomaly tracking - NOW SET CORRECTLY!
        status,
        is_anomaly,          
        anomaly_type,         

        // Store all detected issues
        detected_issues: issues,

        // ML prediction (only if available)
        ...(mlPrediction && { ml_prediction: mlPrediction }),
      });

      // -------------------- EMIT ALERT IF ANOMALIES DETECTED --------------------
      if (is_anomaly) {
        const alertData = {
          robot_id,
          timestamp: savedTelemetry.timestamp,
          status,
          is_anomaly: true,
          anomaly_type,
          issues,
          ml_anomaly: mlPrediction?.is_anomaly || false,
          ml_prediction: mlPrediction,
          telemetry_id: savedTelemetry._id,
          metrics: {
            battery_level,
            temperature,
            motor_current,
            cpu_load,
            velocity,
            pc_cpu_load,
            pc_disk_usage,
            pc_temperature,
            pc_network_sent,
            pc_network_recv
          }
        };
        
        const room = `robot_${robot_id}`;
        io.to(room).emit("threshold_alert", alertData);
        io.emit("threshold_alert", alertData);
        
        logger.warn(
          `${robot_id} ALERT: ${issues.length} rule issues | ` +
          `ML Anomaly: ${mlPrediction?.is_anomaly ? 'YES' : 'NO'} | ` +
          `Type: ${anomaly_type || 'None'} | Status: ${status}`
        );
      }

      const mlTriggered = mlPrediction?.is_anomaly && mlPrediction.confidence >= 0.6;
      const rulesTriggered = issues.length > 0;
      
      logger.info(
        `${robot_id} | ${status} | ` +
        `Anomaly:${is_anomaly ? 'YES' : 'NO'} | ` +
        `Type:${anomaly_type || 'None'} | ` +
        `Issues:${issues.length} | ` +
        `ML:${mlPrediction?.is_anomaly ? 'YES' : 'NO'} | ` +
        `Bat:${battery_level?.toFixed(1)}% | ` +
        `Temp:${temperature?.toFixed(1)}°C`
      );

      logger.debug(
        `[DETAILS] ${robot_id} | ML prediction: ${JSON.stringify(mlPrediction)} | ` +
        `Rules triggered: ${rulesTriggered} | ML triggered: ${mlTriggered}`
      );
      // ==============================================================

      // -------------------- SOCKET.IO BROADCAST --------------------
      const socketData = {
        _id: savedTelemetry._id,
        robot_id,
        timestamp: savedTelemetry.timestamp,
        
        // Robot sensors
        battery_level,
        battery_health,
        battery_drop_rate,
        battery_trend,
        temperature,
        motor_current,
        cpu_load,
        velocity,
        
        // Sensor health
        encoder_ok,
        lidar_ok,
        camera_ok,
        
        // PC metrics
        pc_cpu_load,
        pc_memory_load,
        pc_disk_usage,
        pc_network_sent,
        pc_network_recv,
        pc_temperature,
        
        // Anomaly detection results 
        status,
        is_anomaly,
        anomaly_type,
        detected_issues: issues,
        ml_prediction: mlPrediction,
      };

      // Emit to all clients and specific room
      const robotRoom = `robot_${robot_id}`;
      io.emit("telemetry", socketData);
      io.to(robotRoom).emit("telemetry", socketData);
      io.to(robotRoom).emit("robot_update", socketData);

      // Emit separate ML alert if ML detected anomaly
      if (mlPrediction?.is_anomaly) {
        io.to(robotRoom).emit("ml_anomaly_alert", {
          robot_id,
          anomaly_type: mlPrediction.anomaly_type,
          confidence: mlPrediction.confidence,
          timestamp: savedTelemetry.timestamp
        });
      }

      return savedTelemetry;
      
    } catch (saveError) {
      logger.error("Failed to save telemetry:", saveError.message);
      throw saveError;
    }

  } catch (error) {
    logger.error("Error processing telemetry:", error.message);
    throw error;
  }
};
async function loadThresholds(robotId) {
  try {
    return await thresholdService.getThresholds(robotId);
  } catch (error) {
    console.error('Failed to load thresholds, using defaults:', error.message);
    return DEFAULT_THRESHOLDS;
  }
}


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

    const query = { robot_id };

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    if (onlyAnomalies) {
      query["ml_prediction.is_anomaly"] = true;
    }

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
 * Get telemetry by time range
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
      query["ml_prediction.is_anomaly"] = true;
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
 * Get anomalies for a robot (ML-detected only)
 */
export const getAnomalies = async (robot_id, options = {}) => {
  try {
    const { limit = 50, skip = 0, startTime, endTime } = options;

    const query = {
      robot_id,
      "ml_prediction.is_anomaly": true
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

    logger.debug(`Retrieved ${anomalies.length} ML anomalies for ${robot_id}`);

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
            $sum: { $cond: ["$ml_prediction.is_anomaly", 1, 0] }
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
 * Delete old telemetry data
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
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
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
};