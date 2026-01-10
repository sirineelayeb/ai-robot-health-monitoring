import { RefreshCw, Play, Pause, Activity, Clock, Database, TrendingUp } from "lucide-react";

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
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Left Section */}
        <div className="flex-1 space-y-4">
          {/* Title with Robot Icon */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Telemetry History
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Robot ID: <span className="font-mono font-semibold text-blue-600">{robotId}</span>
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Total Records */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {filteredCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">records</span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAutoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {isAutoRefresh && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                isAutoRefresh ? "text-emerald-600" : "text-slate-600"
              }`}>
                {isAutoRefresh ? "Live Monitoring" : "Paused"}
              </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Updated</span>
              <span className="text-sm font-medium text-slate-700">
                {formatLastUpdated()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          {/* Auto-Refresh Toggle */}
          {onToggleAutoRefresh && (
            <button
              onClick={onToggleAutoRefresh}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
                isAutoRefresh
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  : "bg-white hover:bg-slate-50 border border-slate-300 text-slate-700"
              }`}
            >
              {isAutoRefresh ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}