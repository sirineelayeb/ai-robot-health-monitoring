import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TelemetryData } from "../../types/telemetry";
import { Button } from "../ui/button";
import { theme } from "../../config/theme";

interface Props {
  history: TelemetryData[];
}

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

const getStatusStyles = (status: string) => {
  switch (status) {
    case "NORMAL":
      return { text: theme.colors.status.good.main };
    case "WARNING":
      return { text: theme.colors.status.warning.main };
    case "CRITICAL":
      return { text: theme.colors.status.critical.main };
    default:
      return { text: theme.colors.text.secondary };
  }
};

export default function MetricChart({ history }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<string>("battery");

  if (history.length === 0) {
    return (
      <div className={`${theme.card.base} ${theme.card.padding}`}>
        <h3 className={theme.typography.heading.h3}>Detailed Metric View</h3>
        <p style={{ color: theme.colors.text.secondary, marginTop: "1rem" }}>
          No telemetry data available for metrics.
        </p>
      </div>
    );
  }

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      ),
    [history]
  );

  const statusChanges = useMemo(() => {
    const changes: Array<{ timestamp: string; to: string }> = [];
    for (let i = 1; i < sortedHistory.length; i++) {
      if (sortedHistory[i].status !== sortedHistory[i - 1].status) {
        changes.push({
          timestamp: sortedHistory[i].timestamp.toString(),
          to: sortedHistory[i].status,
        });
      }
    }
    return changes;
  }, [sortedHistory]);

  const selectedMetricConfig = metrics.find((m) => m.key === selectedMetric);

  return (
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
        <LineChart data={sortedHistory}>
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
              return [
                value,
                metrics.find((m) => m.key === name)?.label || name,
              ];
            }}
            contentStyle={{
              backgroundColor: theme.colors.background.card,
              borderColor: theme.colors.border.default,
            }}
          />
          <CartesianGrid stroke={theme.colors.chart.grid} strokeDasharray="5 5" />
          <Legend />
          <Line
            type="monotone"
            dataKey={selectedMetric}
            stroke={selectedMetricConfig?.color}
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
                fill: getStatusStyles(change.to).text,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
