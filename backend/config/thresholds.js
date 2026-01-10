export const DEFAULT_THRESHOLDS = {
  TEMPERATURE: {
    WARNING: 75,
    CRITICAL: 90
  },
  BATTERY_LEVEL: {
    WARNING: 25,
    CRITICAL: 15
  },
  BATTERY_HEALTH: {
    WARNING: 70,
    CRITICAL: 50
  },
  CPU_LOAD: {
    WARNING: 80,
    CRITICAL: 95
  },
  MOTOR_CURRENT: {
    WARNING: 9.0,
    CRITICAL: 11.0
  },
  VELOCITY: {
    WARNING: 2.5,
    CRITICAL: 3.5,
    STALL_THRESHOLD: 0.1
  },
  PC_CPU_LOAD: {
    WARNING: 85,
    CRITICAL: 95
  },
  PC_DISK_USAGE: {
    WARNING: 85,
    CRITICAL: 95
  },
  PC_TEMPERATURE: {
    WARNING: 70,
    CRITICAL: 85
  },
  NETWORK: {
    MIN_SENT_KBPS: 10,    
    MIN_RECV_KBPS: 10,   
    CRITICAL_SENT: 5,    
    CRITICAL_RECV: 5    
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

export const ISSUE_TYPES = {
  SENSOR_FAILURE: "SENSOR_FAILURE",
  OVERHEATING: "OVERHEATING",
  LOW_BATTERY: "LOW_BATTERY",
  BATTERY_DEGRADATION: "BATTERY_DEGRADATION",
  HIGH_CURRENT: "HIGH_CURRENT",
  CPU_OVERLOAD: "CPU_OVERLOAD",
  PC_CPU_OVERLOAD: "PC_CPU_OVERLOAD",
  PC_DISK_FULL: "PC_DISK_FULL",
  PC_OVERHEATING: "PC_OVERHEATING",
  ABNORMAL_VELOCITY: "ABNORMAL_VELOCITY",
  STALL_DETECTED: "STALL_DETECTED",
  NETWORK_ISSUE: "NETWORK_ISSUE",
};

/**
 * Get thresholds for a robot
 */
async function loadThresholds(robotId) {
  console.log(`📊 Using default thresholds for ${robotId}`);
  return DEFAULT_THRESHOLDS;
}

/**
 * Detect issues based on telemetry data and thresholds
 */
export const detectIssues = async (telemetry, robotId) => {
  const issues = [];
  const thresholds = await loadThresholds(robotId);

  const {
    battery_level,
    battery_health,
    temperature,
    motor_current,
    cpu_load,
    velocity,
    encoder_ok,
    lidar_ok,
    camera_ok,
    pc_cpu_load,
    pc_disk_usage,
    pc_temperature,
    pc_network_sent,
    pc_network_recv
  } = telemetry;

  // Helper function to map issue type to metric name
  const getMetricFromType = (type) => {
    const metricMap = {
      [ISSUE_TYPES.SENSOR_FAILURE]: "sensor_health",
      [ISSUE_TYPES.OVERHEATING]: "temperature",
      [ISSUE_TYPES.LOW_BATTERY]: "battery_level",
      [ISSUE_TYPES.BATTERY_DEGRADATION]: "battery_health",
      [ISSUE_TYPES.HIGH_CURRENT]: "motor_current",
      [ISSUE_TYPES.CPU_OVERLOAD]: "cpu_load",
      [ISSUE_TYPES.PC_CPU_OVERLOAD]: "pc_cpu_load",
      [ISSUE_TYPES.PC_DISK_FULL]: "pc_disk_usage",
      [ISSUE_TYPES.PC_OVERHEATING]: "pc_temperature",
      [ISSUE_TYPES.ABNORMAL_VELOCITY]: "velocity",
      [ISSUE_TYPES.STALL_DETECTED]: "velocity",
      [ISSUE_TYPES.NETWORK_ISSUE]: "network"
    };
    return metricMap[type] || "unknown";
  };

  // Sensor failures
  if (encoder_ok === false) {
    issues.push({
      type: ISSUE_TYPES.SENSOR_FAILURE,
      severity: "CRITICAL",
      message: "Encoder sensor failure detected",
      metric: "encoder_ok",  
      value: false,
      threshold: true, // Expected value is true
      timestamp: telemetry.timestamp || new Date()
    });
  }

  if (lidar_ok === false) {
    issues.push({
      type: ISSUE_TYPES.SENSOR_FAILURE,
      severity: "CRITICAL",
      message: "LiDAR sensor failure detected",
      metric: "lidar_ok",  
      value: false,
      threshold: true,
      timestamp: telemetry.timestamp || new Date()
    });
  }

  if (camera_ok === false) {
    issues.push({
      type: ISSUE_TYPES.SENSOR_FAILURE,
      severity: "CRITICAL",
      message: "Camera sensor failure detected",
      metric: "camera_ok",  
      value: false,
      threshold: true,
      timestamp: telemetry.timestamp || new Date()
    });
  }

  // Battery level
  if (battery_level !== undefined) {
    if (battery_level <= thresholds.BATTERY_LEVEL.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.LOW_BATTERY,
        severity: "CRITICAL",
        message: `Critical battery level: ${battery_level}%`,
        metric: "battery_level",  
        value: battery_level,
        threshold: thresholds.BATTERY_LEVEL.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (battery_level <= thresholds.BATTERY_LEVEL.WARNING) {
      issues.push({
        type: ISSUE_TYPES.LOW_BATTERY,
        severity: "WARNING",
        message: `Low battery level: ${battery_level}%`,
        metric: "battery_level", 
        value: battery_level,
        threshold: thresholds.BATTERY_LEVEL.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  // Battery health
  if (battery_health !== undefined) {
    if (battery_health <= thresholds.BATTERY_HEALTH.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.BATTERY_DEGRADATION,
        severity: "CRITICAL",
        message: `Critical battery health: ${battery_health}%`,
        metric: "battery_health",  
        value: battery_health,
        threshold: thresholds.BATTERY_HEALTH.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (battery_health <= thresholds.BATTERY_HEALTH.WARNING) {
      issues.push({
        type: ISSUE_TYPES.BATTERY_DEGRADATION,
        severity: "WARNING",
        message: `Poor battery health: ${battery_health}%`,
        metric: "battery_health",  
        value: battery_health,
        threshold: thresholds.BATTERY_HEALTH.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  // Temperature
  if (temperature !== undefined) {
    if (temperature >= thresholds.TEMPERATURE.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.OVERHEATING,
        severity: "CRITICAL",
        message: `Critical motor temperature: ${temperature}°C`,
        metric: "temperature",  
        value: temperature,
        threshold: thresholds.TEMPERATURE.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (temperature >= thresholds.TEMPERATURE.WARNING) {
      issues.push({
        type: ISSUE_TYPES.OVERHEATING,
        severity: "WARNING",
        message: `High motor temperature: ${temperature}°C`,
        metric: "temperature",  
        value: temperature,
        threshold: thresholds.TEMPERATURE.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  // Motor current
  if (motor_current !== undefined) {
    if (motor_current >= thresholds.MOTOR_CURRENT.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.HIGH_CURRENT,
        severity: "CRITICAL",
        message: `Critical motor current: ${motor_current}A`,
        metric: "motor_current",  
        value: motor_current,
        threshold: thresholds.MOTOR_CURRENT.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (motor_current >= thresholds.MOTOR_CURRENT.WARNING) {
      issues.push({
        type: ISSUE_TYPES.HIGH_CURRENT,
        severity: "WARNING",
        message: `High motor current: ${motor_current}A`,
        metric: "motor_current",  
        value: motor_current,
        threshold: thresholds.MOTOR_CURRENT.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  // CPU load
  if (cpu_load !== undefined) {
    if (cpu_load >= thresholds.CPU_LOAD.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.CPU_OVERLOAD,
        severity: "CRITICAL",
        message: `Critical CPU load: ${cpu_load}%`,
        metric: "cpu_load",  
        value: cpu_load,
        threshold: thresholds.CPU_LOAD.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (cpu_load >= thresholds.CPU_LOAD.WARNING) {
      issues.push({
        type: ISSUE_TYPES.CPU_OVERLOAD,
        severity: "WARNING",
        message: `High CPU load: ${cpu_load}%`,
        metric: "cpu_load",  
        value: cpu_load,
        threshold: thresholds.CPU_LOAD.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  // Velocity
if (velocity !== undefined) {
  // HIGH velocity (existing)
  if (velocity >= thresholds.VELOCITY.CRITICAL) {
    issues.push({
      type: ISSUE_TYPES.ABNORMAL_VELOCITY,  
      severity: "CRITICAL",
      message: `Critical velocity: ${velocity} m/s`,
      metric: "velocity",
      value: velocity,
      threshold: thresholds.VELOCITY.CRITICAL,
      timestamp: telemetry.timestamp || new Date()
    });
  } else if (velocity >= thresholds.VELOCITY.WARNING) {
    issues.push({
      type: ISSUE_TYPES.ABNORMAL_VELOCITY,
      severity: "WARNING",
      message: `High velocity: ${velocity} m/s`,
      metric: "velocity",
      value: velocity,
      threshold: thresholds.VELOCITY.WARNING,
      timestamp: telemetry.timestamp || new Date()
    });
  }
  
  // LOW velocity 
  const LOW_VELOCITY_THRESHOLD = 0.1; 
  if (velocity <= LOW_VELOCITY_THRESHOLD) {
    issues.push({
      type: ISSUE_TYPES.STALL_DETECTED, 
      severity: "CRITICAL",
      message: `Robot stalled: velocity ${velocity} m/s`,
      metric: "velocity",
      value: velocity,
       threshold: thresholds.VELOCITY.STALL_THRESHOLD,
      timestamp: telemetry.timestamp || new Date()
    });
  }
}

  // PC metrics
  if (pc_cpu_load !== undefined) {
    if (pc_cpu_load >= thresholds.PC_CPU_LOAD.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.PC_CPU_OVERLOAD,
        severity: "CRITICAL",
        message: `Critical PC CPU load: ${pc_cpu_load}%`,
        metric: "pc_cpu_load",  
        value: pc_cpu_load,
        threshold: thresholds.PC_CPU_LOAD.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (pc_cpu_load >= thresholds.PC_CPU_LOAD.WARNING) {
      issues.push({
        type: ISSUE_TYPES.PC_CPU_OVERLOAD,
        severity: "WARNING",
        message: `High PC CPU load: ${pc_cpu_load}%`,
        metric: "pc_cpu_load",  
        value: pc_cpu_load,
        threshold: thresholds.PC_CPU_LOAD.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  if (pc_disk_usage !== undefined) {
    if (pc_disk_usage >= thresholds.PC_DISK_USAGE.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.PC_DISK_FULL,
        severity: "CRITICAL",
        message: `Critical PC disk usage: ${pc_disk_usage}%`,
        metric: "pc_disk_usage",  
        value: pc_disk_usage,
        threshold: thresholds.PC_DISK_USAGE.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (pc_disk_usage >= thresholds.PC_DISK_USAGE.WARNING) {
      issues.push({
        type: ISSUE_TYPES.PC_DISK_FULL,
        severity: "WARNING",
        message: `High PC disk usage: ${pc_disk_usage}%`,
        metric: "pc_disk_usage",  
        value: pc_disk_usage,
        threshold: thresholds.PC_DISK_USAGE.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  if (pc_temperature !== undefined) {
    if (pc_temperature >= thresholds.PC_TEMPERATURE.CRITICAL) {
      issues.push({
        type: ISSUE_TYPES.PC_OVERHEATING,
        severity: "CRITICAL",
        message: `Critical PC temperature: ${pc_temperature}°C`,
        metric: "pc_temperature",  
        value: pc_temperature,
        threshold: thresholds.PC_TEMPERATURE.CRITICAL,
        timestamp: telemetry.timestamp || new Date()
      });
    } else if (pc_temperature >= thresholds.PC_TEMPERATURE.WARNING) {
      issues.push({
        type: ISSUE_TYPES.PC_OVERHEATING,
        severity: "WARNING",
        message: `High PC temperature: ${pc_temperature}°C`,
        metric: "pc_temperature",  
        value: pc_temperature,
        threshold: thresholds.PC_TEMPERATURE.WARNING,
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }
  // Network Issues
  if (pc_network_sent !== undefined && pc_network_recv !== undefined) {
    const networkThresholds = thresholds.NETWORK || {
      MIN_SENT_KBPS: 10,
      MIN_RECV_KBPS: 10,
      CRITICAL_SENT: 5,
      CRITICAL_RECV: 5
    };
     // Check if both sent and received are critically low
    if (pc_network_sent <= networkThresholds.CRITICAL_SENT && 
        pc_network_recv <= networkThresholds.CRITICAL_RECV) {
      issues.push({
        type: ISSUE_TYPES.NETWORK_ISSUE,
        severity: "CRITICAL",
        message: `Network connection lost (sent: ${pc_network_sent}, recv: ${pc_network_recv} KBPS)`,
        metric: "network",
        value: Math.min(pc_network_sent, pc_network_recv),
        threshold: Math.min(networkThresholds.CRITICAL_SENT, networkThresholds.CRITICAL_RECV),
        timestamp: telemetry.timestamp || new Date()
      });
    }
    // Check if either is below warning threshold
    else if (pc_network_sent <= networkThresholds.MIN_SENT_KBPS || 
             pc_network_recv <= networkThresholds.MIN_RECV_KBPS) {
      issues.push({
        type: ISSUE_TYPES.NETWORK_ISSUE,
        severity: "WARNING",
        message: `Poor network connection (sent: ${pc_network_sent}, recv: ${pc_network_recv} KBPS)`,
        metric: "network",
        value: Math.min(pc_network_sent, pc_network_recv),
        threshold: Math.min(networkThresholds.MIN_SENT_KBPS, networkThresholds.MIN_RECV_KBPS),
        timestamp: telemetry.timestamp || new Date()
      });
    }
  }

  return issues;
};

/**
 * Calculate overall robot status based on telemetry data
 */
export const calculateStatus = async (telemetry, robotId) => {
  try {
    const thresholds = await loadThresholds(robotId);

    const {
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
    } = telemetry;

    const networkThresholds = thresholds.NETWORK || {
      MIN_SENT_KBPS: 10,
      MIN_RECV_KBPS: 10,
      CRITICAL_SENT: 5,
      CRITICAL_RECV: 5
    };

    // CRITICAL conditions
    if (
      (battery_level !== undefined && battery_level <= thresholds.BATTERY_LEVEL.CRITICAL) ||
      (temperature !== undefined && temperature >= thresholds.TEMPERATURE.CRITICAL) ||
      (motor_current !== undefined && motor_current >= thresholds.MOTOR_CURRENT.CRITICAL) ||
      (cpu_load !== undefined && cpu_load >= thresholds.CPU_LOAD.CRITICAL) ||
      (pc_cpu_load !== undefined && pc_cpu_load >= thresholds.PC_CPU_LOAD.CRITICAL) ||
      (pc_disk_usage !== undefined && pc_disk_usage >= thresholds.PC_DISK_USAGE.CRITICAL) ||
      (pc_temperature !== undefined && pc_temperature >= thresholds.PC_TEMPERATURE.CRITICAL) ||
      (velocity !== undefined && velocity <= (thresholds.VELOCITY?.STALL_THRESHOLD || 0.1)) ||
      (pc_network_sent !== undefined && pc_network_recv !== undefined &&
       pc_network_sent <= networkThresholds.CRITICAL_SENT && 
       pc_network_recv <= networkThresholds.CRITICAL_RECV) ||
      encoder_ok === false || 
      lidar_ok === false || 
      camera_ok === false
    ) {
      return "CRITICAL";
    }

    // WARNING conditions
    if (
      (battery_level !== undefined && battery_level <= thresholds.BATTERY_LEVEL.WARNING) ||
      (temperature !== undefined && temperature >= thresholds.TEMPERATURE.WARNING) ||
      (motor_current !== undefined && motor_current >= thresholds.MOTOR_CURRENT.WARNING) ||
      (velocity !== undefined && velocity >= thresholds.VELOCITY.WARNING) ||
      (cpu_load !== undefined && cpu_load >= thresholds.CPU_LOAD.WARNING) ||
      (pc_cpu_load !== undefined && pc_cpu_load >= thresholds.PC_CPU_LOAD.WARNING) ||
      (pc_disk_usage !== undefined && pc_disk_usage >= thresholds.PC_DISK_USAGE.WARNING) ||
      (pc_temperature !== undefined && pc_temperature >= thresholds.PC_TEMPERATURE.WARNING) ||
      (pc_network_sent !== undefined && pc_network_sent <= networkThresholds.MIN_SENT_KBPS) ||
      (pc_network_recv !== undefined && pc_network_recv <= networkThresholds.MIN_RECV_KBPS)
    ) {
      return "WARNING";
    }

    return "NORMAL";
  } catch (error) {
    console.error('Error calculating status:', error.message);
    return "NORMAL";
  }
};