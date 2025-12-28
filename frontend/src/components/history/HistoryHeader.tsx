import { RefreshCw, Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { theme } from "../../config/theme";

interface Props {
  robotId: string;
  lastUpdated: Date | null;
  isAutoRefresh: boolean;
  filteredCount: number;
  onManualRefresh: () => void;
  onToggleAutoRefresh?: () => void; 
}


export default function HistoryHeader({
  robotId,
  lastUpdated,
  isAutoRefresh,
  filteredCount,
  onManualRefresh,
  onToggleAutoRefresh,
}: Props) {
  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-4">
      {/* Left section: Title + Live Info */}
      <div className="flex flex-col gap-2">
        <h2 className={theme.typography.heading.h2}>
          Telemetry History for {robotId}
        </h2>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Total Records */}
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Total records: {filteredCount}
          </p>

          <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
            •
          </span>

          {/* Live / Paused Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isAutoRefresh ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: isAutoRefresh
                  ? theme.colors.status.good.main
                  : theme.colors.text.primary,
              }}
            />

            <p style={{ color: theme.colors.text.secondary }}>
              {isAutoRefresh ? "Live" : "Paused"} • Updated{" "}
              {formatLastUpdated()}
            </p>
          </div>
        </div>
      </div>

      {/* Right section: Buttons */}
      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
        <Button
          variant="outline"
          onClick={onManualRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Now
        </Button>

        <Button
      variant={isAutoRefresh ? "default" : "outline"}
      onClick={onToggleAutoRefresh} // can be undefined, fine
      className="flex items-center gap-2"
      disabled={!onToggleAutoRefresh} // disable if undefined
    >
      {isAutoRefresh ? (
        <>
          <Pause className="w-4 h-4" />
          Pause Updates
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Resume Updates
        </>
      )}
      </Button>

      </div>
    </div>
  );
}