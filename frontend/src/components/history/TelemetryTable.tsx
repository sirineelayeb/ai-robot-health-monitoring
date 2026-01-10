import { useMemo } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  Battery, 
  Thermometer, 
  Cpu,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import type { TelemetryData } from "../../types/telemetry";

const PAGE_SIZE = 5;

interface Props {
  history: TelemetryData[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

const getTimestamp = (timestamp: string | Date): Date => {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

const hasAnomaly = (item: TelemetryData): boolean => {
  return item.is_anomaly || item.ml_prediction?.is_anomaly || false;
};

const getAnomalyType = (item: TelemetryData): string | null => {
  return item.anomaly_type || item.ml_prediction?.anomaly_type || null;
};

const getConfidence = (item: TelemetryData): number | null => {
  return item.ml_prediction?.confidence || null;
};

const formatAnomalyType = (type: string): string => {
  return type
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function TelemetryTable({
  history,
  currentPage,
  onPageChange,
}: Props) {
  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => getTimestamp(b.timestamp).getTime() - getTimestamp(a.timestamp).getTime()
      ),
    [history]
  );

  const totalPages = Math.ceil(sortedHistory.length / PAGE_SIZE);
  const paginatedHistory = useMemo(
    () =>
      sortedHistory.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [sortedHistory, currentPage]
  );

  const anomalyCount = useMemo(() => 
    sortedHistory.filter(item => hasAnomaly(item)).length,
    [sortedHistory]
  );

  const formatTime = (timestamp: string | Date): string => {
    const date = getTimestamp(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string | Date): string => {
    const date = getTimestamp(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (history.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Cpu className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Telemetry Data</h3>
        <p className="text-sm text-slate-600">
          No telemetry records available for the selected filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Telemetry Records</h3>
            {anomalyCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 rounded-full">
                <Brain className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  {anomalyCount} Anomal{anomalyCount === 1 ? 'y' : 'ies'}
                </span>
              </div>
            )}
          </div>
          <div className="text-sm text-slate-600 font-medium">
            {sortedHistory.length.toLocaleString()} total records
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Robot
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Battery
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Temp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                CPU Load
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Anomaly Detection
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedHistory.map((item, idx) => {
              const itemHasAnomaly = hasAnomaly(item);
              const anomalyType = getAnomalyType(item);
              const confidence = getConfidence(item);
              
              return (
                <tr
                  key={item._id}
                  className={`hover:bg-slate-50 transition-colors ${
                    itemHasAnomaly ? 'bg-red-50/30 border-l-4 border-l-red-500' : ''
                  }`}
                >
                  {/* Timestamp */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {formatTime(item.timestamp)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </td>

                  {/* Robot ID */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-indigo-600">
                      {item.robot_id}
                    </span>
                  </td>

                  {/* Battery */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${
                        item.battery_level > 50 ? 'text-emerald-600' :
                        item.battery_level > 20 ? 'text-amber-600' :
                        'text-red-600'
                      }`} />
                      <span className="text-sm font-semibold text-slate-900">
                        {item.battery_level.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Temperature */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Thermometer className={`w-4 h-4 ${
                        item.temperature < 60 ? 'text-emerald-600' :
                        item.temperature < 75 ? 'text-amber-600' :
                        'text-red-600'
                      }`} />
                      <span className="text-sm font-semibold text-slate-900">
                        {item.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  </td>

                  {/* CPU Load */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">
                        {item.cpu_load.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {itemHasAnomaly ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 border border-red-200 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs font-semibold text-red-700 uppercase">Critical</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700 uppercase">Normal</span>
                      </div>
                    )}
                  </td>

                  {/* Anomaly Detection */}
                  <td className="px-4 py-3">
                    {itemHasAnomaly ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            {anomalyType ? formatAnomalyType(anomalyType) : 'Detected'}
                          </span>
                        </div>
                        {confidence && (
                          <div className="flex items-center gap-2">
                            <div className="w-full max-w-[120px] bg-slate-200 rounded-full h-1.5">
                              <div 
                                className="bg-red-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {(confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * PAGE_SIZE, sortedHistory.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{sortedHistory.length}</span> records
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}