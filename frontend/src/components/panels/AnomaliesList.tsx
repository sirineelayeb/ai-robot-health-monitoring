import { useState, useMemo } from "react";
import type { TelemetryData } from "../../types/telemetry";
import { theme } from "../../config/theme";
import { Button } from "../ui/button";

const PAGE_SIZE = 10;

type Props = {
  anomalies: TelemetryData[];
};

export const AnomaliesList = ({ anomalies }: Props) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(anomalies.length / PAGE_SIZE);

  const paginatedAnomalies = useMemo(() => {
    return anomalies
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [anomalies, currentPage]);

  if (!anomalies.length) {
    return (
      <div className={`${theme.card.base} ${theme.card.padding}`}>
        <h3 className={theme.typography.heading.h3}>Recent Anomalies</h3>
        <p className="text-gray-500 mt-2">No anomalies detected 🎉</p>
      </div>
    );
  }

  return (
    <div className={`${theme.card.base} ${theme.card.padding} overflow-hidden`}>
      <h3 className={`${theme.typography.heading.h3} p-4 border-b`}>Recent Anomalies</h3>

      <div className="overflow-x-auto">
        <table className="table-auto w-full">
          <thead style={{ backgroundColor: theme.colors.background.hover }}>
            <tr>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Timestamp</th>
              {/* <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Anomaly Type</th> */}
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Anomaly Score</th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text.label }}>Robot ID</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAnomalies.map((a, idx) => (
              <tr
                key={a._id}
                className="transition-colors hover:bg-gray-100"
                style={{
                  backgroundColor: idx % 2 === 0 ? theme.colors.background.card : theme.colors.background.main,
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: theme.colors.text.secondary }}>
                  {new Date(a.timestamp).toLocaleString()}
                </td>
                {/* <td className="px-4 py-3 capitalize" style={{ color: theme.colors.text.primary }}>
                  {a.anomaly_type ?? "unknown"}
                </td> */}
                <td className="px-4 py-3" style={{ color: a.anomaly_score > 0.7 ? theme.colors.status.critical.main : theme.colors.text.primary }}>
                  {(a.anomaly_score * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3" style={{ color: theme.colors.text.secondary }}>
                  {a.robot_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="flex justify-between items-center p-4 border-t"
          style={{
            backgroundColor: theme.colors.background.hover,
            borderColor: theme.colors.border.default,
          }}
        >
          <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, anomalies.length)} of {anomalies.length} anomalies
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="px-4 py-2 text-sm font-medium" style={{ color: theme.colors.text.primary }}>
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
