export interface TelemetryData {
  _id: string;
  robot_id: string;
  timestamp: Date;
  
  // ---------------- Robot sensors ----------------
  battery_level: number; // 0-100 (renamed from 'battery')
  temperature: number; // Motor temperature (renamed from 'motor_temp')
  motor_current: number;
  cpu_load: number; // 0-100
  velocity: number;
  
  // ---------------- Sensor health ----------------
  encoder_ok: boolean;
  lidar_ok: boolean;
  camera_ok: boolean;
  
  // ---------------- PC metrics ----------------
  pc_cpu_load: number; // 0-100
  pc_memory_load: number; // 0-100
  pc_disk_usage: number; // 0-100
  pc_network_sent: number;
  pc_network_recv: number;
  pc_temperature: number;
  
  // ---------------- Rule-based status ----------------
  status: "NORMAL" | "WARNING" | "CRITICAL";
  is_anomaly: boolean;
  anomaly_type: "MOTOR_OVERHEATING" | "BATTERY_DEGRADATION" | "ABNORMAL_VELOCITY" | null;
  
  // ---------------- Additional (if you're calculating these) ----------------
  battery_drop_rate?: number; // This is calculated, not in backend model
  anomaly_score?: number; // This is calculated, not in backend model
  
  // Mongoose timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TelemetryStats {
  lastAnomalyTime: string | null;
  totalAnomalies: number;
  anomalyPercentage: number;
  totalRecords: number;
}