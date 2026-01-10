// components/cards/SensorHealthCard.tsx
import { theme } from "../../config/theme";

type SensorHealthCardProps = {
  encoder_ok: boolean;
  lidar_ok: boolean;
  camera_ok: boolean;
  className?: string;
};

export const SensorHealthCard = ({ encoder_ok, lidar_ok, camera_ok }: SensorHealthCardProps) => {
  const allOk = encoder_ok && lidar_ok && camera_ok;

  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>Sensor Health</h3>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full`}
          style={{
            backgroundColor: allOk ? theme.colors.status.good.bg : theme.colors.status.critical.bg,
            color: allOk ? theme.colors.status.good.main : theme.colors.status.critical.main,
          }}
        >
          {allOk ? 'All Operational' : 'Issues Detected'}
        </span>
      </div>

      {/* Individual sensor statuses */}
      <div className="space-y-3">
        <SensorStatus name="Encoder" isOperational={encoder_ok} />
        <SensorStatus name="Lidar" isOperational={lidar_ok} />
        <SensorStatus name="Camera" isOperational={camera_ok} />
      </div>
    </div>
  );
};

type SensorStatusProps = {
  name: string;
  isOperational: boolean;
};

const SensorStatus = ({ name, isOperational }: SensorStatusProps) => {
  const statusColor = isOperational ? theme.colors.status.good : theme.colors.status.critical;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-md hover:shadow-sm transition"
      style={{ backgroundColor: theme.colors.background.subtle }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 ${theme.radius.full}`}
          style={{ backgroundColor: statusColor.main }}
        />
        <span className="text-sm font-medium" style={{ color: theme.colors.text.label }}>
          {name}
        </span>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full`}
        style={{ backgroundColor: statusColor.bg, color: statusColor.main }}
      >
        {isOperational ? 'Operational' : 'Not Operational'}
      </span>
    </div>
  );
};
