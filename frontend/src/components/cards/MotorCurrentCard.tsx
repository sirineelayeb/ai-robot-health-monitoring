import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { theme } from "../../config/theme";

type MotorCurrentCardProps = { motor_current_history: number[] };

// Thresholds
const MOTOR_CURRENT_THRESHOLDS = { good: 5, warning: 9, critical: 11 };

export const MotorCurrentCard = ({ motor_current_history }: MotorCurrentCardProps) => {
  const data = motor_current_history.map((val, i) => ({ i, val }));
  const latestCurrent = motor_current_history[motor_current_history.length - 1] || 0;

  // Determine status
  let status: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
  if (latestCurrent > MOTOR_CURRENT_THRESHOLDS.critical) status = "CRITICAL";
  else if (latestCurrent > MOTOR_CURRENT_THRESHOLDS.warning) status = "WARNING";

  const statusColor = {
    NORMAL: theme.colors.status.good,
    WARNING: theme.colors.status.warning,
    CRITICAL: theme.colors.status.critical,
  }[status]!;

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Activity className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          Motor Current
        </h3>
        <span
          className="px-2 py-1 text-xs rounded-full font-medium"
          style={{ backgroundColor: statusColor.bg, color: statusColor.main }}
        >
          {status}
        </span>
      </div>

      <p className={`${theme.typography.value} text-4xl mb-4`}>
        {latestCurrent.toFixed(2)}
        <span className="text-2xl" style={{ color: theme.colors.text.secondary }}>A</span>
      </p>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <Line type="monotone" dataKey="val" stroke={statusColor.main} strokeWidth={2} dot={false} />
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Tooltip
              formatter={(val) => [`${val} A`, 'Current']}
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
