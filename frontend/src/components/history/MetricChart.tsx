import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
}

const metrics: MetricConfig[] = [
  {
    key: "battery_level",
    label: "Battery Level",
    color: theme.colors.metrics.battery.main,
    unit: "%",
  },
  {
    key: "battery_health",
    label: "Battery Health",
    color: theme.colors.status.good.main,
    unit: "%",
  },
  {
    key: "temperature",
    label: "Motor Temperature",
    color: theme.colors.metrics.motorTemp.main,
    unit: "°C",
  },
  {
    key: "motor_current",
    label: "Motor Current",
    color: theme.colors.metrics.motorCurrent.main,
    unit: "A",
  },
  {
    key: "cpu_load",
    label: "Robot CPU Load",
    color: theme.colors.metrics.cpuLoad.main,
    unit: "%",
  },
  {
    key: "velocity",
    label: "Velocity",
    color: theme.colors.metrics.velocity.main,
    unit: "m/s",
  },
  {
    key: "pc_cpu_load",
    label: "PC CPU Load",
    color: theme.colors.chart.tertiary,
    unit: "%",
  },
  {
    key: "pc_memory_load",
    label: "PC Memory Load",
    color: theme.colors.chart.secondary,
    unit: "%",
  },
  {
    key: "pc_temperature",
    label: "PC Temperature",
    color: theme.colors.metrics.pcTemperature.main,
    unit: "°C",
  },
];

export default function MetricChart({ history }: Props) {
  // ✅ ALL HOOKS FIRST - before any returns
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("battery_level");

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    [history]
  );

  const chartData = useMemo(() => {
    return sortedHistory.filter(item => {
      const value = item[selectedMetric];
      return value !== undefined && value !== null && !isNaN(Number(value));
    });
  }, [sortedHistory, selectedMetric]);

  // ✅ NOW we can do conditional returns - AFTER all hooks
  const selectedMetricConfig = metrics.find((m) => m.key === selectedMetric);
  const hasData = chartData.length > 0;
  const isEmpty = sortedHistory.length === 0;

  if (isEmpty) {
    return (
      <div className={`${theme.card.base} ${theme.card.padding}`}>
        <h3 className={theme.typography.heading.h3}>Metric Chart</h3>
        <p style={{ color: theme.colors.text.secondary, marginTop: "1rem" }}>
          No telemetry data available.
        </p>
      </div>
    );
  }

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="mb-4">
        <h3 className={theme.typography.heading.h3}>Metric Chart</h3>
      </div>

      {/* Metric selector buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            className="px-3 py-1.5 rounded text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedMetric === metric.key ? metric.color : theme.colors.neutral[100],
              color: selectedMetric === metric.key ? theme.colors.text.inverted : theme.colors.text.primary,
              border: `1px solid ${selectedMetric === metric.key ? metric.color : theme.colors.border.default}`,
            }}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* No data message */}
      {!hasData && (
        <div className="flex items-center justify-center h-64 border rounded" style={{ borderColor: theme.colors.border.default }}>
          <p style={{ color: theme.colors.text.secondary }}>
            No data available for {selectedMetricConfig?.label}
          </p>
        </div>
      )}

      {/* Chart */}
      {hasData && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke={theme.colors.chart.grid} strokeDasharray="5 5" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke={theme.colors.chart.axis}
            />
            <YAxis 
              stroke={theme.colors.chart.axis}
              label={{ 
                value: selectedMetricConfig?.unit, 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: theme.colors.text.secondary }
              }}
            />
            <Tooltip
              labelFormatter={(t) => new Date(t).toLocaleString()}
              formatter={(value: any) => [
                `${typeof value === "number" ? value.toFixed(2) : value}${selectedMetricConfig?.unit}`,
                selectedMetricConfig?.label
              ]}
              contentStyle={{
                backgroundColor: theme.colors.background.card,
                borderColor: theme.colors.border.default,
                borderRadius: "8px",
              }}
            />
            
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={selectedMetricConfig?.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}