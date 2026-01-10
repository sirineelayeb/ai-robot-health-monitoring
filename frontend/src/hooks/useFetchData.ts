import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface UseFetchOptions {
  immediate?: boolean;
  params?: Record<string, unknown>;
  dependencies?: unknown[];
  interval?: number;
}

interface AxiosErrorResponse {
  message?: string;
}

export function useFetch<T>(
  endpoint: string,
  options: UseFetchOptions = {}
) {
  const {
    immediate = true,
    params = {},
    dependencies = [],
    interval,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<T>(`${API_URL}${endpoint}`, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setData(res.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const axiosError = err as AxiosError<AxiosErrorResponse>;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "Fetch failed";
        setError(errorMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [fetchData, immediate, ...dependencies]);

  // Optional polling
  useEffect(() => {
    if (!interval) return;
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [interval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}