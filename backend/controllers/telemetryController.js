// telemetryController.js
import Telemetry from '../models/Telemetry.js';

/**
 * Get the latest telemetry for a robot
 */
export const getLatestTelemetry = async (req, res) => {
  try {
    const robotId = (req.query.robot_id || 'robot_001').trim();
    if (!robotId) return res.status(400).json({ message: 'robot_id is required' });

    const telemetry = await Telemetry.findOne({ robot_id: robotId }).sort({ timestamp: -1 });
    if (!telemetry) return res.status(404).json({ message: `No telemetry found for ${robotId}` });

    res.status(200).json(telemetry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get telemetry history for a robot
 */
export const getTelemetryHistory = async (req, res) => {
  try {
    const robotId = (req.query.robot_id || 'robot_001').trim();
    const limit = Math.min(Number(req.query.limit) || 100, 1000);

    const history = await Telemetry.find({ robot_id: robotId })
      .sort({ timestamp: 1 }) // oldest first for trend graphs
      .limit(limit);

    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all telemetry for a specific robot
 */
export const getTelemetryByRobot = async (req, res) => {
  try {
    const { robotId } = req.params;
    const data = await Telemetry.find({ robot_id: robotId }).sort({ timestamp: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all anomalies for a robot (with optional date filters)
 */
export const getAnomalies = async (req, res) => {
  try {
    const { robotId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { robot_id: robotId, is_anomaly: true };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const anomalies = await Telemetry.find(query).sort({ timestamp: -1 });
    res.status(200).json(anomalies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get telemetry statistics for a robot
 */
export const getStatistics = async (req, res) => {
  try {
    const { robotId } = req.params;

    const totalRecords = await Telemetry.countDocuments({ robot_id: robotId });
    const totalAnomalies = await Telemetry.countDocuments({ robot_id: robotId, is_anomaly: true });

    const anomalyPercentage = totalRecords > 0 ? (totalAnomalies / totalRecords) * 100 : 0;

    res.status(200).json({ totalRecords, totalAnomalies, anomalyPercentage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
