import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Thermometer } from "lucide-react";
import { theme } from "../../config/theme";

type MotorTempCardProps = { motor_temp_history: number[] };

// Thresholds for temperature status
const TEMP_THRESHOLDS = { good: 0, warning: 75, critical: 90 };

// Helper functions to determine status
const getTempStatus = (val: number) => {
  if (val >= TEMP_THRESHOLDS.critical) return { text: "CRITICAL", color: theme.colors.status.critical };
  if (val >= TEMP_THRESHOLDS.warning) return { text: "WARNING", color: theme.colors.status.warning };
  return { text: "NORMAL", color: theme.colors.status.good };
};

export const MotorTempCard = ({ motor_temp_history }: MotorTempCardProps) => {
  const data = motor_temp_history.map((val, i) => ({ i, val }));
  const latestTemp = motor_temp_history[motor_temp_history.length - 1] || 0;

  const status = getTempStatus(latestTemp);

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Thermometer className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          Motor Temp
        </h3>
        <span
          className="px-2 py-1 text-xs rounded-full font-medium"
          style={{ backgroundColor: status.color.bg, color: status.color.main }}
        >
          {status.text}
        </span>
      </div>

      {/* Latest temperature */}
      <p className={`${theme.typography.value} text-4xl mb-4`}>
        {latestTemp.toFixed(1)}
        <span className="text-2xl" style={{ color: theme.colors.text.secondary }}>°C</span>
      </p>

      {/* Line chart */}
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="val"
              stroke={status.color.main}
              strokeWidth={2}
              dot={false}
            />
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Tooltip
              formatter={(val) => [`${val} °C`, 'Temperature']}
              contentStyle={{
                background: theme.colors.background.card,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                padding: '8px'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-25 flex items-center justify-center text-gray-400">No data</div>
      )}
    </div>
  );
};
