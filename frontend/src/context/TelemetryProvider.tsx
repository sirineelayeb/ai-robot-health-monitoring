import { useState, type ReactNode } from "react";
import type { TelemetryData } from "../types/telemetry";
import { TelemetryContext } from "./TelemetryContext";

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<string>("robot_001");

  return (
    <TelemetryContext.Provider value={{ telemetry, setTelemetry, selectedRobot, setSelectedRobot }}>
      {children}
    </TelemetryContext.Provider>
  );
  
};
