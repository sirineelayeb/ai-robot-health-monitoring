// Sensor thresholds for anomaly detection
export const THRESHOLDS = {
  MOTOR_TEMP: {
    WARNING: 80,
    CRITICAL: 90
  },
  
  BATTERY: {
    WARNING: 20,
    CRITICAL: 10
  },
  
  CPU_LOAD: {
    WARNING: 85,
    CRITICAL: 95
  },
  
  VELOCITY: {
    MIN_STOPPED: 0.1,
    MAX_WARNING: 3.5,
    MAX_CRITICAL: 4.5
  },
  
  BATTERY_DROP_RATE: {
    WARNING: 0.5,
    CRITICAL: 1.0
  }
};

export default THRESHOLDS;