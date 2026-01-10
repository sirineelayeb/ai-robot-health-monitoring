import { theme } from "../../config/theme";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

type StatusCardProps = {
  status?: "NORMAL" | "WARNING" | "CRITICAL" | string;
  className?: string;
};

export const StatusCard = ({ status = "NORMAL" }: StatusCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "NORMAL":
        return {
          dotColor: theme.colors.status.good.main,
          textColor: theme.colors.status.good.main,
          bgColor: theme.colors.status.good.bg,
          pulse: "animate-pulse-slow",
          description: "All systems operating normally",
        };
      case "WARNING":
        return {
          dotColor: theme.colors.status.warning.main,
          textColor: theme.colors.status.warning.main,
          bgColor: theme.colors.status.warning.bg,
          pulse: "animate-pulse",
          description: "Minor issues detected, attention required",
        };
      case "CRITICAL":
        return {
          dotColor: theme.colors.status.critical.main,
          textColor: theme.colors.status.critical.main,
          bgColor: theme.colors.status.critical.bg,
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
    <div
      className={`
        ${theme.card.base} 
        ${theme.card.padding}
        w-full 
        max-w-full
        overflow-hidden
      `}
    >
      {/* Title (FIXED) */}
      <h3
        className="
          text-sm sm:text-base
          font-semibold
          text-gray-700
          mb-2
          truncate
        "
      >
        Robot Status
      </h3>

      {/* Status Box */}
      <div
        className={`
          flex flex-col sm:flex-row
          items-center
          gap-3
          p-4
          rounded-xl
          transition-all
          ${config.pulse}
        `}
        style={{ backgroundColor: config.bgColor }}
      >
        {/* Dot */}
        <div
          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: config.dotColor,
            boxShadow: `0 0 0 4px ${config.dotColor}33`,
          }}
        />

        {/* Status Text (CLAMPED) */}
        <p
          className="
            text-base sm:text-lg md:text-xl
            font-semibold
            capitalize
            text-center sm:text-left
            break-words
            flex-1
          "
          style={{ color: config.textColor }}
        >
          {status}
        </p>

        {/* Tooltip */}
        {config.description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="
                  text-gray-400
                  text-sm
                  font-bold
                  px-2 py-1
                  rounded
                  hover:bg-gray-100
                "
              >
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">
              {config.description}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
