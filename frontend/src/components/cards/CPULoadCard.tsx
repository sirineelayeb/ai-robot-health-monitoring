import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { theme } from "../../config/theme";

type CPULoadCardProps = { 
  cpu_load: number; 
  anomaly?: boolean; 
};

export const CPULoadCard = ({ cpu_load, anomaly }: CPULoadCardProps) => {
  const CPU_WARNING = 80;
  const CPU_CRITICAL = 95;

  let statusText = "Normal";
  let statusColor = "#16a34a"; // green

  if (cpu_load > CPU_CRITICAL) {
    statusText = "Critical";
    statusColor = "#dc2626"; // red
  } else if (cpu_load > CPU_WARNING) {
    statusText = "Warning";
    statusColor = "#facc15"; // yellow
  }

  return (
    <div className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center ${
      anomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''
    }`}>
      <h3 className={`${theme.typography.label} mb-4`}>CPU Load</h3>

      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar
          value={cpu_load}
          text={`${cpu_load.toFixed(0)}%`}
          styles={buildStyles({ 
            pathColor: anomaly ? '#dc2626' : statusColor, 
            textColor: theme.colors.text.primary,
            trailColor: theme.colors.border.light,
            textSize: "24px"
          })}
        />
      </div>

      <p className={`${theme.typography.caption} mt-4 ${anomaly ? 'text-red-600 font-semibold' : ''}`}>
        {anomaly ? '⚠️ CPU Anomaly Detected' : statusText}
      </p>
    </div>
  );
};
