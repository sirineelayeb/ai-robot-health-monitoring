import { theme } from "../../config/theme";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

type StatusCardProps = {
  status?: "NORMAL" | "WARNING" | "CRITICAL" | string;
};

export const StatusCard = ({ status = "NORMAL" }: StatusCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "NORMAL":
        return { 
          dotColor: "#22c55e",       // green
          textColor: "#065f46",      // dark green
          bgColor: "#dcfce7",        // light green bg
          pulse: "animate-pulse-slow",
          description: "All systems operating normally",
        };
      case "WARNING":
        return { 
          dotColor: "#facc15",       // yellow
          textColor: "#78350f",      // dark orange
          bgColor: "#fef9c3",        // light yellow bg
          pulse: "animate-pulse",
          description: "Minor issues detected, attention required",
        };
      case "CRITICAL":
        return { 
          dotColor: "#ef4444",       // red
          textColor: "#7f1d1d",      // dark red
          bgColor: "#fee2e2",        // light red bg
          pulse: "animate-pulse-fast",
          description: "Critical issues detected! Immediate action required",
        };
      default:
        return { 
          dotColor: theme.colors.primary.medium,
          textColor: theme.colors.text.secondary,
          bgColor: theme.colors.background.hover,
          pulse: "",
          description: "Unknown status",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <h3 className={`${theme.typography.label} mb-4`}>Robot Status</h3>

      <div 
        className={`flex items-center space-x-3 p-4 rounded-xl ${config.pulse}`}
        style={{ backgroundColor: config.bgColor }}
      >
        <div 
          className="w-5 h-5 rounded-full ring-4"
          style={{ 
            backgroundColor: config.dotColor, 
            boxShadow: `0 0 0 4px ${config.dotColor}33` // subtle ring
          }}
        />
        <p className="text-2xl font-semibold capitalize" style={{ color: config.textColor }}>
          {status}
        </p>

        {/* Tooltip */}
     {config.description && (
      <Tooltip>
        <TooltipTrigger>
          <span className="ml-2 text-gray-400 cursor-pointer">?</span>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          {config.description}
        </TooltipContent>
      </Tooltip>
    )}
      </div>
    </div>
  );
};
