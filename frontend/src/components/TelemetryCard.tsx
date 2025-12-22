import type { TelemetryData } from "../types/telemetry";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type TelemetryCardProps = {
  telemetry: TelemetryData;
  history: Partial<Record<keyof TelemetryData, number[]>>; // historical data for charts
};

export const TelemetryCard = ({ telemetry, history }: TelemetryCardProps) => {
  const metrics = [
    { name: "Battery", value: telemetry.battery, key: "battery", unit: "%" },
    { name: "Motor Temp", value: telemetry.motor_temp, key: "motor_temp", unit: "°C" },
    { name: "CPU Load", value: telemetry.cpu_load, key: "cpu_load", unit: "%" },
    { name: "Velocity", value: telemetry.velocity, key: "velocity", unit: "m/s" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.key}>
          <CardHeader>
            <CardTitle>{metric.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{metric.value}{metric.unit}</p>
         <div style={{ width: "100%", height: 80 }}>
  <ResponsiveContainer>
    <LineChart
      data={(history[metric.key as keyof TelemetryData] || []).map((val, i) => ({ i, val }))}
    >
      <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={false} />
      <XAxis dataKey="i" hide />
      <YAxis hide />
      <Tooltip formatter={(value) => `${value ?? 0}${metric.unit}`} />
    </LineChart>
  </ResponsiveContainer>
</div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
};
