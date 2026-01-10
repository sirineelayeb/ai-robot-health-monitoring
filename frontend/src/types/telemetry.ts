// src/types/telemetry.ts

// ---------------- ML Prediction Result ----------------
export interface MLPrediction {
  is_anomaly: boolean;
  anomaly_type: "Normal" | "MOTOR_OVERHEATING" | "BATTERY_DEGRADATION" | "ABNORMAL_VELOCITY" | null;
  confidence: number;
  model_version: string;
  predicted_at: string | Date;
}

// ---------------- Detected Issue ----------------
export interface DetectedIssue {
  severity: "WARNING" | "CRITICAL";
  message: string;
  metric: string;  // e.g., "temperature", "pc_cpu_load", "battery_level"
  value: number;
  threshold: number;
  detected_at: string | Date;
}

// ---------------- Main Telemetry Interface ----------------
export interface TelemetryData {
  _id: string;

  // ---------------- Robot identification ----------------
  robot_id: string;
  timestamp: string | Date;

  // ---------------- Robot sensors (ML FEATURES) ----------------
  battery_level: number;      // 0-100
  battery_health: number;     // 0-100
  battery_drop_rate: number;  // rate of drop per time
  battery_trend: number;

  temperature: number;        // Motor temperature
  motor_current: number;
  cpu_load: number;           // 0-100
  velocity: number;

  // ---------------- Sensor health ----------------
  encoder_ok: boolean;
  lidar_ok: boolean;
  camera_ok: boolean;

  // ---------------- PC metrics (visualization only) ----------------
  pc_cpu_load: number;        // 0-100
  pc_memory_load: number;     // 0-100
  pc_disk_usage: number;      // 0-100
  pc_network_sent: number;
  pc_network_recv: number;
  pc_temperature: number;

  // ---------------- Rule-based status ----------------
  status: "NORMAL" | "WARNING" | "CRITICAL";
  is_anomaly: boolean;
  
  // EXACT MATCH to backend enum
  anomaly_type: 
    // Physical Robot Issues
    | "LOW_BATTERY"           // battery_level low (Rules only)
    | "BATTERY_DEGRADATION"   // battery_health low (ML OR Rules)
    | "OVERHEATING"           // temperature high (Rules only)
    | "MOTOR_OVERHEATING"     // temperature pattern (ML only)
    | "HIGH_CURRENT"          // motor_current high (Rules only)
    | "ABNORMAL_VELOCITY"     // velocity pattern (ML OR Rules)
    | "STALL_DETECTED"        // velocity very low (Rules only)
    | "CPU_OVERLOAD"          // cpu_load high (Rules only)
    | "SENSOR_FAILURE"        // encoder/lidar/camera failed (Rules only)
    
    // PC/Computer Issues
    | "PC_CPU_OVERLOAD"       // pc_cpu_load high (Rules only)
    | "PC_OVERHEATING"        // pc_temperature high (Rules only)
    | "PC_DISK_FULL"          // pc_disk_usage high (Rules only)
    | "NETWORK_ISSUE"         // pc_network_sent and pc_network_recv
    
    // Generic
    | "SYSTEM_ANOMALY"        // Generic/unknown issue
    | null;

  detected_issues?: DetectedIssue[];

  // ---------------- ML prediction ----------------
  ml_prediction?: {
    is_anomaly: boolean;
    anomaly_type: "Normal" | "MOTOR_OVERHEATING" | "BATTERY_DEGRADATION" | "ABNORMAL_VELOCITY" | null;
    confidence: number;
    model_version: string;
    predicted_at: string | Date;
  } | null;

  // ---------------- Mongoose timestamps ----------------
  createdAt?: string;
  updatedAt?: string;
}

// ---------------- Utility Types ----------------
export interface TelemetryStats {
  lastAnomalyTime: string | null;
  totalAnomalies: number;
  anomalyPercentage: number;
  totalRecords: number;
}

export interface RealTimeAlert {
  robot_id: string;
  timestamp: string | Date;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  is_anomaly: boolean;
  anomaly_type: TelemetryData['anomaly_type'];
  issues: DetectedIssue[];
  ml_anomaly: boolean;
  ml_prediction?: MLPrediction;
  telemetry_id: string;
  metrics: {
    battery_level: number;
    temperature: number;
    motor_current: number;
    cpu_load: number;
    velocity: number;
    pc_cpu_load: number;
    pc_disk_usage: number;
    pc_temperature: number;
    pc_network_sent: number;
    pc_network_recv: number;
  };
}

// ---------------- For Filtering/Querying ----------------
export interface TelemetryFilter {
  robot_id?: string;
  startDate?: string;
  endDate?: string;
  status?: TelemetryData['status'];
  anomaly_type?: TelemetryData['anomaly_type'];
  limit?: number;
  page?: number;
}

// ---------------- Paginated Response ----------------
export interface TelemetryResponse {
  success: boolean;
  data: TelemetryData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ---------------- Helper Functions Types ----------------
export type SeverityType = "NORMAL" | "WARNING" | "CRITICAL";

export interface MetricThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit?: string;
}

// ---------------- For Charts/Visualization ----------------
export interface TelemetryChartPoint {
  timestamp: string | Date;
  value: number;
  status?: SeverityType;
  anomaly?: boolean;
}

// ---------------- ML Model Status ----------------
export interface MLModelStatus {
  is_active: boolean;
  version: string;
  last_prediction: string | Date;
  accuracy: number;
  anomalies_detected: number;
}