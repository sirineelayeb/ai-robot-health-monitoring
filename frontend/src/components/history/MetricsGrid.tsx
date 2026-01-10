import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";

interface Props {
  history: TelemetryData[];
}

type MetricKey =
  | "battery_level"
  | "battery_health"
  | "temperature"
  | "motor_current"
  | "cpu_load"
  | "velocity"
  | "pc_cpu_load"
  | "pc_memory_load"
  | "pc_temperature";

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
  thresholds?: {
    good: number;
    warning: number;
  };
}

// ================ METRICS CONFIGURATION ================
const metrics: MetricConfig[] = [
  {
    key: "battery_level",
    label: "Battery Level",
    color: theme.colors.metrics.battery.main,
    unit: "%",
    thresholds: { good: 50, warning: 20 },
  },
  {
    key: "battery_health",
    label: "Battery Health",
    color: theme.colors.metrics.battery.soft,
    unit: "%",
    thresholds: { good: 80, warning: 60 },
  },
  {
    key: "temperature",
    label: "Motor Temp",
    color: theme.colors.metrics.motorTemp.main,
    unit: "°C",
    thresholds: { good: 60, warning: 75 },
  },
  {
    key: "motor_current",
    label: "Motor Current",
    color: theme.colors.metrics.motorCurrent.main,
    unit: "A",
  },
  {
    key: "cpu_load",
    label: "Robot CPU",
    color: theme.colors.metrics.cpuLoad.main,
    unit: "%",
    thresholds: { good: 70, warning: 85 },
  },
  {
    key: "velocity",
    label: "Velocity",
    color: theme.colors.metrics.velocity.main,
    unit: "m/s",
  },
  {
    key: "pc_cpu_load",
    label: "PC CPU",
    color: theme.colors.chart.tertiary,
    unit: "%",
    thresholds: { good: 70, warning: 85 },
  },
  {
    key: "pc_memory_load",
    label: "PC Memory",
    color: theme.colors.chart.secondary,
    unit: "%",
    thresholds: { good: 70, warning: 85 },
  },
  {
    key: "pc_temperature",
    label: "PC Temperature",
    color: theme.colors.metrics.pcTemperature.main,
    unit: "°C",
    thresholds: { good: 65, warning: 80 },
  },
];

// ================ UTILITY FUNCTIONS ================
const getStatusColor = (
  value: number,
  thresholds?: { good: number; warning: number }
) => {
  if (!thresholds) return theme.colors.text.primary;
  if (value >= thresholds.good) return theme.colors.status.good.main;
  if (value >= thresholds.warning) return theme.colors.status.warning.main;
  return theme.colors.status.critical.main;
};

const getStatusBg = (
  value: number,
  thresholds?: { good: number; warning: number }
) => {
  if (!thresholds) return "transparent";
  if (value >= thresholds.good) return theme.colors.status.good.bg;
  if (value >= thresholds.warning) return theme.colors.status.warning.bg;
  return theme.colors.status.critical.bg;
};

// ================ REUSABLE COMPONENTS ================
interface StatusCardProps {
  title: string;
  children: React.ReactNode;
}

const StatusCard = ({ title, children }: StatusCardProps) => (
  <div className={`${theme.card.base} p-4`}>
    <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" 
         style={{ color: theme.colors.text.secondary }}>
      {title}
    </h4>
    {children}
  </div>
);

interface MetricCardProps {
  config: MetricConfig;
  latestValue: number;
  history: TelemetryData[];
}

const MetricCard = ({ config, latestValue, history }: MetricCardProps) => {
  const statusColor = getStatusColor(latestValue, config.thresholds);
  const statusBg = getStatusBg(latestValue, config.thresholds);

  return (
    <div className={`${theme.card.base} p-4`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold" 
            style={{ color: theme.colors.text.label }}>
          {config.label}
        </h3>
        <span className="text-lg font-bold px-2 py-1 rounded"
              style={{ color: statusColor, backgroundColor: statusBg }}>
          {typeof latestValue === "number" ? latestValue.toFixed(1) : latestValue || "N/A"}
          {config.unit}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={history}>
          <XAxis dataKey="timestamp" hide />
          <YAxis stroke={theme.colors.chart.axis} domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleString()}
            formatter={(value: any) => [
              `${Number(value).toFixed(2)}${config.unit}`,
              config.label,
            ]}
            contentStyle={{
              backgroundColor: theme.colors.background.card,
              borderColor: theme.colors.border.default,
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Min/Max values */}
      <div className="flex justify-between text-xs mt-2" 
           style={{ color: theme.colors.text.secondary }}>
        <span>
          Min: {typeof latestValue === "number" 
            ? Math.min(...history.map(h => h[config.key] as number)).toFixed(1)
            : "N/A"}
          {config.unit}
        </span>
        <span>
          Max: {typeof latestValue === "number"
            ? Math.max(...history.map(h => h[config.key] as number)).toFixed(1)
            : "N/A"}
          {config.unit}
        </span>
      </div>
    </div>
  );
};

// ================ MAIN COMPONENT ================
export default function MetricsGrid({ history }: Props) {
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    [history]
  );

  if (sortedHistory.length === 0) {
    return (
      <div className={`${theme.card.base} p-6`}>
        <h3 className={theme.typography.heading.h3}>Metrics Overview</h3>
        <p style={{ color: theme.colors.text.secondary, marginTop: "1rem" }}>
          No telemetry data available.
        </p>
      </div>
    );
  }

  const latestData = sortedHistory[sortedHistory.length - 1];

  return (
    <div className="space-y-6">
      {/* ========== STATUS OVERVIEW CARDS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* System Status Card */}
        <StatusCard title="System Status">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor:
                  latestData.status === "NORMAL"
                    ? theme.colors.status.good.bg
                    : latestData.status === "WARNING"
                    ? theme.colors.status.warning.bg
                    : theme.colors.status.critical.bg,
                color:
                  latestData.status === "NORMAL"
                    ? theme.colors.status.good.main
                    : latestData.status === "WARNING"
                    ? theme.colors.status.warning.main
                    : theme.colors.status.critical.main,
              }}
            >
              {latestData.status}
            </div>
          </div>
          <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
            Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}
          </p>
        </StatusCard>

        {/* Battery Health Card */}
        <StatusCard title="Battery">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold" 
                    style={{ color: theme.colors.text.primary }}>
                {latestData.battery_level}%
              </span>
              <p className="text-xs mt-1" 
                 style={{ color: theme.colors.text.secondary }}>
                Health: {latestData.battery_health || "N/A"}%
              </p>
            </div>
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{
                  width: `${latestData.battery_level}%`,
                  backgroundColor: latestData.battery_level > 50 
                    ? theme.colors.status.good.main 
                    : latestData.battery_level > 20 
                    ? theme.colors.status.warning.main 
                    : theme.colors.status.critical.main
                }}
              />
            </div>
          </div>
        </StatusCard>

