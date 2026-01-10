import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { theme } from "../../config/theme";

type BatteryCardProps = { 
  battery: number;
  anomaly?: boolean;
  className?: string;
};

export const BatteryCard = ({ battery, anomaly }: BatteryCardProps) => {
  // Thresholds
  const BATTERY_WARNING = 20;
  const BATTERY_CRITICAL = 10;

  // Determine status & colors
  let statusText = "Normal";
  let statusColor = theme.colors.status.good.main; // green
  let bgColor = theme.colors.status.good.bg;

  if (battery < BATTERY_CRITICAL) {
    statusText = "Critical";
    statusColor = theme.colors.status.critical.main; // red
    bgColor = theme.colors.status.critical.bg;
  } else if (battery < BATTERY_WARNING) {
    statusText = "Warning";
    statusColor = theme.colors.status.warning.main; // yellow/orange
    bgColor = theme.colors.status.warning.bg;
  }

  // Override colors if anomaly is true
  if (anomaly) {
    statusText = "Battery Anomaly";
    statusColor = theme.colors.status.critical.main;
    bgColor = theme.colors.status.critical.bg;
  }

  return (
    <div
      className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center`}
      style={{ backgroundColor: bgColor }}
    >
      <h3 className={`${theme.typography.label} mb-4 flex items-center gap-2`}>
        Battery
        {anomaly && (
          <span className="text-red-600 text-sm font-semibold animate-pulse">⚠️ ANOMALY</span>
        )}
      </h3>
      
      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar
          value={battery}
          text={`${battery}%`}
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
