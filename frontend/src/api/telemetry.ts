import { axiosPublic, axiosPrivate } from "./axios";
import type { TelemetryData } from "../types/telemetry";

// Public telemetry (no auth required)
export const fetchHistoricalTelemetry = async (
  robot_id: string,
  limit = 50
): Promise<TelemetryData[]> => {
  const res = await axiosPublic.get("/api/telemetry/history", {
    params: { robot_id, limit },
  });

  return Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
};

// Protected telemetry (needs auth)
export const getLatestTelemetry = async (robot_id: string): Promise<TelemetryData> => {
  const res = await axiosPrivate.get("/api/telemetry/latest", {
    params: { robot_id },
  });
  return res.data.data;
};

export const getTelemetryByRobot = async (robot_id: string): Promise<TelemetryData[]> => {
  const res = await axiosPrivate.get(`/api/telemetry/${robot_id}`);
  return res.data.data;
};

export const getHealthSummary = async (robot_id: string) => {
  const res = await axiosPrivate.get(`/api/telemetry/${robot_id}/health`);
  return res.data;
};

export const getAnomaliesByRobot = async (robot_id: string) => {
  const res = await axiosPrivate.get(`/api/telemetry/${robot_id}/anomalies`);
  return res.data.data;
};

export const getTelemetryStats = async (robot_id: string) => {
  const res = await axiosPrivate.get(`/api/telemetry/${robot_id}/stats`);
  return res.data;
};