<StatusCard title="Anomaly Detection">
  {/* Main anomaly display */}
  {(() => {
    const isMLAnomaly = latestData.ml_prediction?.is_anomaly || false;
    const mlAnomalyType = latestData.ml_prediction?.anomaly_type;
    const mlConfidence = latestData.ml_prediction?.confidence;
    
    const isRuleAnomaly = latestData.is_anomaly || false;
    const ruleAnomalyType = latestData.anomaly_type;
    const hasDetectedIssues = latestData.detected_issues?.length > 0;
    
    // Show AI anomaly in main card if present
    if (isMLAnomaly && mlAnomalyType) {
      return (
        <div className="mb-4">
          <div className="mt-2 p-3 rounded border" 
              style={{ 
                borderColor: theme.colors.status.critical.main,
                backgroundColor: theme.colors.status.critical.bg + '20'
              }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤖</span>
              <div className="font-medium text-sm" 
                  style={{ color: theme.colors.status.critical.main }}>
                {mlAnomalyType.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="text-xs" 
                style={{ color: theme.colors.text.secondary }}>
              AI Pattern Detected ({(mlConfidence * 100).toFixed(1)}% confidence)
            </div>
          </div>
        </div>
      );
    }
    
    // Show rule anomaly in main card
    if (isRuleAnomaly || hasDetectedIssues) {
      const issues = latestData.detected_issues || [];
      const mainIssue = issues[0]?.message || ruleAnomalyType || "Threshold Alert";
      
      return (
        <div className="mb-4">
          <div className="mt-2 p-3 rounded border" 
              style={{ 
                borderColor: theme.colors.status.warning.main,
                backgroundColor: theme.colors.status.warning.bg + '20'
              }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚡</span>
              <div className="font-medium text-sm" 
                  style={{ color: theme.colors.status.warning.main }}>
                {mainIssue}
              </div>
            </div>
            {issues.length > 0 && (
              <div className="text-xs" 
                  style={{ color: theme.colors.text.secondary }}>
                {issues.length} rule violation{issues.length !== 1 ? 's' : ''} detected
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // No anomalies
    return (
      <div className="mb-4 p-3 rounded border" 
          style={{ 
            borderColor: theme.colors.status.good.main,
            backgroundColor: theme.colors.status.good.bg + '20'
          }}>
        <div className="flex items-center gap-2 justify-center">
          <span className="text-lg">✓</span>
          <div className="font-medium text-sm" 
              style={{ color: theme.colors.status.good.main }}>
            No Anomalies Detected
          </div>
        </div>
        <div className="text-xs mt-1 text-center" 
            style={{ color: theme.colors.text.secondary }}>
          System operating normally
        </div>
      </div>
    );
  })()}

  {/* Detection Sources - SIMPLIFIED */}
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs" 
            style={{ color: theme.colors.text.secondary }}>
        AI Detection:
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${latestData.ml_prediction?.is_anomaly ? 'text-red-500' : 'text-green-500'}`}>
          {latestData.ml_prediction?.is_anomaly ? '🔴' : '🟢'}
        </span>
        <span className="text-xs font-medium">
          {latestData.ml_prediction?.is_anomaly 
            ? `${(latestData.ml_prediction.confidence * 100).toFixed(1)}% confident`
            : "Normal"}
        </span>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <span className="text-xs" 
            style={{ color: theme.colors.text.secondary }}>
        Rule Detection:
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${latestData.detected_issues?.length > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
          {latestData.detected_issues?.length > 0 ? '🟡' : '🟢'}
        </span>
        <span className="text-xs font-medium">
          {latestData.detected_issues?.length > 0 
            ? `${latestData.detected_issues.length} violation${latestData.detected_issues.length !== 1 ? 's' : ''}`
            : "Normal"}
        </span>
      </div>
    </div>
  </div>
</StatusCard>
      </div>

      {/* ========== METRICS GRID ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            config={metric}
            latestValue={latestData[metric.key]}
            history={sortedHistory}
          />
        ))}
      </div>
    </div>
  );
}