import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface UseFetchOptions {
  immediate?: boolean;
  params?: Record<string, any>;
  dependencies?: any[];
  interval?: number; // optional polling
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
      });

      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [fetchData, immediate, ...dependencies]);

  // Optional polling (NOT for sockets)
  useEffect(() => {
    if (!interval) return;
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [interval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
