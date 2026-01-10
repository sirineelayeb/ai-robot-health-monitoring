import { useEffect } from "react";
import { Calendar, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (value: string) => void;
  hasData?: boolean; // Optional: pass this to show warning
  availableDates?: string[]; // Optional: list of dates with data
}

export default function DateFilter({ 
  selectedDate, 
  onDateChange,
  hasData = true,
  availableDates = []
}: Props) {
  // Check if selected date has data
  const isDateAvailable = !selectedDate || 
    availableDates.length === 0 || 
    availableDates.includes(selectedDate);

  // Show toast when no data for selected date
  useEffect(() => {
    if (selectedDate && !hasData) {
      toast.warning("No data available for this date", {
        description: "Try selecting a different date or reset to view all data",
        duration: 4000,
        action: {
          label: "Reset",
          onClick: () => onDateChange(""),
        },
      });
    }
  }, [selectedDate, hasData, onDateChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Filter by Date:
        </label>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={`border rounded-lg px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 transition-all ${
              selectedDate && !isDateAvailable
                ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            placeholder="Select date"
          />
        </div>

        {selectedDate && (
          <button
            onClick={() => onDateChange("")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Warning when no data for selected date */}
      {selectedDate && !hasData && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">No data available for this date</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Try selecting a different date or reset to view all data
            </p>
          </div>
          <button
            onClick={() => onDateChange("")}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            View all
          </button>
        </div>
      )}

      {/* Info when date is not in available range */}
      {selectedDate && !isDateAvailable && availableDates.length > 0 && hasData && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-blue-800">
            Limited data for this date. Available data ranges from{' '}
            <span className="font-semibold">
              {availableDates[0]}
            </span>
            {' '}to{' '}
            <span className="font-semibold">
              {availableDates[availableDates.length - 1]}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}