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

// Define the metric keys that exist in TelemetryData
type MetricKey =
  | "battery"
  | "motor_temp"
  | "motor_current"
  | "cpu_load"
  | "velocity"
  | "anomaly_score";

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: "battery", label: "Battery (%)", color: theme.colors.metrics.battery.main },
  { key: "motor_temp", label: "Motor Temp (°C)", color: theme.colors.metrics.motorTemp.main },
  { key: "motor_current", label: "Motor Current (A)", color: theme.colors.metrics.motorCurrent.main },
  { key: "cpu_load", label: "CPU Load (%)", color: theme.colors.metrics.cpuLoad.main },
  { key: "velocity", label: "Velocity (m/s)", color: theme.colors.metrics.velocity.main },
  { key: "anomaly_score", label: "Anomaly Score", color: theme.colors.metrics.anomalyScore.main },
];

export default function MetricsGrid({ history }: Props) {
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    [history]
  );

  if (sortedHistory.length === 0) {
    return (
      <div className={`${theme.card.base} p-4`}>
        <h3 className={theme.typography.heading.h3}>Metrics Overview</h3>
        <p style={{ color: theme.colors.text.secondary, marginTop: "1rem" }}>
          No telemetry data available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        // Latest value safely typed
        const latestValue = sortedHistory[sortedHistory.length - 1][metric.key];

        return (
          <div key={metric.key} className={`${theme.card.base} p-3`}>
            <div className="flex justify-between items-center mb-2">
              <h3
                className="text-sm font-semibold"
                style={{ color: theme.colors.text.label }}
              >
                {metric.label}
              </h3>
              <span
                className="text-sm font-mono"
                style={{ color: theme.colors.text.primary }}
              >
                {latestValue}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={sortedHistory}>
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke={theme.colors.chart.axis} />
                <Tooltip
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  formatter={(value: any) => [value, metric.label]}
                  contentStyle={{
                    backgroundColor: theme.colors.background.card,
                    borderColor: theme.colors.border.default,
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
        );
      })}
    </div>
  );
}
