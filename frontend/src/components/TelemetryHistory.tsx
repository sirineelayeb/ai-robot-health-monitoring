import { useState, useMemo } from "react";
import type { TelemetryData } from "../types/telemetry";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "./ui/button";
import { AlertTriangle, AlertCircle, CheckCircle, RefreshCw, Play, Pause } from "lucide-react";
import { theme } from "../config/theme";

const PAGE_SIZE = 10;

interface TelemetryHistoryProps {
  robotId: string;
  history: TelemetryData[];
  totalCount: number;
  lastUpdated: Date | null;
  isAutoRefresh: boolean;
  onManualRefresh: () => void;
  onToggleAutoRefresh: () => void;
}

function TelemetryHistory({ 
  robotId, 
  history, 
  totalCount,
  lastUpdated,
  isAutoRefresh,
  onManualRefresh,
  onToggleAutoRefresh
}: TelemetryHistoryProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedMetric, setSelectedMetric] = useState<string>("battery");

  // Filter history by selected datetime (hour precision)
  const filteredHistory = useMemo(() => {
    if (!selectedDateTime) return history;

    const selected = new Date(selectedDateTime).getTime();
    return history.filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      return Math.abs(itemTime - selected) <= 60 * 60 * 1000;
    });
  }, [selectedDateTime, history]);

  // Status statistics
  const statusStats = useMemo(() => {
    const stats = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    filteredHistory.forEach((item) => stats[item.status]++);
    return stats;
  }, [filteredHistory]);

  // Status changes (detect transitions)
  const statusChanges = useMemo(() => {
    const changes: Array<{ timestamp: string; from: string; to: string }> = [];
    for (let i = 1; i < filteredHistory.length; i++) {
      if (filteredHistory[i].status !== filteredHistory[i - 1].status) {
        changes.push({
          timestamp: filteredHistory[i].timestamp.toString(),
          from: filteredHistory[i - 1].status,
          to: filteredHistory[i].status,
        });
      }
    }
    return changes;
  }, [filteredHistory]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

const getStatusStyles = (status: string) => {
  switch (status) {
    case "NORMAL":
      return {
        text: theme.colors.status.good.main,
        bg: theme.colors.status.good.bg,
        border: theme.colors.status.good.soft, // <-- updated
      };
    case "WARNING":
      return {
        text: theme.colors.status.warning.main,
        bg: theme.colors.status.warning.bg,
        border: theme.colors.status.warning.soft, // <-- updated
      };
    case "CRITICAL":
      return {
        text: theme.colors.status.critical.main,
        bg: theme.colors.status.critical.bg,
        border: theme.colors.status.critical.soft, // <-- updated
      };
    default:
      return {
        text: theme.colors.text.secondary,
        bg: theme.colors.background.main,
        border: theme.colors.border.default,
      };
  }
};


  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    switch (status) {
      case "NORMAL": return <CheckCircle className={iconClass} />;
      case "WARNING": return <AlertTriangle className={iconClass} />;
      case "CRITICAL": return <AlertCircle className={iconClass} />;
      default: return null;
    }
  };

