// components/cards/SensorHealthCard.tsx
import { theme } from "../../config/theme";

export const SensorHealthCard = ({ 
  encoder_ok, 
  lidar_ok, 
  camera_ok 
}: { 
  encoder_ok: boolean; 
  lidar_ok: boolean; 
  camera_ok: boolean; 
}) => {
  const allOk = encoder_ok && lidar_ok && camera_ok;
  
  return (
    <div className={`${theme.card.base} ${theme.card.padding}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={theme.typography.label}>Sensor Health</h3>
        <span 
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            allOk 
              ? 'text-green-700' 
              : 'text-red-700'
          }`}
          style={{
            backgroundColor: allOk 
              ? theme.colors.status.good.bg 
              : theme.colors.status.critical.bg
          }}
        >
          {allOk ? 'All Operational' : 'Issues Detected'}
        </span>
      </div>
      
      <div className="space-y-3">
        <SensorStatus name="Encoder" isOperational={encoder_ok} />
        <SensorStatus name="Lidar" isOperational={lidar_ok} />
        <SensorStatus name="Camera" isOperational={camera_ok} />
      </div>
    </div>
  );
};

const SensorStatus = ({ name, isOperational }: { name: string; isOperational: boolean }) => (
  <div 
    className="flex items-center justify-between p-2 rounded"
    style={{ backgroundColor: theme.colors.background.subtle }}
  >
    <div className="flex items-center gap-2">
      <div 
        className={`w-3 h-3 ${theme.radius.full}`}
        style={{
          backgroundColor: isOperational 
            ? theme.colors.status.good.main 
            : theme.colors.status.critical.main
        }}
      />
      <span 
        className="text-sm font-medium"
        style={{ color: theme.colors.text.label }}
      >
        {name}
      </span>
    </div>
    <span 
      className={`text-xs font-semibold px-2 py-1 ${theme.radius.sm}`}
      style={{
        backgroundColor: isOperational 
          ? theme.colors.status.good.bg 
          : theme.colors.status.critical.bg,
        color: isOperational 
          ? theme.colors.status.good.main 
          : theme.colors.status.critical.main
      }}
    >
      {isOperational ? 'Operational' : 'Not Operational'}
    </span>
  </div>
);