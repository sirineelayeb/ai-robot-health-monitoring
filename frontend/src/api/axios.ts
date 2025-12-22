import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Public instance (no auth required)
export const axiosPublic = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Private instance (authenticated requests)
export const axiosPrivate = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // if using cookies for auth
});

// Optional: attach token automatically from localStorage
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
