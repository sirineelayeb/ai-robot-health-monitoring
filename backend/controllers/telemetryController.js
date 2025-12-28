// telemetryController.js
import telemetryService from '../services/TelemetryService.js';
import logger from '../utils/logger.js';

/**
 * Get the latest telemetry for a robot
 */
export const getLatestTelemetry = async (req, res) => {
  try {
    const robotId = (req.query.robot_id || req.params.robotId || 'robot_001').trim();
    
    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robot_id is required' 
      });
    }

    const telemetry = await telemetryService.getLatestTelemetry(robotId);
    
    if (!telemetry) {
      return res.status(404).json({ 
        success: false,
        message: `No telemetry found for ${robotId}` 
      });
    }

    res.status(200).json({
      success: true,
      data: telemetry
    });
  } catch (error) {
    logger.error('Error in getLatestTelemetry controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get telemetry history for a robot with filters
 */
export const getTelemetryHistory = async (req, res) => {
  try {
    const robotId = (req.query.robot_id || req.params.robotId || 'robot_001').trim();
    const {
      startTime,
      endTime,
      limit = 100,
      skip = 0,
      onlyAnomalies,
      status
    } = req.query;

    const options = {
      startTime,
      endTime,
      limit: Number(limit),
      skip: Number(skip),
      onlyAnomalies: onlyAnomalies === 'true',
      status
    };

    const result = await telemetryService.getTelemetryHistory(robotId, options);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in getTelemetryHistory controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get all telemetry for a specific robot
 */
export const getTelemetryByRobot = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robotId is required' 
      });
    }

    const options = {
      limit: Number(limit),
      skip: Number(skip)
    };

    const result = await telemetryService.getTelemetryHistory(robotId, options);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in getTelemetryByRobot controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get all anomalies for a robot (with date filters)
 */
export const getAnomalies = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { 
      startDate, 
      endDate,
      limit = 50,
      skip = 0
    } = req.query;

    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robotId is required' 
      });
    }

    const options = {
      startTime: startDate,
      endTime: endDate,
      limit: Number(limit),
      skip: Number(skip)
    };

    const result = await telemetryService.getAnomalies(robotId, options);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in getAnomalies controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get telemetry statistics for a robot
 */
export const getStatistics = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { hours = 24 } = req.query;

    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robotId is required' 
      });
    }

    // Get comprehensive stats from service
    const stats = await telemetryService.getTelemetryStats(robotId, Number(hours));

    // Get last anomaly separately
    const anomalies = await telemetryService.getAnomalies(robotId, { limit: 1 });
    const lastAnomalyTime = anomalies.data.length > 0 ? anomalies.data[0].timestamp : null;

    // Calculate anomaly percentage
    const anomalyPercentage = stats.totalRecords > 0 
      ? ((stats.totalAnomalies / stats.totalRecords) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        robot_id: robotId,
        period_hours: Number(hours),
        lastAnomalyTime,
        totalAnomalies: stats.totalAnomalies,
        anomalyPercentage: Number(anomalyPercentage),
        totalRecords: stats.totalRecords,
        criticalCount: stats.criticalCount,
        warningCount: stats.warningCount,
        normalCount: stats.totalRecords - stats.criticalCount - stats.warningCount,
        averages: {
          battery: stats.avgBattery?.toFixed(2) || 0,
          temperature: stats.avgTemperature?.toFixed(2) || 0,
          cpuLoad: stats.avgCpuLoad?.toFixed(2) || 0,
          motorCurrent: stats.avgMotorCurrent?.toFixed(2) || 0
        },
        peaks: {
          minBattery: stats.minBattery || 0,
          maxBattery: stats.maxBattery || 0,
          maxTemperature: stats.maxTemperature || 0,
          maxCpuLoad: stats.maxCpuLoad || 0,
          maxMotorCurrent: stats.maxMotorCurrent || 0
        }
      }
    });
  } catch (error) {
    logger.error('Error in getStatistics controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get total count of telemetry records for a robot
 */
export const getTelemetryCount = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { startTime, endTime, onlyAnomalies } = req.query;
    
    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robotId is required' 
      });
    }

    const options = {
      startTime,
      endTime,
      onlyAnomalies: onlyAnomalies === 'true'
    };

    const count = await telemetryService.getTelemetryCount(robotId, options);
    
    res.status(200).json({ 
      success: true,
      data: {
        robot_id: robotId,
        total: count,
        filters: options
      }
    });
  } catch (error) {
    logger.error('Error in getTelemetryCount controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get sensor health summary for a robot
 */
export const getSensorHealth = async (req, res) => {
  try {
    const { robotId } = req.params;

    if (!robotId) {
      return res.status(400).json({ 
        success: false,
        message: 'robotId is required' 
      });
    }

    const health = await telemetryService.getSensorHealthSummary(robotId);

    if (!health) {
      return res.status(404).json({ 
        success: false,
        message: `No telemetry data found for ${robotId}` 
      });
    }

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error in getSensorHealth controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get telemetry by time range (for charts/analytics)
 */
export const getTelemetryByTimeRange = async (req, res) => {
  try {
    const { startTime, endTime, robot_id, limit = 1000, skip = 0 } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ 
        success: false,
        message: 'startTime and endTime are required' 
      });
    }

    const options = {
      robot_id,
      limit: Number(limit),
      skip: Number(skip)
    };

    const data = await telemetryService.getTelemetryByTimeRange(startTime, endTime, options);

    res.status(200).json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    logger.error('Error in getTelemetryByTimeRange controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export default {
  getLatestTelemetry,
  getTelemetryHistory,
  getTelemetryByRobot,
  getAnomalies,
  getStatistics,
  getTelemetryCount,
  getSensorHealth,
  getTelemetryByTimeRange
};