const metrics = [
  { 
    key: "battery", 
    label: "Battery (%)", 
    color: theme.colors.metrics.battery.main,
    lightColor: theme.colors.metrics.battery.light,
    bgColor: theme.colors.metrics.battery.bg,
  },
  { 
    key: "motor_temp", 
    label: "Motor Temp (°C)", 
    color: theme.colors.metrics.motorTemp.main,
    lightColor: theme.colors.metrics.motorTemp.light,
    bgColor: theme.colors.metrics.motorTemp.bg,
  },
  { 
    key: "motor_current", 
    label: "Motor Current (A)", 
    color: theme.colors.metrics.motorCurrent.main,
    lightColor: theme.colors.metrics.motorCurrent.light,
    bgColor: theme.colors.metrics.motorCurrent.bg,
  },
  { 
    key: "cpu_load", 
    label: "CPU Load (%)", 
    color: theme.colors.metrics.cpuLoad.main,
    lightColor: theme.colors.metrics.cpuLoad.light,
    bgColor: theme.colors.metrics.cpuLoad.bg,
  },
  { 
    key: "velocity", 
    label: "Velocity (m/s)", 
    color: theme.colors.metrics.velocity.main,
    lightColor: theme.colors.metrics.velocity.light,
    bgColor: theme.colors.metrics.velocity.bg,
  },
  { 
    key: "anomaly_score", 
    label: "Anomaly Score", 
    color: theme.colors.metrics.anomalyScore.main,
    lightColor: theme.colors.metrics.anomalyScore.light,
    bgColor: theme.colors.metrics.anomalyScore.bg,
  },
];


  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: theme.colors.background.main }}>
      {/* Header with Real-time Controls */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-4 mb-6">
  {/* Left section: Title + Live / Info */}
  <div className="flex flex-col gap-2">
    <h2 className={theme.typography.heading.h2}>
      {`Telemetry History for ${robotId}`}
    </h2>

    <div className="flex flex-wrap items-center gap-3 text-sm">
      {/* Total Records */}
      <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
        Total records: {filteredHistory.length}
      </p>

      <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
        •
      </span>

      {/* Live / Paused Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${isAutoRefresh ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: isAutoRefresh
              ? theme.colors.status.good.main
              : theme.colors.text.tertiary,
          }}
        />

        <p style={{ color: theme.colors.text.secondary }}>
          {isAutoRefresh ? 'Live' : 'Paused'} • Updated {formatLastUpdated()}
        </p>
      </div>
    </div>
  </div>

  {/* Right section: Buttons */}
  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
    <Button
      variant="outline"
      onClick={onManualRefresh}
      className="flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh Now
    </Button>

    <Button
      variant={isAutoRefresh ? 'default' : 'outline'}
      onClick={onToggleAutoRefresh}
      className="flex items-center gap-2"
    >
      {isAutoRefresh ? (
        <>
          <Pause className="w-4 h-4" />
          Pause Updates
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Resume Updates
        </>
      )}
    </Button>
  </div>
</div>


      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className={`${theme.card.base} ${theme.card.padding}`}
          style={{ backgroundColor: getStatusStyles("NORMAL").bg, borderColor: getStatusStyles("NORMAL").border }}
        >
          <div className="flex items-center gap-2 mb-2" style={{ color: getStatusStyles("NORMAL").text }}>
            {getStatusIcon("NORMAL")}
            <h3 className="font-semibold">Normal</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: getStatusStyles("NORMAL").text }}>
            {statusStats.NORMAL}
          </p>
          <p className="text-sm" style={{ color: getStatusStyles("NORMAL").text }}>
            {filteredHistory.length > 0 ? ((statusStats.NORMAL / filteredHistory.length) * 100).toFixed(1) : 0}% of time
          </p>
        </div>
        
        <div 
          className={`${theme.card.base} ${theme.card.padding}`}
          style={{ backgroundColor: getStatusStyles("WARNING").bg, borderColor: getStatusStyles("WARNING").border }}
        >
          <div className="flex items-center gap-2 mb-2" style={{ color: getStatusStyles("WARNING").text }}>
            {getStatusIcon("WARNING")}
            <h3 className="font-semibold">Warning</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: getStatusStyles("WARNING").text }}>
            {statusStats.WARNING}
          </p>
          <p className="text-sm" style={{ color: getStatusStyles("WARNING").text }}>
            {filteredHistory.length > 0 ? ((statusStats.WARNING / filteredHistory.length) * 100).toFixed(1) : 0}% of time
          </p>
        </div>
        
        <div 
          className={`${theme.card.base} ${theme.card.padding}`}
          style={{ backgroundColor: getStatusStyles("CRITICAL").bg, borderColor: getStatusStyles("CRITICAL").border }}
        >
          <div className="flex items-center gap-2 mb-2" style={{ color: getStatusStyles("CRITICAL").text }}>
            {getStatusIcon("CRITICAL")}
            <h3 className="font-semibold">Critical</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: getStatusStyles("CRITICAL").text }}>
            {statusStats.CRITICAL}
          </p>
          <p className="text-sm" style={{ color: getStatusStyles("CRITICAL").text }}>
            {filteredHistory.length > 0 ? ((statusStats.CRITICAL / filteredHistory.length) * 100).toFixed(1) : 0}% of time
          </p>
        </div>
      </div>

      {/* Status Changes Timeline */}
      {statusChanges.length > 0 && (
        <div className={`${theme.card.base} ${theme.card.padding}`}>
          <h3 className={theme.typography.heading.h3}>
            Status Changes ({statusChanges.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
            {statusChanges.map((change, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 text-sm p-3 rounded"
                style={{ backgroundColor: theme.colors.background.hover }}
              >
                <span 
                  className="font-mono text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {new Date(change.timestamp).toLocaleString()}
                </span>
                <span 
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ 
                    color: getStatusStyles(change.from).text,
                    backgroundColor: getStatusStyles(change.from).bg,
                    border: `1px solid ${getStatusStyles(change.from).border}`
                  }}
                >
                  {change.from}
                </span>
                <span style={{ color: theme.colors.text.tertiary }}>→</span>
                <span 
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ 
                    color: getStatusStyles(change.to).text,
                    backgroundColor: getStatusStyles(change.to).bg,
                    border: `1px solid ${getStatusStyles(change.to).border}`
                  }}
                >
                  {change.to}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DateTime Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className={theme.typography.label}>Filter by Date & Hour:</label>
        <input
          type="datetime-local"
          value={selectedDateTime}
          onChange={(e) => { setSelectedDateTime(e.target.value); setCurrentPage(1); }}
          className="border rounded px-3 py-2"
          style={{ borderColor: theme.colors.border.default }}
        />
        <Button variant="secondary" onClick={() => setSelectedDateTime("")}>
          Reset Filter
        </Button>
      </div>

      {/* Metric Selector for Combined Chart */}
      <div className={`${theme.card.base} ${theme.card.padding}`}>
        <h3 className={theme.typography.heading.h3}>Detailed Metric View</h3>
        <div className="flex gap-2 mb-4 mt-3 flex-wrap">
          {metrics.map((metric) => (
            <Button
              key={metric.key}
              variant={selectedMetric === metric.key ? "default" : "outline"}
              onClick={() => setSelectedMetric(metric.key)}
            >
              {metric.label}
            </Button>
          ))}
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredHistory}>
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke={theme.colors.chart.axis}
            />
            <YAxis stroke={theme.colors.chart.axis} />
            <Tooltip 
              labelFormatter={(t) => new Date(t).toLocaleString()}
              formatter={(value: any, name?: string) => {
                if (name === "status") return [value, "Status"];
                return [value, metrics.find(m => m.key === name)?.label || name];
              }}
              contentStyle={{ 
                backgroundColor: theme.colors.background.card,
                borderColor: theme.colors.border.default 
              }}
            />
            <CartesianGrid stroke={theme.colors.chart.grid} strokeDasharray="5 5" />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke={metrics.find(m => m.key === selectedMetric)?.color} 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            {statusChanges.map((change, idx) => (
              <ReferenceLine
                key={idx}
                x={change.timestamp}
                stroke={getStatusStyles(change.to).text}
                strokeDasharray="3 3"
                label={{ 
                  value: change.to, 
                  position: "top",
                  fill: getStatusStyles(change.to).text 
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.key} className={`${theme.card.base} p-3`}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: theme.colors.text.label }}>
              {metric.label}
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={filteredHistory}>
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke={theme.colors.chart.axis} />
                <Tooltip 
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  formatter={(value: any) => [value, metric.label]}
                  contentStyle={{ 
                    backgroundColor: theme.colors.background.card,
                    borderColor: theme.colors.border.default 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={metric.key} 
                  stroke={metric.color} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className={`${theme.card.base} overflow-hidden`}>
        <h3
          className={`${theme.typography.heading.h3} p-4 border-b`}
          style={{
            backgroundColor: theme.colors.background.hover,
            borderColor: theme.colors.border.default,
          }}
        >
          Detailed Records
        </h3>

        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead style={{ backgroundColor: theme.colors.background.hover }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Timestamp</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Status</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Battery</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Motor Temp</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Motor Current</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>CPU Load</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Velocity</th>
                <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Anomaly</th>
              </tr>
            </thead>

            <tbody>
              {paginatedHistory
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((item, idx) => (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-gray-100"
                    style={{
                      borderTop: `1px solid ${theme.colors.border.light}`,
                      backgroundColor: idx % 2 === 0 ? theme.colors.background.card : theme.colors.background.main,
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: theme.colors.text.secondary }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-center gap-1 px-2 py-1 rounded-full mx-auto w-fit"
                        style={{
                          color: getStatusStyles(item.status).text,
                          backgroundColor: getStatusStyles(item.status).bg,
                          border: `1px solid ${getStatusStyles(item.status).border}`,
                        }}
                      >
                        {getStatusIcon(item.status)}
                        <span className="text-xs font-semibold">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.battery}%</td>
                    <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.motor_temp}°C</td>
                    <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.motor_current}A</td>
                    <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.cpu_load}%</td>
                    <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.velocity} m/s</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        style={{
                          color: item.anomaly_score > 0.7 ? theme.colors.status.critical.main : theme.colors.text.primary,
                          fontWeight: item.anomaly_score > 0.7 ? 600 : 400,
                        }}
                      >
                        {(item.anomaly_score * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
  className="flex flex-col sm:flex-row justify-between items-center p-4 border-t"
  style={{
    backgroundColor: theme.colors.background.hover,
    borderColor: theme.colors.border.default,
  }}
>
  {/* Info Text */}
  <div className="text-sm mb-2 sm:mb-0" style={{ color: theme.colors.text.secondary }}>
    Displaying {(currentPage - 1) * PAGE_SIZE + 1}–
    {Math.min(currentPage * PAGE_SIZE, filteredHistory.length)} of{' '}
    {totalCount.toLocaleString()} records ({filteredHistory.length} loaded)
  </div>

  {/* Pagination Controls */}
  <div className="flex flex-wrap items-center gap-2">
    <Button
      variant="outline"
      disabled={currentPage <= 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-3 py-1 text-sm"
    >
      Previous
    </Button>

    <span
      className="px-3 py-1 text-sm font-medium rounded"
      style={{
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.card,
      }}
    >
      Page {currentPage} of {totalPages}
    </span>

    <Button
      variant="outline"
      disabled={currentPage >= totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 text-sm"
    >
      Next
    </Button>
  </div>
</div>

      </div>
    </div>
  );
}

export default TelemetryHistory;
