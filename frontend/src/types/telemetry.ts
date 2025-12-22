export interface TelemetryData {
  _id: string;
  robot_id: string;
  timestamp: Date; 
  battery: number; // 0-100
  motor_temp: number;
  motor_current: number;
  cpu_load: number; // 0-100
  velocity: number;
  battery_drop_rate?: number; 
  status: "NORMAL" | "WARNING" | "CRITICAL";
  is_anomaly: boolean; // added to match backend
  anomaly_score: number; // 0-1
  anomaly_type?: "normal" | "battery" | "temperature" | "velocity" | "cpu"; // optional, aligned with backend enum
}
