// Add these types to your api/admin.ts file

export interface Threshold {
  _id: string;
  robot_id: string;
  category: string;
  metric: string;
  value: number | boolean;
  unit: string;
  description: string;
  updated_by: string;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  version: number;
  change_reason: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ThresholdsData {
  TEMPERATURE: { WARNING: number; CRITICAL: number };
  BATTERY_LEVEL: { WARNING: number; CRITICAL: number };
  BATTERY_HEALTH: { WARNING: number; CRITICAL: number };
  CPU_LOAD: { WARNING: number; CRITICAL: number };
  MOTOR_CURRENT: { WARNING: number; CRITICAL: number };
  VELOCITY: { WARNING: number; CRITICAL: number };
  PC_CPU_LOAD: { WARNING: number; CRITICAL: number };
  PC_DISK_USAGE: { WARNING: number; CRITICAL: number };
  PC_TEMPERATURE: { WARNING: number; CRITICAL: number };
  SENSOR_HEALTH: {
    ENCODER_OK: boolean;
    LIDAR_OK: boolean;
    CAMERA_OK: boolean;
  };
  STATUS_LEVELS: {
    NORMAL: string;
    WARNING: string;
    CRITICAL: string;
  };
}

export interface ThresholdsResponse {
  robot_id: string;
  thresholds: ThresholdsData;
  history?: Threshold[];
}

export interface RobotsWithThresholdsResponse {
  default_thresholds: number;
  robots_with_custom_thresholds: Array<{
    robot_id: string;
    threshold_count: number;
  }>;
  total_robots: number;
}

// ADD THIS TYPE:
export interface ThresholdHistoryResponse {
  robot_id: string;
  count: number;
  history: Threshold[];
}

export interface ThresholdValue {
  value: number | boolean;
  changeReason?: string;
}

export interface BulkThresholdUpdate {
  thresholds: Array<{
    category: string;
    metric: string;
    value: number | boolean;
  }>;
  changeReason?: string;
}

export interface CopyThresholdsData {
  changeReason?: string;
}

export interface ResetThresholdsData {
  changeReason?: string;
}