import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Thermometer } from "lucide-react";
import { getStatusColor, getStatusText, theme } from "../../config/theme";

type MotorTempCardProps = { motor_temp_history: number[] };

// Simulator thresholds
const TEMP_THRESHOLDS = { good: 0, warning: 75, critical: 90 };

export const MotorTempCard = ({ motor_temp_history }: MotorTempCardProps) => {
  const data = motor_temp_history.map((val, i) => ({ i, val }));
  const latestTemp = motor_temp_history[motor_temp_history.length - 1] || 0;

  const statusColor = getStatusColor(latestTemp, TEMP_THRESHOLDS);
  const statusText = getStatusText(latestTemp, TEMP_THRESHOLDS);

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Thermometer className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          Motor Temp
        </h3>
        <span
          className="px-2 py-1 text-xs rounded-full font-medium"
          style={{ backgroundColor: statusColor.bg, color: statusColor.main }}
        >
          {statusText}
        </span>
      </div>

      <p className={`${theme.typography.value} text-4xl mb-4`}>
        {latestTemp.toFixed(1)}
        <span className="text-2xl" style={{ color: theme.colors.text.secondary }}>°C</span>
      </p>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <Line type="monotone" dataKey="val" stroke={statusColor.main} strokeWidth={2} dot={false} />
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Tooltip
              formatter={(val) => [`${val} °C`, 'Temperature']}
              contentStyle={{
                background: theme.colors.background.card,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-25 flex items-center justify-center">No data</div>
      )}
    </div>
  );
};
