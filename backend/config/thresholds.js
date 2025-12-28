// ==================== SENSOR THRESHOLDS ====================
export const THRESHOLDS = {
  TEMPERATURE: {
    WARNING: 65,      // Motor overheating warning
    CRITICAL: 80      // Motor overheating critical
  },
  BATTERY_LEVEL: {
    WARNING: 30,      // Low battery warning
    CRITICAL: 15      // Low battery critical
  },
  CPU_LOAD: {
    WARNING: 75,
    CRITICAL: 90
  },
  MOTOR_CURRENT: {
    WARNING: 7.5,     // High motor current warning
    CRITICAL: 10.0    // High motor current critical
  },
  VELOCITY: {
    WARNING: 2.5,     // Abnormal velocity warning
    CRITICAL: 4.0     // Abnormal velocity critical
  },
  SENSOR_HEALTH: {
    ENCODER_OK: true,
    LIDAR_OK: true,
    CAMERA_OK: true
  },
  STATUS_LEVELS: {
    NORMAL: 'NORMAL',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL'
  }
};

// ==================== STATUS CALCULATION ====================
export const calculateStatus = (telemetry) => {
  const issues = [];

  if (telemetry.temperature >= THRESHOLDS.TEMPERATURE.CRITICAL) return THRESHOLDS.STATUS_LEVELS.CRITICAL;
  if (telemetry.temperature >= THRESHOLDS.TEMPERATURE.WARNING) issues.push('temperature');

  if (telemetry.battery_level <= THRESHOLDS.BATTERY_LEVEL.CRITICAL) return THRESHOLDS.STATUS_LEVELS.CRITICAL;
  if (telemetry.battery_level <= THRESHOLDS.BATTERY_LEVEL.WARNING) issues.push('battery');

  if (telemetry.cpu_load >= THRESHOLDS.CPU_LOAD.CRITICAL) return THRESHOLDS.STATUS_LEVELS.CRITICAL;
  if (telemetry.cpu_load >= THRESHOLDS.CPU_LOAD.WARNING) issues.push('cpu');

  if (telemetry.motor_current >= THRESHOLDS.MOTOR_CURRENT.CRITICAL) return THRESHOLDS.STATUS_LEVELS.CRITICAL;
  if (telemetry.motor_current >= THRESHOLDS.MOTOR_CURRENT.WARNING) issues.push('motor');

  if (telemetry.velocity >= THRESHOLDS.VELOCITY.CRITICAL) return THRESHOLDS.STATUS_LEVELS.CRITICAL;
  if (telemetry.velocity >= THRESHOLDS.VELOCITY.WARNING) issues.push('velocity');

  if (!telemetry.encoder_ok || !telemetry.lidar_ok || !telemetry.camera_ok) issues.push('sensor');

  if (issues.length === 0) return THRESHOLDS.STATUS_LEVELS.NORMAL;
  if (issues.length === 1) return THRESHOLDS.STATUS_LEVELS.WARNING;
  return THRESHOLDS.STATUS_LEVELS.CRITICAL;
};




// ==================== ANOMALY DETECTION ====================
export const isAnomalousReading = (telemetry) => {
  return (
    telemetry.temperature >= THRESHOLDS.TEMPERATURE.CRITICAL ||
    telemetry.battery_level <= THRESHOLDS.BATTERY_LEVEL.CRITICAL ||
    telemetry.cpu_load >= THRESHOLDS.CPU_LOAD.CRITICAL ||
    telemetry.motor_current >= THRESHOLDS.MOTOR_CURRENT.CRITICAL ||
    telemetry.velocity >= THRESHOLDS.VELOCITY.CRITICAL ||
    !telemetry.encoder_ok ||
    !telemetry.lidar_ok ||
    !telemetry.camera_ok
  );
};
export default THRESHOLDS;
