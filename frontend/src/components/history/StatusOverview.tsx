import { useMemo } from "react";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";

interface Props {
  history: TelemetryData[];
}

const getStatusIcon = (status: string) => {
  const iconClass = "w-4 h-4";
  switch (status) {
    case "NORMAL":
      return <CheckCircle className={iconClass} />;
    case "WARNING":
      return <AlertTriangle className={iconClass} />;
    case "CRITICAL":
      return <AlertCircle className={iconClass} />;
    default:
      return null;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "NORMAL":
      return {
        text: theme.colors.status.good.main,
        bg: theme.colors.status.good.bg,
        border: theme.colors.status.good.soft,
      };
    case "WARNING":
      return {
        text: theme.colors.status.warning.main,
        bg: theme.colors.status.warning.bg,
        border: theme.colors.status.warning.soft,
      };
    case "CRITICAL":
      return {
        text: theme.colors.status.critical.main,
        bg: theme.colors.status.critical.bg,
        border: theme.colors.status.critical.soft,
      };
    default:
      return {
        text: theme.colors.text.secondary,
        bg: theme.colors.background.main,
        border: theme.colors.border.default,
      };
  }
};

export default function StatusOverview({ history }: Props) {
  const statusStats = useMemo(() => {
    const stats = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    history.forEach((item) => stats[item.status]++);
    return stats;
  }, [history]);

  const statuses = ["NORMAL", "WARNING", "CRITICAL"] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statuses.map((status) => {
        const styles = getStatusStyles(status);
        const count = statusStats[status];
        const percentage =
          history.length > 0
            ? ((count / history.length) * 100).toFixed(1)
            : "0";

        return (
          <div
            key={status}
            className={`${theme.card.base} ${theme.card.padding}`}
            style={{
              backgroundColor: styles.bg,
              borderColor: styles.border,
            }}
          >
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: styles.text }}
            >
              {getStatusIcon(status)}
              <h3 className="font-semibold">{status}</h3>
            </div>
            <p className="text-2xl font-bold" style={{ color: styles.text }}>
              {count}
            </p>
            <p className="text-sm" style={{ color: styles.text }}>
              {percentage}% of time
            </p>
          </div>
        );
      })}
    </div>
  );
}