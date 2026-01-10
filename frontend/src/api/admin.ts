import { axiosPrivate } from "./axios";
import type { User, DashboardResponse } from "../types/user";

export interface Engineer extends Omit<User, 'role'> {
  role: 'maintenance_engineer';
  isActive: boolean;
  createdAt: string;
}

export interface CreateEngineerData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateEngineerData {
  name?: string;
  email?: string;
  isActive?: boolean;
  password?: string;
}

// ==================== THRESHOLD TYPES ====================
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

export interface ThresholdsResponse {
  robot_id: string;
  thresholds: {
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
  };
  history?: Threshold[];
}

export interface RobotWithThresholds {
  robot_id: string;
  threshold_count: number;
}

export interface RobotsWithThresholdsResponse {
  default_thresholds: number;
  robots_with_custom_thresholds: RobotWithThresholds[];
  total_robots: number;
}

export interface ThresholdHistoryResponse {
  robot_id: string;
  count: number;
  history: Threshold[];
}

export interface ExportThresholdsResponse {
  robot_id: string;
  export_date: string;
  threshold_count: number;
  thresholds: Omit<Threshold, '_id' | 'updated_by' | 'is_active' | 'effective_from' | 'effective_to' | 'version' | 'change_reason' | 'createdAt' | 'updatedAt' | '__v'>[];
}

export interface CopyThresholdsData {
  changeReason?: string;
}

export interface ResetThresholdsData {
  changeReason?: string;
}

// ==================== ENGINEER MANAGEMENT ====================
export const getAdminDashboard = async (): Promise<DashboardResponse> => {
  const response = await axiosPrivate.get<DashboardResponse>("/api/admin/dashboard");
  return response.data;
};

export const getEngineers = async (): Promise<Engineer[]> => {
  const response = await axiosPrivate.get<Engineer[]>("/api/admin/engineers");
  return response.data;
};

export const createEngineer = async (data: CreateEngineerData): Promise<Engineer> => {
  const response = await axiosPrivate.post<Engineer>("/api/admin/engineers", data);
  return response.data;
};

export const updateEngineer = async (id: string, data: UpdateEngineerData): Promise<Engineer> => {
  const response = await axiosPrivate.patch<Engineer>(`/api/admin/engineers/${id}`, data);
  return response.data;
};

export const updateEngineerStatus = async (id: string, isActive: boolean): Promise<Engineer> => {
  return updateEngineer(id, { isActive });
};

export const deleteEngineer = async (id: string): Promise<{ message: string }> => {
  const response = await axiosPrivate.delete<{ message: string }>(`/api/admin/engineers/${id}`);
  return response.data;
};

// ==================== THRESHOLD MANAGEMENT ====================

// Get thresholds (default or specific robot)
export const getThresholds = async (robotId?: string): Promise<ThresholdsResponse> => {
  const endpoint = robotId ? `/api/admin/thresholds/${robotId}` : '/api/admin/thresholds';
  const response = await axiosPrivate.get<ThresholdsResponse>(endpoint);
  return response.data;
};

// Get specific threshold
export const getThreshold = async (
  robotId: string, 
  category: string, 
  metric: string
): Promise<Threshold> => {
  const response = await axiosPrivate.get<Threshold>(
    `/api/admin/thresholds/${robotId}/${category}/${metric}`
  );
  return response.data;
};

// Update a single threshold
export const updateThreshold = async (
  robotId: string,
  category: string,
  metric: string,
  data: ThresholdValue
): Promise<{ message: string; threshold: Threshold }> => {
  const response = await axiosPrivate.put<{ message: string; threshold: Threshold }>(
    `/api/admin/thresholds/${robotId}/${category}/${metric}`,
    data
  );
  return response.data;
};

// Bulk update thresholds
export const bulkUpdateThresholds = async (
  robotId: string,
  data: BulkThresholdUpdate
): Promise<{ 
  message: string; 
  results: Array<{ category: string; metric: string; value: number | boolean; success: boolean }>;
  errors?: Array<{ category: string; metric: string; error: string; success: false }>;
}> => {
  const response = await axiosPrivate.put(
    `/api/admin/thresholds/${robotId}/bulk`,
    data
  );
  return response.data;
};

// Get all robots with custom thresholds
export const getRobotsWithThresholds = async (): Promise<RobotsWithThresholdsResponse> => {
  const response = await axiosPrivate.get<RobotsWithThresholdsResponse>(
    '/api/admin/robots-with-thresholds'
  );
  return response.data;
};

// Reset thresholds to defaults
export const resetThresholds = async (
  robotId: string,
  data: ResetThresholdsData = {}
): Promise<{ 
  message: string; 
  robot_id: string; 
  reset_at: string; 
  reset_by: string;
}> => {
  const response = await axiosPrivate.post(
    `/api/admin/thresholds/${robotId}/reset`,
    data
  );
  return response.data;
};

// Get threshold history
export const getThresholdHistory = async (
  robotId: string,
  options?: { category?: string; limit?: number }
): Promise<ThresholdHistoryResponse> => {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  const response = await axiosPrivate.get<ThresholdHistoryResponse>(
    `/api/admin/thresholds/${robotId}/history${queryString}`
  );
  return response.data;
};

// Copy thresholds from one robot to another
export const copyThresholds = async (
  sourceRobotId: string,
  targetRobotId: string,
  data: CopyThresholdsData = {}
): Promise<{ 
  message: string; 
  source: string; 
  target: string; 
  threshold_count: number; 
  copied_at: string;
}> => {
  const response = await axiosPrivate.post(
    `/api/admin/thresholds/copy/${sourceRobotId}/to/${targetRobotId}`,
    data
  );
  return response.data;
};

// Export thresholds
export const exportThresholds = async (
  robotId: string,
  format: 'json' | 'csv' = 'json'
): Promise<ExportThresholdsResponse | string> => {
  const response = await axiosPrivate.get(
    `/api/admin/thresholds/${robotId}/export?format=${format}`,
    { 
      responseType: format === 'csv' ? 'blob' : 'json' 
    }
  );
  
  if (format === 'csv') {
    // Create download link for CSV
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `thresholds-${robotId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return 'CSV downloaded successfully';
  }
  
  return response.data;
};

// Test endpoint (for debugging)
export const testThresholdSave = async (): Promise<{
  success: boolean;
  message: string;
  savedId: string;
  totalThresholds: number;
  testData: any;
}> => {
  const response = await axiosPrivate.post('/api/admin/test-threshold-save');
  return response.data;
};