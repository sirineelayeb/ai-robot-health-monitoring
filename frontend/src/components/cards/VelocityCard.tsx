import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Gauge } from "lucide-react";
import { theme } from "../../config/theme";

type VelocityCardProps = { velocity_history: number[] };

export const VelocityCard = ({ velocity_history }: VelocityCardProps) => {
  const data = velocity_history.map((val, i) => ({ i, val }));
  const latestVelocity = velocity_history[velocity_history.length - 1] || 0;

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Gauge className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          Velocity
        </h3>
      </div>
      
      <p className={`${theme.typography.value} text-4xl mb-4`}>
        {latestVelocity.toFixed(1)}
        <span className="text-2xl" style={{ color: theme.colors.text.secondary }}>m/s</span>
      </p>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="val" 
              stroke={theme.colors.chart.line} 
              strokeWidth={2} 
              dot={false} 
            />
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Tooltip 
              formatter={(val) => [`${val} m/s`, 'Velocity']}
              contentStyle={{ 
                background: theme.colors.background.card, 
                border: `1px solid ${theme.colors.border.default}`, 
                borderRadius: '8px' 
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-25 flex items-center justify-center">
          No data
        </div>
      )}
    </div>
  );
};