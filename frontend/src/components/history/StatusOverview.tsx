import { useMemo } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Activity } from "lucide-react";
import type { TelemetryData } from "../../types/telemetry";

interface Props {
  history: TelemetryData[];
}

const statusConfig = {
  NORMAL: {
    icon: CheckCircle,
    label: "Normal",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  WARNING: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
  },
  CRITICAL: {
    icon: AlertCircle,
    label: "Critical",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
  },
};

export default function StatusOverview({ history }: Props) {
  const statusStats = useMemo(() => {
    const stats = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    history.forEach((item) => stats[item.status]++);
    return stats;
  }, [history]);

  const totalRecords = history.length;

  if (totalRecords === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
        <Activity className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 text-sm">No telemetry data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Activity className="w-4 h-4 text-indigo-600" />
        Status Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = statusStats[status];
          const percentage = ((count / totalRecords) * 100).toFixed(1);

          return (
            <div
              key={status}
              className={`
                rounded-lg border p-5 transition-all hover:shadow-md
                ${config.bg} ${config.border}
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${config.iconBg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <h4 className={`font-semibold ${config.color}`}>
                  {config.label}
                </h4>
              </div>

              <p className={`text-3xl font-bold mb-1 ${config.color}`}>
                {count.toLocaleString()}
              </p>
              
              <p className="text-sm text-slate-600">
                {percentage}% of total
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}