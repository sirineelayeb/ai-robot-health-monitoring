// src/types/ml.ts
export interface TelemetryMLResponse {
  success: boolean;
  anomaly_type: "MOTOR_OVERHEATING" | "BATTERY_DEGRADATION" | "ABNORMAL_VELOCITY" | "Normal";
  is_anomaly: boolean;
  confidence: number; // 0-1
  probabilities: {
    ABNORMAL_VELOCITY: number;
    BATTERY_DEGRADATION: number;
    MOTOR_OVERHEATING: number;
    Normal: number;
  };
}

// Combined type for frontend usage
import type { TelemetryData } from "./telemetry";

export interface TelemetryWithML extends TelemetryData {
  mlPrediction?: TelemetryMLResponse;
}
