import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTelemetryHistory, getTelemetryCount } from "../api/telemetry";
import { initSocket, subscribeTelemetry } from "../services/socket";
import type { TelemetryData } from "../types/telemetry";
import HistoryHeader from "../components/history/HistoryHeader";
import StatusOverview from "../components/history/StatusOverview";
import DateFilter from "../components/history/DateFilter"; 
import MetricChart from "../components/history/MetricChart";
import TelemetryTable from "../components/history/TelemetryTable";
import { Loader2 } from "lucide-react";

export default function TelemetryHistoryPage() {
  const { robotId } = useParams<{ robotId: string }>();
  
  // State
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);

  // Fetch telemetry history
  const fetchHistory = useCallback(async () => {
    if (!robotId) return;

    try {
      setLoading(true);
      setError(null);

      const [data, count] = await Promise.all([
        getTelemetryHistory(robotId, 0), // 0 = fetch all
        getTelemetryCount(robotId),
      ]);

      setHistory(
        data.map((d: TelemetryData) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        }))
      );
      setTotalCount(count);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      setError(err.message || "Failed to fetch telemetry history");
    } finally {
      setLoading(false);
    }
  }, [robotId]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (!robotId || !isAutoRefresh) return;

    const handleTelemetry = (data: any) => {
      if (data.robot_id !== robotId) return;

      const telem: TelemetryData = data._doc ? { ...data._doc } : data;
      telem.timestamp = new Date(telem.timestamp);

      setHistory((prev) => {
        // Prevent duplicates
        const exists = prev.some(t => t._id === telem._id);
        if (exists) return prev;

        // Add to beginning and sort by timestamp descending
        const updated = [telem, ...prev];
        return updated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });

      setTotalCount(prev => prev + 1);
      setLastUpdated(new Date());
    };

    const unsubscribeTelemetry = subscribeTelemetry(handleTelemetry);
    const socket = initSocket();
    socket?.emit("subscribe", robotId);

    return () => {
      unsubscribeTelemetry?.();
      socket?.emit("unsubscribe", robotId);
    };
  }, [robotId, isAutoRefresh]);

  // Polling fallback (only when auto-refresh is enabled)
  useEffect(() => {
    if (!robotId || !isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [robotId, isAutoRefresh, fetchHistory]);

  // Handlers
  const handleManualRefresh = () => {
    fetchHistory();
  };
  
  const handleToggleAutoRefresh = () => {
    setIsAutoRefresh(prev => !prev);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Filtered history by selected date
  const filteredHistory = useMemo(() => {
    if (!selectedDate) return history;
    return history.filter(
      (item) => item.timestamp.toISOString().split("T")[0] === selectedDate
    );
  }, [history, selectedDate]);

  // Get available dates for DateFilter
  const availableDates = useMemo(() => {
    const dates = new Set(
      history.map(item => item.timestamp.toISOString().split("T")[0])
    );
    return Array.from(dates).sort();
  }, [history]);

  // Loading state
  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Loading telemetry history...</p>
          <p className="text-sm text-slate-500 mt-1">Fetching data for {robotId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && history.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Missing robot ID
  if (!robotId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Robot ID Required</h3>
          <p className="text-sm text-amber-700">Please provide a valid robot ID to view telemetry history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header with controls */}
      <HistoryHeader
        robotId={robotId}
        lastUpdated={lastUpdated}
        isAutoRefresh={isAutoRefresh}
        filteredCount={filteredHistory.length}
        onManualRefresh={handleManualRefresh}
        onToggleAutoRefresh={handleToggleAutoRefresh}
      />

      {/* Date Filter */}
      <DateFilter 
        selectedDate={selectedDate} 
        onDateChange={handleDateChange}
        hasData={filteredHistory.length > 0}
        availableDates={availableDates}
      />

      {/* Status Overview Cards */}
      <StatusOverview history={filteredHistory} />

      {/* Metrics Chart */}
      <MetricChart history={filteredHistory} />

      {/* Telemetry Data Table */}
      <TelemetryTable
        history={filteredHistory}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}