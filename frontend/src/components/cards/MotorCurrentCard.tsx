import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { theme } from "../../config/theme";

type MotorCurrentCardProps = { motor_current_history: number[] };

// Thresholds for motor current
const MOTOR_CURRENT_THRESHOLDS = { good: 5, warning: 9, critical: 11 };

// Helper function to determine status
const getCurrentStatus = (val: number) => {
  if (val >= MOTOR_CURRENT_THRESHOLDS.critical) return { text: "CRITICAL", color: theme.colors.status.critical };
  if (val >= MOTOR_CURRENT_THRESHOLDS.warning) return { text: "WARNING", color: theme.colors.status.warning };
  return { text: "NORMAL", color: theme.colors.status.good };
};

export const MotorCurrentCard = ({ motor_current_history }: MotorCurrentCardProps) => {
  const data = motor_current_history.map((val, i) => ({ i, val }));
  const latestCurrent = motor_current_history[motor_current_history.length - 1] || 0;

  const status = getCurrentStatus(latestCurrent);

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Activity className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          Motor Current
        </h3>
        <span
          className="px-2 py-1 text-xs rounded-full font-medium"
          style={{ backgroundColor: status.color.bg, color: status.color.main }}
        >
          {status.text}
        </span>
      </div>

      {/* Latest current */}
      <p className={`${theme.typography.value} text-4xl mb-4`}>
        {latestCurrent.toFixed(2)}
        <span className="text-2xl" style={{ color: theme.colors.text.secondary }}>A</span>
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
              formatter={(val) => [`${val} A`, 'Current']}
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
