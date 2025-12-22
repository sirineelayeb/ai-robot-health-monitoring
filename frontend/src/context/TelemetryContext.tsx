import { createContext } from "react";
import type { TelemetryData } from "../types/telemetry";

export interface TelemetryContextType {
  telemetry: TelemetryData | null;
  setTelemetry: (data: TelemetryData) => void;
  selectedRobot: string;
  setSelectedRobot: (robot: string) => void;
}

export const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);