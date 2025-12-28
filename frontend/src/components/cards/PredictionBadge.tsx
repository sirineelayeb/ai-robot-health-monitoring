import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";

type PredictionBadgeProps = {
  telemetry: TelemetryData | null;
};

export const PredictionBadge = ({ telemetry }: PredictionBadgeProps) => {
  if (!telemetry) return null;

  const { status, anomaly_score, anomaly_type, is_anomaly } = telemetry;

  const getStatusStyles = () => {
    switch (status) {
      case "CRITICAL":
        return {
          bg: theme.colors.status.critical.bg,
          text: theme.colors.status.critical.main,
          label: "Critical Risk",
        };

      case "WARNING":
        return {
          bg: theme.colors.status.warning.bg,
          text: theme.colors.status.warning.main,
          label: "Potential Risk",
        };

      case "NORMAL":
      default:
        return {
          bg: theme.colors.status.good.bg,
          text: theme.colors.status.good.main,
          label: "Normal",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`${theme.card.base} ${theme.card.padding} flex items-center justify-between`}
      style={{ backgroundColor: styles.bg }}
    >
      <div>
        <p className={theme.typography.label}>AI Prediction</p>

        <p
          className={`${theme.typography.value} text-xl font-semibold`}
          style={{ color: styles.text }}
        >
          {styles.label}
        </p>

        {is_anomaly && anomaly_type && anomaly_type !== "normal" && (
          <p className={`${theme.typography.caption} mt-1 capitalize`}>
            Anomaly: {anomaly_type}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className={theme.typography.caption}>Anomaly Score</p>
        <p
          className="text-2xl font-bold"
          style={{ color: styles.text }}
        >
          {(anomaly_score * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};
