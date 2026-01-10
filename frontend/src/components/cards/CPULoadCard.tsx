import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { theme } from "../../config/theme";

type CPULoadCardProps = { 
  cpu_load: number; 
  anomaly?: boolean; 
  className?: string;
};

export const CPULoadCard = ({ cpu_load, anomaly }: CPULoadCardProps) => {
  // Thresholds
  const CPU_WARNING = 80;
  const CPU_CRITICAL = 95;

  // Determine status & colors
  let statusText = "Normal";
  let statusColor = theme.colors.status.good.main; // green
  let bgColor = theme.colors.status.good.bg;

  if (cpu_load > CPU_CRITICAL) {
    statusText = "Critical";
    statusColor = theme.colors.status.critical.main; // red
    bgColor = theme.colors.status.critical.bg;
  } else if (cpu_load > CPU_WARNING) {
    statusText = "Warning";
    statusColor = theme.colors.status.warning.main; // yellow/orange
    bgColor = theme.colors.status.warning.bg;
  }

  // Override colors if anomaly
  if (anomaly) {
    statusText = "CPU Anomaly";
    statusColor = theme.colors.status.critical.main;
    bgColor = theme.colors.status.critical.bg;
  }

  return (
    <div
      className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center`}
      style={{ backgroundColor: bgColor }}
    >
      <h3 className={`${theme.typography.label} mb-4 flex items-center gap-2`}>
        CPU Load
        {anomaly && (
          <span className="text-red-600 text-sm font-semibold animate-pulse">⚠️ ANOMALY</span>
        )}
      </h3>

      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar
          value={cpu_load}
          text={`${cpu_load.toFixed(0)}%`}
          styles={buildStyles({
            pathColor: statusColor,
            textColor: theme.colors.text.primary,
            trailColor: theme.colors.border.light,
            textSize: "24px",
            pathTransitionDuration: 0.5,
          })}
        />
      </div>

      <p
        className={`${theme.typography.caption} mt-4 font-semibold`}
        style={{ color: statusColor }}
      >
        {statusText}
      </p>
    </div>
  );
};
