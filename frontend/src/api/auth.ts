import { axiosPublic } from "./axios";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const res = await axiosPublic.post("/api/auth/register", data);
  return res.data;
};

export const loginUser = async (data: LoginData) => {
  const res = await axiosPublic.post("/api/auth/login", data);
  return res.data;
};
