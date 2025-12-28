import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTelemetryHistory, getTelemetryCount } from "../api/telemetry";
import type { TelemetryData } from "../types/telemetry";
import HistoryHeader from "../components/history/HistoryHeader";
import StatusOverview from "../components/history/StatusOverview";
import StatusChangesTimeline from "../components/history/StatusChangesTimeline";
import DateFilter from "../components/history/DateFilter"; 
import MetricChart from "../components/history/MetricChart";
import MetricsGrid from "../components/history/MetricsGrid";
import TelemetryTable from "../components/history/TelemetryTable";

export default function TelemetryHistoryPage() {
  const { robotId } = useParams<{ robotId: string }>();
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch all telemetry history
  const fetchHistory = useCallback(async () => {
    if (!robotId) return;

    try {
      setLoading(true);

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
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch telemetry history");
    } finally {
      setLoading(false);
    }
  }, [robotId]);

  // Initial fetch only
  useEffect(() => {
    fetchHistory();
  }, [robotId, fetchHistory]);

  const handleManualRefresh = () => fetchHistory();
  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setCurrentPage(1);
  };

  // Filtered history by selected date (YYYY-MM-DD)
  const filteredHistory = useMemo(() => {
    if (!selectedDate) return history;
    return history.filter(
      (item) => item.timestamp.toISOString().split("T")[0] === selectedDate
    );
  }, [history, selectedDate]);

  if (loading && history.length === 0)
    return <p className="p-6">Loading telemetry history...</p>;
  if (error && history.length === 0)
    return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!robotId)
    return <p className="p-6 text-red-600">Robot ID is required</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <HistoryHeader
        robotId={robotId}
        lastUpdated={lastUpdated}
        isAutoRefresh={false} 
        filteredCount={filteredHistory.length}
        onManualRefresh={handleManualRefresh}
      />

      {/* Status Overview */}
      <StatusOverview history={filteredHistory} />

      {/* Status Changes Timeline */}
      <StatusChangesTimeline history={filteredHistory} />

      {/* Date Filter */}
      <DateFilter selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Metrics */}
      <MetricChart history={filteredHistory} />
      <MetricsGrid history={filteredHistory} />

      {/* Telemetry Table */}
      <TelemetryTable
        history={filteredHistory}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
