import { useMemo } from "react";
import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";

interface Props {
  history: TelemetryData[];
}

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

export default function StatusChangesTimeline({ history }: Props) {
  const statusChanges = useMemo(() => {
    const changes: Array<{ timestamp: string; from: string; to: string }> = [];
    const sortedHistory = [...history].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (let i = 1; i < sortedHistory.length; i++) {
      if (sortedHistory[i].status !== sortedHistory[i - 1].status) {
        changes.push({
          timestamp: sortedHistory[i].timestamp.toString(),
          from: sortedHistory[i - 1].status,
          to: sortedHistory[i].status,
        });
      }
    }
    return changes;
  }, [history]);

  if (statusChanges.length === 0) return null;

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <h3 className={theme.typography.heading.h3}>
        Status Changes ({statusChanges.length})
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
        {statusChanges.map((change, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-sm p-3 rounded"
            style={{ backgroundColor: theme.colors.background.hover }}
          >
            <span
              className="font-mono text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              {new Date(change.timestamp).toLocaleString()}
            </span>
            <span
              className="px-3 py-1 rounded text-xs font-semibold"
              style={{
                color: getStatusStyles(change.from).text,
                backgroundColor: getStatusStyles(change.from).bg,
                border: `1px solid ${getStatusStyles(change.from).border}`,
              }}
            >
              {change.from}
            </span>
            <span style={{ color: theme.colors.text.primary }}>→</span> 
            <span
              className="px-3 py-1 rounded text-xs font-semibold"
              style={{
                color: getStatusStyles(change.to).text,
                backgroundColor: getStatusStyles(change.to).bg,
                border: `1px solid ${getStatusStyles(change.to).border}`,
              }}
            >
              {change.to}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}