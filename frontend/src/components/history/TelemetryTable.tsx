import { useMemo } from "react";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { TelemetryData } from "../../types/telemetry";
import { Button } from "../ui/button";
import { theme } from "../../config/theme";

const PAGE_SIZE = 10;

interface Props {
  history: TelemetryData[]; // already filtered if needed
  currentPage: number;
  onPageChange: (page: number) => void;
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

export default function TelemetryTable({
  history,
  currentPage,
  onPageChange,
}: Props) {
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [history]
  );

  const totalPages = Math.ceil(sortedHistory.length / PAGE_SIZE);

  const paginatedHistory = useMemo(
    () => sortedHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedHistory, currentPage]
  );
    if (history.length === 0) {
    return (
      <div className={`${theme.card.base} p-4`}>
        <h3 className={theme.typography.heading.h3}>Detailed Records</h3>
        <p style={{ color: theme.colors.text.secondary, marginTop: "1rem" }}>
          No telemetry records available.
        </p>
      </div>
    );
  }

  return (
    <div className={`${theme.card.base} overflow-hidden`}>
      <h3 className={`${theme.typography.heading.h3} p-4 border-b`} style={{ backgroundColor: theme.colors.background.hover, borderColor: theme.colors.border.default }}>
        Detailed Records
      </h3>

      <div className="overflow-x-auto">
        <table className="table-auto w-full">
          <thead style={{ backgroundColor: theme.colors.background.hover }}>
            <tr>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Timestamp</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Status</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Battery</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Motor Temp</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Motor Current</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>CPU Load</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Velocity</th>
              <th className="px-4 py-3 text-center" style={{ color: theme.colors.text.label }}>Anomaly</th>
            </tr>
          </thead>

          <tbody>
            {paginatedHistory.map((item, idx) => (
              <tr
                key={item._id}
                className="transition-colors hover:bg-gray-100"
                style={{
                  borderTop: `1px solid ${theme.colors.border.light}`,
                  backgroundColor: idx % 2 === 0 ? theme.colors.background.card : theme.colors.background.main,
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: theme.colors.text.secondary }}>
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center justify-center gap-1 px-2 py-1 rounded-full mx-auto w-fit"
                    style={{
                      color: getStatusStyles(item.status).text,
                      backgroundColor: getStatusStyles(item.status).bg,
                      border: `1px solid ${getStatusStyles(item.status).border}`,
                    }}
                  >
                    {getStatusIcon(item.status)}
                    <span className="text-xs font-semibold">{item.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.battery}%</td>
                <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.motor_temp}°C</td>
                <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.motor_current}A</td>
                <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.cpu_load}%</td>
                <td className="px-4 py-3 text-center" style={{ color: theme.colors.text.primary }}>{item.velocity} m/s</td>
                <td className="px-4 py-3 text-center">
                  <span
                    style={{
                      color: item.anomaly_score > 0.7 ? theme.colors.status.critical.main : theme.colors.text.primary,
                      fontWeight: item.anomaly_score > 0.7 ? 600 : 400,
                    }}
                  >
                    {(item.anomaly_score * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t" style={{ backgroundColor: theme.colors.background.hover, borderColor: theme.colors.border.default }}>
        <div className="text-sm mb-2 sm:mb-0" style={{ color: theme.colors.text.secondary }}>
          Displaying {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedHistory.length)} of {sortedHistory.length} records
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1 text-sm">Previous</Button>

          <span className="px-3 py-1 text-sm font-medium rounded" style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background.card }}>
            Page {currentPage} of {totalPages}
          </span>

          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1 text-sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
