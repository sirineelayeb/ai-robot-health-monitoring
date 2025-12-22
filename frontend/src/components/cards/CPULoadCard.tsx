import { Cpu } from "lucide-react";
import { theme, getStatusColor } from "../../config/theme";

type CPULoadCardProps = { cpu_load: number };

export const CPULoadCard = ({ cpu_load }: CPULoadCardProps) => {
  // Note: For CPU, lower is better, so we invert the thresholds
  const statusColor = getStatusColor(100 - cpu_load, { good: 30, warning: 10 });
  const statusText = cpu_load < 70 ? 'Normal operation' : cpu_load < 90 ? 'High usage' : 'Critical load';

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>
          <Cpu className="w-5 h-5 inline-block mr-2" style={{ color: theme.colors.primary.medium }} />
          CPU Load
        </h3>
      </div>
      
      <p className={`${theme.typography.value} text-4xl mb-4`} style={{ color: statusColor.main }}>
        {cpu_load}%
      </p>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${cpu_load}%`, backgroundColor: statusColor.main }}
        />
      </div>
      
      <p className={`${theme.typography.caption} mt-2`}>
        {statusText}
      </p>
    </div>
  );
};