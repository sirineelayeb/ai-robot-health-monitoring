import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TelemetryData } from "../types/telemetry";

type Props = {
  telemetryHistory: TelemetryData[];
};

export const TelemetryChart = ({ telemetryHistory }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={telemetryHistory}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(t) =>
            new Date(typeof t === "string" ? t : t).toLocaleTimeString()
          }
        />
        <YAxis />
        <Tooltip
          labelFormatter={(t) =>
            new Date(typeof t === "string" ? t : t).toLocaleTimeString()
          }
          formatter={(value, name) => [value, name]}
        />
        <Line type="monotone" dataKey="battery" stroke="#34d399" />
        <Line type="monotone" dataKey="cpu_load" stroke="#3b82f6" />
        <Line type="monotone" dataKey="motor_temp" stroke="#f87171" />
      </LineChart>
    </ResponsiveContainer>
  );
};
