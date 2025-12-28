import type { TelemetryStats } from "../../types/telemetry";
import { theme, getStatusColor } from "../../config/theme";
import { AlertTriangle, Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Helper: return color based on how recent the last anomaly is
const getAnomalyTimeStatus = (lastAnomalyTime: string | null) => {
  if (!lastAnomalyTime) return { main: "#10b981", bg: "#ecfdf5" }; // green = no anomaly

  const minutesAgo = (Date.now() - new Date(lastAnomalyTime).getTime()) / 1000 / 60;

  if (minutesAgo <= 10) return { main: "#ef4444", bg: "#fee2e2" }; // <10min → critical
  if (minutesAgo <= 60) return { main: "#f59e0b", bg: "#fef3c7" }; // <1h → warning
  return { main: "#10b981", bg: "#ecfdf5" }; // >1h → good
};

type StatsCardProps = {
  stats: TelemetryStats | null;
};

export const StatsCard = ({ stats }: StatsCardProps) => {
  if (!stats) return null;

  const { lastAnomalyTime, totalAnomalies, anomalyPercentage } = stats;

  // Status for anomaly rate
  const anomalyStatus = getStatusColor(anomalyPercentage ?? 0, { good: 25, warning: 50 });
  // Status for last anomaly time
  const anomalyTimeStatus = getAnomalyTimeStatus(lastAnomalyTime);

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <h3 className={`${theme.typography.label} mb-6`}>
        Robot Health Overview
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">

        {/* Last Anomaly Time */}
        <div
          className="rounded-lg p-4 flex flex-col items-center justify-center"
          style={{ backgroundColor: anomalyTimeStatus.bg }}
        >
          <Clock className="mb-2 h-6 w-6" style={{ color: anomalyTimeStatus.main }} />
          <p className={theme.typography.caption}>Last Anomaly</p>
          <p
            className={theme.typography.value}
            style={{ color: anomalyTimeStatus.main }}
          >
            {lastAnomalyTime
              ? formatDistanceToNow(new Date(lastAnomalyTime), { addSuffix: true })
              : "No anomalies"}
          </p>
        </div>

        {/* Total Anomalies */}
        <div className="rounded-lg bg-amber-50 p-4 flex flex-col items-center justify-center">
          <AlertTriangle className="mb-2 h-6 w-6 text-amber-500" />
          <p className={theme.typography.caption}>Total Anomalies</p>
          <p
            className={theme.typography.value}
            style={{ color: theme.colors.status.warning.main }}
          >
            {(totalAnomalies ?? 0).toLocaleString()} {/* ✅ ADD ?? 0 FALLBACK */}
          </p>
        </div>

        {/* Anomaly Rate */}
        <div
          className="rounded-lg p-4 flex flex-col items-center justify-center"
          style={{ backgroundColor: anomalyStatus.bg }}
        >
          <Activity
            className="mb-2 h-6 w-6"
            style={{ color: anomalyStatus.main }}
          />
          <p className={theme.typography.caption}>Anomaly Rate</p>
          <p
            className={`${theme.typography.value} text-3xl`}
            style={{ color: anomalyStatus.main }}
          >
            {(anomalyPercentage ?? 0).toFixed(1)}% {/* ✅ ADD ?? 0 FALLBACK */}
          </p>
        </div>

      </div>
    </div>
  );
};