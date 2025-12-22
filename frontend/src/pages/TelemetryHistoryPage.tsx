// pages/TelemetryHistoryPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchHistoricalTelemetry } from "../api/telemetry";
import type { TelemetryData } from "../types/telemetry";
import TelemetryHistory from "../components/TelemetryHistory";

const REFRESH_INTERVAL = 5000; // 5 seconds

const TelemetryHistoryPage: React.FC = () => {
  const { robotId } = useParams<{ robotId: string }>();
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!robotId) return;

    try {
      // Don't show loading spinner on subsequent fetches
      if (history.length === 0) {
        setLoading(true);
      }
      const data = await fetchHistoricalTelemetry(robotId, 200);
      setHistory(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch telemetry history");
    } finally {
      setLoading(false);
    }
  }, [robotId, history.length]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [robotId]); // Only depend on robotId for initial fetch

  // Auto-refresh interval
  useEffect(() => {
    if (!isAutoRefresh || !robotId) return;

    const intervalId = setInterval(() => {
      fetchHistory();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAutoRefresh, robotId, fetchHistory]);

  const handleManualRefresh = () => {
    fetchHistory();
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefresh((prev) => !prev);
  };

  if (loading) return <p className="p-6">Loading telemetry history...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (history.length === 0) return <p className="p-6">No telemetry history available for {robotId}</p>;

  return (
    <TelemetryHistory 
      robotId={robotId!} 
      history={history}
      lastUpdated={lastUpdated}
      isAutoRefresh={isAutoRefresh}
      onManualRefresh={handleManualRefresh}
      onToggleAutoRefresh={toggleAutoRefresh}
    />
  );
};

export default TelemetryHistoryPage;