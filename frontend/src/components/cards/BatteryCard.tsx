import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { theme } from "../../config/theme";

type BatteryCardProps = { 
  battery: number;
  anomaly?: boolean;
};

export const BatteryCard = ({ battery, anomaly }: BatteryCardProps) => {
  // Define thresholds consistent with simulator
  const BATTERY_WARNING = 20;
  const BATTERY_CRITICAL = 10;

  let statusText = "Normal";
  let statusColor = "#16a34a"; // green

  if (battery < BATTERY_CRITICAL) {
    statusText = "Critical";
    statusColor = "#dc2626"; // red
  } else if (battery < BATTERY_WARNING) {
    statusText = "Warning";
    statusColor = "#facc15"; // yellow
  }

  return (
    <div className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center ${
      anomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''
    }`}>
      <h3 className={`${theme.typography.label} mb-4`}>
        Battery
        {anomaly && (
          <span className="ml-2 text-red-600 text-sm font-semibold">⚠️ ANOMALY</span>
        )}
      </h3>
      
      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar
          value={battery}
          text={`${battery}%`}
          styles={buildStyles({ 
            pathColor: anomaly ? '#dc2626' : statusColor, 
            textColor: theme.colors.text.primary,
            trailColor: theme.colors.border.light,
            textSize: "24px"
          })}
        />
      </div>
      
      <p className={`${theme.typography.caption} mt-4 ${anomaly ? 'text-red-600 font-semibold' : ''}`}>
        {anomaly ? '⚠️ Battery Anomaly Detected' : statusText}
      </p>
    </div>
  );
};
