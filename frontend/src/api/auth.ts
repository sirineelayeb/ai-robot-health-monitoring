import { axiosPublic, axiosPrivate } from "./axios";
import type { User, AuthResponse } from "../types/user";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axiosPublic.post<AuthResponse>("/api/auth/register", data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axiosPublic.post<AuthResponse>("/api/auth/login", data);
  return response.data;
};

export const checkEmail = async (email: string): Promise<{ exists: boolean }> => {
  const response = await axiosPublic.post<{ exists: boolean }>("/api/auth/check-email", { email });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosPrivate.get<User>("/api/auth/me");
  return response.data;
};

export const logoutUser = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};