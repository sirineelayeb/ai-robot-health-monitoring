// controllers/alertController.js
import Telemetry from "../models/Telemetry.js";
import logger from "../utils/logger.js";

/**
 * GET /api/alerts/recent
 * Get recent alerts for all robots or specific robot
 */
export const getRecentAlerts = async (req, res) => {
  try {
    const { robot_id, limit = 50, hours = 24 } = req.query;
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const query = {
      timestamp: { $gte: cutoffTime },
      $or: [
        { status: { $in: ["WARNING", "CRITICAL"] } },
        { "ml_prediction.is_anomaly": true },
        { "detected_issues": { $exists: true, $ne: [] } }
      ]
    };
    
    if (robot_id) query.robot_id = robot_id;
    
    const alerts = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .select('robot_id timestamp status anomaly_type detected_issues ml_prediction');
    
    // Format alerts for response
    const formattedAlerts = alerts.map(alert => ({
      robot_id: alert.robot_id,
      timestamp: alert.timestamp,
      status: alert.status,
      anomaly_type: alert.anomaly_type,
      is_anomaly: alert.is_anomaly || false,
      issues: alert.detected_issues || [],
      ml_anomaly: alert.ml_prediction?.is_anomaly || false,
      ml_anomaly_type: alert.ml_prediction?.anomaly_type || null,
      ml_confidence: alert.ml_prediction?.confidence || null
    }));
    
    res.json({
      success: true,
      count: formattedAlerts.length,
      alerts: formattedAlerts,
      filters: {
        robot_id: robot_id || 'all',
        hours,
        limit: Number(limit)
      }
    });
  } catch (error) {
    logger.error("Error getting alerts:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
export const getAlerts = async (req, res) => {
  try {
    const {
      robotId = "robot_001",
      page = 1,
      limit = 50,
      status,
      anomaly_type,
      startDate,
      endDate
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query for anomalies only
    const query = { 
      robot_id: robotId,
      $or: [
        { status: { $in: ["WARNING", "CRITICAL"] } },
        { "ml_prediction.is_anomaly": true },
        { is_anomaly: true }
      ]
    };
    
    if (status) {
      query.status = status.toUpperCase();
    }
    
    if (anomaly_type && anomaly_type !== 'null' && anomaly_type !== 'undefined') {
      query.anomaly_type = anomaly_type;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    console.log('🔍 Alerts query:', JSON.stringify(query, null, 2));

    // Execute query
    const [alerts, total] = await Promise.all([
      Telemetry.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Telemetry.countDocuments(query)
    ]);

    console.log(`Found ${alerts.length} alerts (total: ${total})`);

    // Transform to alert format
    const transformedAlerts = alerts.map(telemetry => ({
      id: telemetry._id.toString(),
      robot_id: telemetry.robot_id,
      timestamp: telemetry.timestamp,
      status: telemetry.status,
      anomaly_type: telemetry.anomaly_type,
      is_anomaly: telemetry.is_anomaly,
      issues: telemetry.detected_issues?.map(issue => ({
        message: issue.message,
        severity: issue.severity
      })) || [],
      metrics: {
        battery_level: telemetry.battery_level,
        temperature: telemetry.temperature,
        cpu_load: telemetry.cpu_load,
        velocity: telemetry.velocity,
        motor_current: telemetry.motor_current
      },
      ml_prediction: telemetry.ml_prediction,
      source: telemetry.ml_prediction?.is_anomaly ? 'ai' : 'rule'
    }));

    res.status(200).json({
      success: true,
      alerts: transformedAlerts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts',
      error: error.message 
    });
  }
};
/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
export const getAlertStats = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await Telemetry.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoffTime },
          $or: [
            { status: { $in: ["WARNING", "CRITICAL"] } },
            { "ml_prediction.is_anomaly": true }
          ]
        }
      },
      {
        $group: {
          _id: "$robot_id",
          totalAlerts: { $sum: 1 },
          criticalAlerts: {
            $sum: { $cond: [{ $eq: ["$status", "CRITICAL"] }, 1, 0] }
          },
          warningAlerts: {
            $sum: { $cond: [{ $eq: ["$status", "WARNING"] }, 1, 0] }
          },
          mlAnomalies: {
            $sum: { $cond: [{ $eq: ["$ml_prediction.is_anomaly", true] }, 1, 0] }
          },
          lastAlert: { $max: "$timestamp" },
          mostCommonIssue: { $push: "$anomaly_type" }
        }
      },
      {
        $project: {
          robot_id: "$_id",
          totalAlerts: 1,
          criticalAlerts: 1,
          warningAlerts: 1,
          mlAnomalies: 1,
          lastAlert: 1,
          _id: 0
        }
      }
    ]);
    
    // Get overall totals
    const overallStats = await Telemetry.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoffTime }
        }
      },
      {
        $facet: {
          totalRecords: [{ $count: "count" }],
          alertsBySeverity: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          mlAnomalies: [
            {
              $match: { "ml_prediction.is_anomaly": true }
            },
            { $count: "count" }
          ]
        }
      }
    ]);
    
    res.json({
      success: true,
      period_hours: hours,
      robot_stats: stats,
      overall: {
        total_records: overallStats[0]?.totalRecords[0]?.count || 0,
        alerts_by_severity: overallStats[0]?.alertsBySeverity || [],
        ml_anomalies: overallStats[0]?.mlAnomalies[0]?.count || 0
      }
    });
  } catch (error) {
    logger.error("Error getting alert stats:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * GET /api/alerts/:robotId
 * Get alerts for specific robot
 */
export const getRobotAlerts = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    const query = { robot_id: robotId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Get alerts (either threshold-based or ML-based)
    const alerts = await Telemetry.find({
      ...query,
      $or: [
        { status: { $in: ["WARNING", "CRITICAL"] } },
        { "ml_prediction.is_anomaly": true }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();
    
    res.json({
      success: true,
      robot_id: robotId,
      count: alerts.length,
      alerts: alerts.map(alert => ({
        timestamp: alert.timestamp,
        status: alert.status,
        anomaly_type: alert.anomaly_type,
        is_anomaly: alert.is_anomaly,
        detected_issues: alert.detected_issues,
        ml_prediction: alert.ml_prediction,
        metrics: {
          battery_level: alert.battery_level,
          temperature: alert.temperature,
          cpu_load: alert.cpu_load,
          velocity: alert.velocity
        }
      }))
    });
  } catch (error) {
    logger.error("Error getting robot alerts:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * DELETE /api/alerts/clear-old
 * Clear old alerts (admin only)
 */
export const clearOldAlerts = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await Telemetry.deleteMany({
      timestamp: { $lt: cutoffDate },
      $or: [
        { status: { $in: ["WARNING", "CRITICAL"] } },
        { "ml_prediction.is_anomaly": true }
      ]
    });
    
    logger.info(`Cleared ${result.deletedCount} old alerts (older than ${daysToKeep} days)`);
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} old alerts`,
      days_kept: daysToKeep,
      deleted_count: result.deletedCount
    });
  } catch (error) {
    logger.error("Error clearing old alerts:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export default {
  getRecentAlerts,
  getAlertStats,
  getRobotAlerts,
  clearOldAlerts
};