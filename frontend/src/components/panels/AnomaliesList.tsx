// src/components/panels/AnomaliesList.tsx
import React, { useMemo, useState } from "react";
import type { TelemetryData } from "../../types/telemetry";
import { 
  AlertCircle, 
  AlertTriangle, 
  Brain, 
  ShieldAlert,
  Battery,
  Thermometer,
  Zap,
  Gauge,
  Cpu,
  Eye,
  HardDrive,
  Wifi,
  Server
} from "lucide-react";

interface AnomaliesListProps {
  anomalies: TelemetryData[];
  itemsPerPage?: number;
}

// Define which anomalies are ML-based vs Rule-based
const ML_ANOMALIES = ["MOTOR_OVERHEATING", "BATTERY_DEGRADATION", "ABNORMAL_VELOCITY"];
const RULE_ANOMALIES = [
  "LOW_BATTERY", "OVERHEATING", "HIGH_CURRENT", "STALL_DETECTED",
  "CPU_OVERLOAD", "SENSOR_FAILURE", "PC_CPU_OVERLOAD",
  "PC_OVERHEATING", "PC_DISK_FULL", "NETWORK_ISSUE", "SYSTEM_ANOMALY"
];

export const AnomaliesList: React.FC<AnomaliesListProps> = ({
  anomalies,
  itemsPerPage = 5,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "ai" | "rules">("all");

  const sortedAnomalies = useMemo(() => {
    if (!anomalies) return [];
    return [...anomalies].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [anomalies]);

  // Filter anomalies based on selected filter
  const filteredAnomalies = useMemo(() => {
    if (filter === "ai") {
      return sortedAnomalies.filter(a => a.ml_prediction?.is_anomaly);
    } else if (filter === "rules") {
      return sortedAnomalies.filter(a => a.is_anomaly && !a.ml_prediction?.is_anomaly);
    }
    return sortedAnomalies.filter(a => a.is_anomaly || a.ml_prediction?.is_anomaly);
  }, [sortedAnomalies, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredAnomalies.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAnomalies.slice(startIndex, endIndex);

  // Count by type
  const aiCount = sortedAnomalies.filter(a => a.ml_prediction?.is_anomaly).length;
  const rulesCount = sortedAnomalies.filter(a => a.is_anomaly && !a.ml_prediction?.is_anomaly).length;

  const getAnomalyConfig = (type: string | null, status: string) => {
    const isCritical = status === "CRITICAL";
    
    const configs = {
      // ML Anomalies
      MOTOR_OVERHEATING: {
        icon: Thermometer,
        color: isCritical ? "text-red-600" : "text-orange-600",
        bg: isCritical ? "bg-red-50" : "bg-orange-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
        border: isCritical ? "border-l-red-500" : "border-l-orange-500",
        category: "ai"
      },
      ABNORMAL_VELOCITY: {
        icon: Gauge,
        color: isCritical ? "text-red-600" : "text-purple-600",
        bg: isCritical ? "bg-red-50" : "bg-purple-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700",
        border: isCritical ? "border-l-red-500" : "border-l-purple-500",
        category: "ai"
      },
      BATTERY_DEGRADATION: {
        icon: Battery,
        color: isCritical ? "text-red-600" : "text-amber-600",
        bg: isCritical ? "bg-red-50" : "bg-amber-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
        border: isCritical ? "border-l-red-500" : "border-l-amber-500",
        category: "ai"
      },
      
      // Rule-Based Anomalies
      LOW_BATTERY: {
        icon: Battery,
        color: isCritical ? "text-red-600" : "text-yellow-600",
        bg: isCritical ? "bg-red-50" : "bg-yellow-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700",
        border: isCritical ? "border-l-red-500" : "border-l-yellow-500",
        category: "rules"
      },
      OVERHEATING: {
        icon: Thermometer,
        color: isCritical ? "text-red-600" : "text-red-500",
        bg: isCritical ? "bg-red-50" : "bg-red-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-red-100 text-red-700",
        border: isCritical ? "border-l-red-500" : "border-l-red-500",
        category: "rules"
      },
      HIGH_CURRENT: {
        icon: Zap,
        color: isCritical ? "text-red-600" : "text-blue-600",
        bg: isCritical ? "bg-red-50" : "bg-blue-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700",
        border: isCritical ? "border-l-red-500" : "border-l-blue-500",
        category: "rules"
      },
      STALL_DETECTED: {
        icon: Gauge,
        color: isCritical ? "text-red-600" : "text-gray-600",
        bg: isCritical ? "bg-red-50" : "bg-gray-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700",
        border: isCritical ? "border-l-red-500" : "border-l-gray-500",
        category: "rules"
      },
      CPU_OVERLOAD: {
        icon: Cpu,
        color: isCritical ? "text-red-600" : "text-indigo-600",
        bg: isCritical ? "bg-red-50" : "bg-indigo-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700",
        border: isCritical ? "border-l-red-500" : "border-l-indigo-500",
        category: "rules"
      },
      SENSOR_FAILURE: {
        icon: Eye,
        color: isCritical ? "text-red-600" : "text-pink-600",
        bg: isCritical ? "bg-red-50" : "bg-pink-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-pink-100 text-pink-700",
        border: isCritical ? "border-l-red-500" : "border-l-pink-500",
        category: "rules"
      },
      PC_CPU_OVERLOAD: {
        icon: Server,
        color: isCritical ? "text-red-600" : "text-cyan-600",
        bg: isCritical ? "bg-red-50" : "bg-cyan-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-cyan-100 text-cyan-700",
        border: isCritical ? "border-l-red-500" : "border-l-cyan-500",
        category: "rules"
      },
      PC_OVERHEATING: {
        icon: Thermometer,
        color: isCritical ? "text-red-600" : "text-red-400",
        bg: isCritical ? "bg-red-50" : "bg-red-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-red-100 text-red-400",
        border: isCritical ? "border-l-red-500" : "border-l-red-400",
        category: "rules"
      },
      PC_DISK_FULL: {
        icon: HardDrive,
        color: isCritical ? "text-red-600" : "text-teal-600",
        bg: isCritical ? "bg-red-50" : "bg-teal-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700",
        border: isCritical ? "border-l-red-500" : "border-l-teal-500",
        category: "rules"
      },
      NETWORK_ISSUE: {
        icon: Wifi,
        color: isCritical ? "text-red-600" : "text-green-600",
        bg: isCritical ? "bg-red-50" : "bg-green-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
        border: isCritical ? "border-l-red-500" : "border-l-green-500",
        category: "rules"
      },
      SYSTEM_ANOMALY: {
        icon: AlertTriangle,
        color: isCritical ? "text-red-600" : "text-gray-600",
        bg: isCritical ? "bg-red-50" : "bg-gray-50",
        badge: isCritical ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700",
        border: isCritical ? "border-l-red-500" : "border-l-gray-400",
        category: "rules"
      }
    };

    return configs[type as keyof typeof configs] || {
      icon: AlertTriangle,
      color: "text-gray-600",
      bg: "bg-gray-50",
      badge: "bg-gray-100 text-gray-700",
      border: "border-l-gray-400",
      category: "rules"
    };
  };

  const formatAnomalyType = (type: string | null) => {
    if (!type) return "Unknown Anomaly";
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDisplayValue = (anomaly: TelemetryData, anomalyType: string | null) => {
    if (!anomalyType) return "";
    
    const valueMappings = {
      MOTOR_OVERHEATING: `${anomaly.temperature}°C`,
      BATTERY_DEGRADATION: `${anomaly.battery_level}%`,
      ABNORMAL_VELOCITY: `${anomaly.velocity} m/s`,
      LOW_BATTERY: `${anomaly.battery_level}%`,
      OVERHEATING: `${anomaly.temperature}°C`,
      HIGH_CURRENT: `${anomaly.motor_current}A`,
      STALL_DETECTED: `${anomaly.velocity} m/s`,
      CPU_OVERLOAD: `${anomaly.cpu_load}%`,
      PC_CPU_OVERLOAD: `${anomaly.pc_cpu_load}%`,
      PC_OVERHEATING: `${anomaly.pc_temperature}°C`,
      PC_DISK_FULL: `${anomaly.pc_disk_usage}%`,
      NETWORK_ISSUE: `${Math.round(anomaly.pc_network_recv / 1024 / 1024)}MB/s`,
      SENSOR_FAILURE: "Sensor failed",
      SYSTEM_ANOMALY: "System issue"
    };

    return valueMappings[anomalyType as keyof typeof valueMappings] || "";
  };

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (!anomalies || anomalies.length === 0 || filteredAnomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Alerts</h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No anomalies detected</p>
          <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with Filter */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Anomaly Alerts</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            All ({sortedAnomalies.filter(a => a.is_anomaly || a.ml_prediction?.is_anomaly).length})
          </button>
          <button
            onClick={() => setFilter("ai")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === "ai"
                ? "bg-purple-100 text-purple-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            AI ({aiCount})
          </button>
          <button
            onClick={() => setFilter("rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === "rules"
                ? "bg-orange-100 text-orange-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Rules ({rulesCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {currentItems.map((anomaly) => {
          const hasAI = anomaly.ml_prediction?.is_anomaly;
          const hasRules = anomaly.is_anomaly;
          
          // Determine which anomaly type to display
          let displayAnomalyType = anomaly.anomaly_type;
          if (hasAI && anomaly.ml_prediction?.anomaly_type && anomaly.ml_prediction.anomaly_type !== "Normal") {
            displayAnomalyType = anomaly.ml_prediction.anomaly_type;
          }
          
          const config = getAnomalyConfig(displayAnomalyType, anomaly.status);
          const Icon = config.icon;
          const displayValue = getDisplayValue(anomaly, displayAnomalyType);

          return (
            <div
              key={anomaly._id ?? `${anomaly.robot_id}-${anomaly.timestamp}`}
              className={`p-4 border-l-4 ${config.border} ${config.bg} hover:bg-opacity-80 transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left side */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
                  
                  <div className="flex-1 min-w-0">
                    {/* Detection badges and time */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {/* AI or Rules Badge */}
                      {hasAI && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          <Brain className="w-3 h-3" />
                          AI
                        </span>
                      )}
                      {hasRules && !hasAI && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                          <ShieldAlert className="w-3 h-3" />
                          Rules
                        </span>
                      )}
                      {/* Both detected */}
                      {hasAI && hasRules && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                          Both
                        </span>
                      )}
                      
                      {/* Anomaly type */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badge}`}>
                        {formatAnomalyType(displayAnomalyType)}
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        {formatTime(anomaly.timestamp)}
                      </span>
                    </div>

                    {/* Robot ID and value */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-700 font-medium">{anomaly.robot_id}</span>
                      {displayValue && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className={`font-semibold ${config.color}`}>{displayValue}</span>
                        </>
                      )}
                    </div>

                    {/* Show detected issues if any */}
                    {anomaly.detected_issues && anomaly.detected_issues.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Detected issues:</div>
                        <div className="flex flex-wrap gap-1">
                          {anomaly.detected_issues.slice(0, 3).map((issue, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {issue.message}
                            </span>
                          ))}
                          {anomaly.detected_issues.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{anomaly.detected_issues.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: AI Confidence or Status */}
                <div className="text-right flex-shrink-0">
                  {hasAI && anomaly.ml_prediction?.confidence ? (
                    <>
                      <div className="text-sm font-bold text-purple-600">
                        {(anomaly.ml_prediction.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </>
                  ) : (
                    <>
                      <div className={`text-sm font-bold ${
                        anomaly.status === "CRITICAL" ? "text-red-600" :
                        anomaly.status === "WARNING" ? "text-yellow-600" :
                        "text-green-600"
                      }`}>
                        {anomaly.status}
                      </div>
                      <div className="text-xs text-gray-500">Status</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Showing results info */}
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{startIndex + 1}</span>
              {" - "}
              <span className="font-medium">{Math.min(endIndex, filteredAnomalies.length)}</span>
              {" of "}
              <span className="font-medium">{filteredAnomalies.length}</span>
              {" anomalies"}
            </p>
            
            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  <span className="text-indigo-600">{currentPage}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};