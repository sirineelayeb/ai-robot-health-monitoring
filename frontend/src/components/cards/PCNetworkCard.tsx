// components/cards/PCNetworkCard.tsx
import React from "react";

type PCNetworkCardProps = {
  network_sent: number;
  network_recv: number;
  className?: string; // optional, allows custom styling
};

export const PCNetworkCard: React.FC<PCNetworkCardProps> = ({
  network_sent,
  network_recv,
  className = "",
}) => {
  // Helper to format bytes nicely
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (Math.round((bytes / Math.pow(k, i)) * 100) / 100).toLocaleString() + " " + sizes[i];
  };

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-3">PC Network</h3>
      
      <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400">Sent</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{formatBytes(network_sent)}</p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400">Received</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatBytes(network_recv)}</p>
        </div>
      </div>
    </div>
  );
};
