import type { TelemetryData } from "../../types/telemetry";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: TelemetryData[];
  metric: keyof Pick<
    TelemetryData,
    "anomaly_score" | "battery" | "motor_temp" | "cpu_load" | "velocity"
  >;
  color?: string;
  title?: string;
}

export default function TelemetryChart({
  data,
  metric,
  color = "#3b82f6",
  title,
}: Props) {
  const sortedData = [...data].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const getYAxisDomain = () => {
    if (metric === "anomaly_score") return [0, 1];
    if (metric === "battery" || metric === "cpu_load") return [0, 100];
    return undefined;
  };

  const formatMetricName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-4">
        {title || `${formatMetricName(metric)} Trend`}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={(t) => new Date(t).toLocaleTimeString()}
          />
          <YAxis domain={getYAxisDomain()} />
          <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
          <CartesianGrid strokeDasharray="3 3" />
          <Legend />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={formatMetricName(metric)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}