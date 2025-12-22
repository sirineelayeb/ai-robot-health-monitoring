import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { theme, getStatusColor, getStatusText } from "../../config/theme";

type BatteryCardProps = { battery: number };

export const BatteryCard = ({ battery }: BatteryCardProps) => {
  const statusColor = getStatusColor(battery, { good: 50, warning: 20 });
  const statusText = getStatusText(battery, { good: 50, warning: 20 });

  return (
    <div className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center`}>
      <h3 className={`${theme.typography.label} mb-4`}>Battery</h3>
      
      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar
          value={battery}
          text={`${battery}%`}
          styles={buildStyles({ 
            pathColor: statusColor.main, 
            textColor: theme.colors.text.primary,
            trailColor: theme.colors.border.light,
            textSize: "24px"
          })}
        />
      </div>
      
      <p className={`${theme.typography.caption} mt-4`}>
        {statusText}
      </p>
    </div>
  );
};