// src/api/telemetry.ts
import { axiosPrivate } from "./axios";
import type { TelemetryData, TelemetryStats } from "../types/telemetry";

// Helper type for raw backend telemetry (timestamp is still string)
type RawTelemetryData = Omit<TelemetryData, "timestamp"> & { timestamp: string };

// ============================
// Telemetry API (authenticated)
// ============================

// Fetch latest telemetry for a robot
export const getLatestTelemetry = async (robotId: string): Promise<TelemetryData> => {
  const res = await axiosPrivate.get<RawTelemetryData>(`/api/telemetry/latest`, {
    params: { robot_id: robotId },
  });
  return { ...res.data, timestamp: new Date(res.data.timestamp) };
};

// type PaginatedResponse = {
//   data: TelemetryData[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
// };

// Fetch telemetry history for a robot (handles both array and paginated responses)
export const getTelemetryHistory = async (
  robotId: string,
  limit?: number
): Promise<TelemetryData[]> => {
  try {
    const res = await axiosPrivate.get(`/api/telemetry/history`, {
      params: { robot_id: robotId, limit },
    });
    
    //console.log('getTelemetryHistory response:', res.data); 

    let data = res.data;
    
    // Handle paginated response: { data: [...], pagination: {...} }
    if (data && typeof data === 'object' && 'data' in data) {
      data = data.data;
    }
    
    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.error('getTelemetryHistory: Expected array but got:', typeof data, data);
      return [];
    }
    
    // Map the data to convert timestamps
    return data.map((t: RawTelemetryData) => ({
      ...t,
      timestamp: new Date(t.timestamp)
    }));
  } catch (error) {
    console.error('getTelemetryHistory error:', error);
    return [];
  }
};


// Fetch all telemetry for a robot
export const getTelemetryByRobot = async (robotId: string): Promise<TelemetryData[]> => {
  const res = await axiosPrivate.get<RawTelemetryData[]>(`/api/telemetry/${robotId}`);
  return res.data.map((t) => ({ ...t, timestamp: new Date(t.timestamp) }));
};

// Fetch anomalies for a robot (optional start/end dates)
export const getAnomalies = async (
  robotId: string,
  startDate?: string,
  endDate?: string
): Promise<TelemetryData[]> => {
  try {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await axiosPrivate.get(`/api/telemetry/${robotId}/anomalies`, {
      params,
    });
    
    // Backend returns { success: true, data: [...], total, limit, skip }
    const anomalies = res.data.data;
    
    if (!Array.isArray(anomalies)) {
      console.error('getAnomalies: Expected array in data property');
      return [];
    }
    
    return anomalies.map((t: RawTelemetryData) => ({ 
      ...t, 
      timestamp: new Date(t.timestamp) 
    }));
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return [];
  }
};
// Fetch statistics for a robot
export const getStatistics = async (robotId: string): Promise<TelemetryStats> => {
  const res = await axiosPrivate.get<TelemetryStats>(`/api/telemetry/${robotId}/stats`);
  return res.data;
};

// Fetch total count of telemetry records for a robot
export const getTelemetryCount = async (robotId: string): Promise<number> => {
  const res = await axiosPrivate.get<{ total: number }>(`/api/telemetry/${robotId}/count`);
  return res.data.total;
};

// ML Prediction (authenticated)
export const predictTelemetry = async (telemetryData: TelemetryData): Promise<TelemetryData> => {
  const res = await axiosPrivate.post<RawTelemetryData>(`/api/ml/predict`, telemetryData);
  return { ...res.data, timestamp: new Date(res.data.timestamp) };
};
