import { useState, useCallback } from "react";
import { axiosPublic, axiosPrivate } from "../api/axios";
import { useAuthContext } from "./useAuthContext";

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'maintenance_engineer';
  };
  token: string;
}

interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useAuthContext();

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosPublic.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      
      // Update context
      dispatch({
        type: "LOGIN",
        payload: {
          user: response.data.user,
          accessToken: response.data.token
        }
      });
      
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Login failed";
      
      // Check if it's an axios error with response data
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as ApiError;
        const serverMessage = axiosError.response?.data?.message;
        if (serverMessage) {
          setError(serverMessage);
          throw new Error(serverMessage);
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosPublic.post<AuthResponse>("/api/auth/register", {
        name,
        email,
        password,
      });
      
      // Update context
      dispatch({
        type: "LOGIN",
        payload: {
          user: response.data.user,
          accessToken: response.data.token
        }
      });
      
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Registration failed";
      
      // Check if it's an axios error with response data
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as ApiError;
        const serverMessage = axiosError.response?.data?.message;
        if (serverMessage) {
          setError(serverMessage);
          throw new Error(serverMessage);
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
const logout = useCallback(() => {
  localStorage.clear();
  dispatch({ type: "LOGOUT" });
}, [dispatch]);


  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosPrivate.get<AuthResponse["user"]>("/api/auth/me");
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to get user";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEmail = useCallback(async (email: string): Promise<{ exists: boolean }> => {
    try {
      const response = await axiosPublic.post<{ exists: boolean }>("/api/auth/check-email", { email });
      return response.data;
    } catch (err: unknown) {
      console.error("Email check failed:", err);
      return { exists: false };
    }
  }, []);

  return {
    login,
    register,
    logout,
    getCurrentUser,
    checkEmail,
    loading,
    error,
    clearError: () => setError(null),
  };
};