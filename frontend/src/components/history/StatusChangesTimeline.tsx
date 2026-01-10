import { useState } from "react";
import { ArrowRight, Clock, TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle, Filter, BarChart3 } from "lucide-react";
import type { TelemetryData } from "../../types/telemetry";

interface Props {
  history: TelemetryData[];
}

const statusConfig = {
  NORMAL: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  CRITICAL: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

interface StatusChange {
  timestamp: Date;
  from: "NORMAL" | "WARNING" | "CRITICAL";
  to: "NORMAL" | "WARNING" | "CRITICAL";
  duration: number;
}

type FilterType = "all" | "escalations" | "resolutions";

const getSeverityChange = (from: string, to: string) => {
  const severity = { NORMAL: 0, WARNING: 1, CRITICAL: 2 };
  return severity[to as keyof typeof severity] - severity[from as keyof typeof severity];
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const calculateStatusChanges = (history: TelemetryData[]) => {
  const changes: StatusChange[] = [];
  
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
    const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
    return timeA.getTime() - timeB.getTime();
  });

  for (let i = 1; i < sortedHistory.length; i++) {
    if (sortedHistory[i].status !== sortedHistory[i - 1].status) {
      const currentTime = typeof sortedHistory[i].timestamp === 'string' 
        ? new Date(sortedHistory[i].timestamp) 
        : new Date(sortedHistory[i].timestamp);
      
      const previousTime = typeof sortedHistory[i - 1].timestamp === 'string'
        ? new Date(sortedHistory[i - 1].timestamp)
        : new Date(sortedHistory[i - 1].timestamp);
        
      const duration = currentTime.getTime() - previousTime.getTime();
        
      changes.push({
        timestamp: currentTime,
        from: sortedHistory[i - 1].status,
        to: sortedHistory[i].status,
        duration,
      });
    }
  }
  
  return changes.reverse();
};

const calculateStatistics = (changes: StatusChange[]) => {
  const escalations = changes.filter(c => getSeverityChange(c.from, c.to) > 0).length;
  const resolutions = changes.filter(c => getSeverityChange(c.from, c.to) < 0).length;
  
  const transitionCounts: Record<string, number> = {};
  changes.forEach(c => {
    const key = `${c.from}→${c.to}`;
    transitionCounts[key] = (transitionCounts[key] || 0) + 1;
  });
  
  const mostFrequentTransition = Object.entries(transitionCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  const avgDuration = changes.length > 0
    ? changes.reduce((sum, c) => sum + c.duration, 0) / changes.length
    : 0;

  return {
    total: changes.length,
    escalations,
    resolutions,
    mostFrequentTransition,
    avgDuration,
  };
};

export default function StatusChangesTimeline({ history }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const statusChanges = calculateStatusChanges(history);
  const statistics = calculateStatistics(statusChanges);

  const filteredChanges = (() => {
    if (filter === "all") return statusChanges;
    if (filter === "escalations") {
      return statusChanges.filter(c => getSeverityChange(c.from, c.to) > 0);
    }
    return statusChanges.filter(c => getSeverityChange(c.from, c.to) < 0);
  })();

  if (statusChanges.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Status Changes Timeline
        </h3>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No status changes detected</p>
          <p className="text-xs text-slate-500 mt-1">System has maintained stable status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Status Changes Timeline
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {statusChanges.length} {statusChanges.length === 1 ? 'change' : 'changes'}
        </span>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs text-slate-500 mb-1">Total Changes</p>
          <p className="text-lg font-bold text-slate-900">{statistics.total}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Escalations
          </p>
          <p className="text-lg font-bold text-red-600">{statistics.escalations}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Resolutions
          </p>
          <p className="text-lg font-bold text-emerald-600">{statistics.resolutions}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Avg Duration</p>
          <p className="text-lg font-bold text-slate-900">{formatDuration(statistics.avgDuration)}</p>
        </div>
      </div>

      {/* Most Frequent Transition */}
      {statistics.mostFrequentTransition && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-semibold">Most Frequent:</span>
            <span className="font-mono">{statistics.mostFrequentTransition[0]}</span>
            <span className="ml-auto bg-blue-100 px-2 py-0.5 rounded-full font-bold">
              {statistics.mostFrequentTransition[1]}×
            </span>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({statusChanges.length})
          </button>
          <button
            onClick={() => setFilter("escalations")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === "escalations"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Escalations ({statistics.escalations})
          </button>
          <button
            onClick={() => setFilter("resolutions")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === "resolutions"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Resolutions ({statistics.resolutions})
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {filteredChanges.map((change, idx) => {
          const FromIcon = statusConfig[change.from].icon;
          const ToIcon = statusConfig[change.to].icon;
          const severityChange = getSeverityChange(change.from, change.to);
          
          return (
            <div
              key={idx}
              className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {/* Timestamp & Duration */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {formatTimestamp(change.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Duration: <span className="font-semibold text-slate-700">{formatDuration(change.duration)}</span>
                  </span>
                  {severityChange > 0 && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Escalated
                    </span>
                  )}
                  {severityChange < 0 && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Status Change */}
              <div className="flex items-center gap-3">
                {/* From Status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border flex-1 ${statusConfig[change.from].bg} ${statusConfig[change.from].border}`}>
                  <FromIcon className={`w-4 h-4 ${statusConfig[change.from].color}`} />
                  <span className={`text-sm font-semibold ${statusConfig[change.from].color}`}>
                    {change.from}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className={`w-5 h-5 flex-shrink-0 ${
                  severityChange > 0 ? 'text-red-500' : 
                  severityChange < 0 ? 'text-emerald-500' : 
                  'text-slate-400'
                }`} />

                {/* To Status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border flex-1 ${statusConfig[change.to].bg} ${statusConfig[change.to].border}`}>
                  <ToIcon className={`w-4 h-4 ${statusConfig[change.to].color}`} />
                  <span className={`text-sm font-semibold ${statusConfig[change.to].color}`}>
                    {change.to}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredChanges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No changes match this filter</p>
        </div>
      )}
    </div>
  );
}