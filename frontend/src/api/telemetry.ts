import { axiosPrivate } from "./axios";
import type { TelemetryData, TelemetryStats } from "../types/telemetry";

// ============================
// Telemetry API (authenticated)
// ============================

// Fetch latest telemetry for a robot
export const getLatestTelemetry = async (
  robotId: string
): Promise<TelemetryData | null> => {
  const res = await axiosPrivate.get(`/api/telemetry/latest`, {
    params: { robot_id: robotId },
  });

  if (!res.data?.data) return null;

  return res.data.data;
};

// Fetch telemetry history for a robot (handles both array and paginated responses)
export const getTelemetryHistory = async (
  robotId: string,
  limit?: number
): Promise<TelemetryData[]> => {
  const res = await axiosPrivate.get(`/api/telemetry/history`, {
    params: { robot_id: robotId, limit },
  });

  const data = res.data?.data || [];
  return data;
};

// Fetch all telemetry for a robot
export const getTelemetryByRobot = async (robotId: string): Promise<TelemetryData[]> => {
  const res = await axiosPrivate.get<TelemetryData[]>(`/api/telemetry/${robotId}`);
  return res.data;
};

// Fetch anomalies for a robot (pagination supported)
export const getAnomalies = async (
  robotId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }
): Promise<TelemetryData[]> => {
  try {
    const params: Record<string, string | number> = {};

    if (options?.startDate) params.startDate = options.startDate;
    if (options?.endDate) params.endDate = options.endDate;
    if (options?.limit) params.limit = options.limit;
    if (options?.skip) params.skip = options.skip;

    const res = await axiosPrivate.get(
      `/api/telemetry/${robotId}/anomalies`,
      { params }
    );

    const anomalies = res.data.data;

    if (!Array.isArray(anomalies)) {
      console.error("getAnomalies: Expected array");
      return [];
    }

    return anomalies;
  } catch (error) {
    console.error("Error fetching anomalies:", error);
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
  const res = await axiosPrivate.post<TelemetryData>(`/api/ml/predict`, telemetryData);
  return res.data;
};