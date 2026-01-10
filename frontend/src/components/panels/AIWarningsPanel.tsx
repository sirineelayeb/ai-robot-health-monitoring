import React, { useState, useMemo } from "react";
import type { TelemetryData } from "../../types/telemetry";
import { 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  Thermometer,
  Battery,
  Gauge,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

interface Props {
  telemetryList: TelemetryData[];
  showHeader?: boolean;
  itemsPerPage?: number;
}

export const AIWarningsPanel: React.FC<Props> = ({ 
  telemetryList, 
  showHeader = true,
  itemsPerPage = 5
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "motor" | "battery" | "velocity">("all");

  // Only show ML-predicted anomalies
  const mlAnomalies = useMemo(() => {
    return telemetryList.filter((t) => t.ml_prediction?.is_anomaly === true);
  }, [telemetryList]);

  // Apply filter
  const filteredAnomalies = useMemo(() => {
    if (filter === "all") return mlAnomalies;
    
    return mlAnomalies.filter(anomaly => {
      const anomalyType = anomaly.ml_prediction?.anomaly_type;
      switch (filter) {
        case "motor": return anomalyType === "MOTOR_OVERHEATING";
        case "battery": return anomalyType === "BATTERY_DEGRADATION";
        case "velocity": return anomalyType === "ABNORMAL_VELOCITY";
        default: return true;
      }
    });
  }, [mlAnomalies, filter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAnomalies.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAnomalies.slice(startIndex, endIndex);

  // Count by type
  const anomalyCounts = useMemo(() => {
    return {
      all: mlAnomalies.length,
      motor: mlAnomalies.filter(a => a.ml_prediction?.anomaly_type === "MOTOR_OVERHEATING").length,
      battery: mlAnomalies.filter(a => a.ml_prediction?.anomaly_type === "BATTERY_DEGRADATION").length,
      velocity: mlAnomalies.filter(a => a.ml_prediction?.anomaly_type === "ABNORMAL_VELOCITY").length,
    };
  }, [mlAnomalies]);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (mlAnomalies.length === 0) {
    return (
      <div className={`${showHeader ? "bg-white rounded-xl border border-slate-200 p-6 shadow-sm" : ""}`}>
        {showHeader && (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              AI Anomaly Detection
            </h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No AI Anomalies Detected</p>
          <p className="text-xs text-slate-500">
            {telemetryList.length > 0 
              ? `AI analyzed ${telemetryList.length} records - all normal`
              : 'Waiting for telemetry data'
            }
          </p>
        </div>
      </div>
    );
  }

  // Get icon and color for each anomaly type
  const getAnomalyConfig = (type: string) => {
    switch (type) {
      case "MOTOR_OVERHEATING":
        return {
          icon: Thermometer,
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
          title: "Motor Overheating"
        };
      case "BATTERY_DEGRADATION":
        return {
          icon: Battery,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          title: "Battery Degradation"
        };
      case "ABNORMAL_VELOCITY":
        return {
          icon: Gauge,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          title: "Abnormal Velocity"
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
          title: type.replace(/_/g, " ")
        };
    }
  };

  // Get value to display for each anomaly type
  const getDisplayValue = (anomaly: TelemetryData, type: string) => {
    switch (type) {
      case "MOTOR_OVERHEATING":
        return `${anomaly.temperature}°C`;
      case "BATTERY_DEGRADATION":
        return `${anomaly.battery_level}% (Health: ${anomaly.battery_health}%)`;
      case "ABNORMAL_VELOCITY":
        return `${anomaly.velocity} m/s`;
      default:
        return "";
    }
  };

  // Format time
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${showHeader ? "bg-white rounded-xl border border-slate-200 p-6 shadow-sm" : ""}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                AI Anomaly Detection
              </h3>
              <p className="text-sm text-slate-500">XGBoost Model v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold bg-purple-100 text-purple-700">
              <Activity className="w-3.5 h-3.5" />
              {mlAnomalies.length} total
            </span>
            <span className="text-sm text-slate-600 hidden sm:inline">
              Page {safePage} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${
            filter === "all"
              ? "bg-blue-100 text-blue-700 border border-blue-200 font-medium"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Filter className="w-4 h-4" />
          All ({anomalyCounts.all})
        </button>
        <button
          onClick={() => setFilter("motor")}
          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${
            filter === "motor"
              ? "bg-orange-100 text-orange-700 border border-orange-200 font-medium"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Thermometer className="w-4 h-4" />
          Motor ({anomalyCounts.motor})
        </button>
        <button
          onClick={() => setFilter("battery")}
          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${
            filter === "battery"
              ? "bg-amber-100 text-amber-700 border border-amber-200 font-medium"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Battery className="w-4 h-4" />
          Battery ({anomalyCounts.battery})
        </button>
        <button
          onClick={() => setFilter("velocity")}
          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${
            filter === "velocity"
              ? "bg-blue-100 text-blue-700 border border-blue-200 font-medium"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Gauge className="w-4 h-4" />
          Velocity ({anomalyCounts.velocity})
        </button>
      </div>

      {/* Anomalies List */}
      {currentItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
            <Filter className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No matching anomalies</p>
          <p className="text-xs text-slate-500">
            Try a different filter or check back later
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {currentItems.map((anomaly) => {
              const mlData = anomaly.ml_prediction!;
              const anomalyType = mlData.anomaly_type || "UNKNOWN_ANOMALY";
              const config = getAnomalyConfig(anomalyType);
              const Icon = config.icon;
              const displayValue = getDisplayValue(anomaly, anomalyType);
              const confidence = mlData.confidence || 0;

              return (
                <div 
                  key={anomaly._id} 
                  className={`p-4 rounded-lg border ${config.border} ${config.bg} hover:shadow-sm transition-all`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Anomaly Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            {config.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-slate-700">{anomaly.robot_id}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">
                              {formatTime(anomaly.timestamp)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full">
                              v{mlData.model_version}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Value */}
                      {displayValue && (
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <span className="text-slate-600">Current:</span>
                          <span className={`font-semibold ${config.color}`}>
                            {displayValue}
                          </span>
                        </div>
                      )}

                      {/* AI Detection Info */}
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-purple-500" />
                          <span>XGBoost detected</span>
                        </div>
                        {anomaly.motor_current !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{anomaly.motor_current.toFixed(1)}A</span>
                            <span className="text-slate-500">current</span>
                          </div>
                        )}
                        {anomaly.cpu_load !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{anomaly.cpu_load.toFixed(0)}%</span>
                            <span className="text-slate-500">CPU</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Confidence */}
                    <div className="flex-shrink-0 text-right">
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-slate-900">
                          {(confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-500">Confidence</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <BarChart3 className="w-3 h-3" />
                        <span>Model score</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              {/* Showing results info */}
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium">{startIndex + 1}</span>
                {" - "}
                <span className="font-medium">{Math.min(endIndex, filteredAnomalies.length)}</span>
                {" of "}
                <span className="font-medium">{filteredAnomalies.length}</span>
                {" AI detections"}
                {filter !== "all" && ` • Filter: ${filter}`}
              </p>
              
              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                
                {/* Page indicator */}
                <div className="flex items-center px-4 py-2 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    <span className="text-blue-600">{safePage}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span>{totalPages}</span>
                  </span>
                </div>
                
                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          )}

          {/* Simple Footer */}
          {filteredAnomalies.length > itemsPerPage && (
            <div className="mt-4 text-center text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {filteredAnomalies.length} AI anomalies • XGBoost model • Real-time updates
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};