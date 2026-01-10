import { axiosPrivate } from "./axios";
import type { DashboardResponse } from "../types/user";
import type { Engineer } from "./admin";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string; 
}

export const getEngineerDashboard = async (): Promise<DashboardResponse> => {
  const response = await axiosPrivate.get<DashboardResponse>("/api/engineer/dashboard");
  return response.data;
};

export const getEngineerProfile = async (): Promise<Engineer> => {
  const response = await axiosPrivate.get<Engineer>("/api/engineer/profile");
  return response.data;
};

export const updateEngineerProfile = async (data: UpdateProfileData): Promise<Engineer> => {
  const response = await axiosPrivate.patch<Engineer>("/api/engineer/profile", data);
  return response.data;
};