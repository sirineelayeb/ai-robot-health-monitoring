import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";

type AIWarningsPanelProps = {
  telemetry: TelemetryData | null;
};

export const AIWarningsPanel = ({ telemetry }: AIWarningsPanelProps) => {
  if (!telemetry || !telemetry.is_anomaly) return null;

  // Map anomaly_type to a theme color
 const getAnomalyColor = (type: TelemetryData["anomaly_type"]) => {
  switch (type) {
    case "battery":
      return theme.colors.metrics.battery.main;
    case "temperature":
      return theme.colors.metrics.motorTemp.main;
    // case "motor_current":
    //   return theme.colors.metrics.motorCurrent.main;
    case "cpu":
      return theme.colors.metrics.cpuLoad.main;
    case "velocity":
      return theme.colors.metrics.velocity.main;
    default:
      return theme.colors.status.critical.main; // fallback
  }
};


  // Capitalize string helper
  const capitalize = (s: string | null | undefined) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";

  return (
    <div className={`${theme.card.base} ${theme.card.padding} mt-6`}>
      <h3 className={`${theme.typography.heading.h3} mb-4`}>AI-Predicted Warnings</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-3">Robot</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Anomaly</th>
            <th className="py-2 px-3">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr
            className="transition-all hover:bg-gray-50 rounded-md"
            style={{ backgroundColor: getAnomalyColor(telemetry.anomaly_type) + "20" }} // subtle transparent overlay
          >
            <td className="py-2 px-3 font-medium">{telemetry.robot_id}</td>
            <td className="py-2 px-3">{telemetry.status}</td>
            <td className="py-2 px-3">{capitalize(telemetry.anomaly_type)}</td>
            <td className="py-2 px-3">{telemetry.timestamp.toLocaleTimeString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
