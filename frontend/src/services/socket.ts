import { io, Socket } from "socket.io-client";
import type { TelemetryData } from "../types/telemetry";

const BACKEND_URL = import.meta.env.VITE_API_URL;
let socket: Socket | null = null;

// Initialize WebSocket
const initSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL);

    socket.on("connect", () => console.log("✅ Connected to backend via WebSocket"));
    socket.on("disconnect", () => console.log("⚠️ Disconnected from WebSocket"));
    socket.on("error", (err) => console.error("❌ WebSocket error:", err));
  }
};

// Subscribe to telemetry updates
export const subscribeTelemetry = (callback: (data: TelemetryData) => void) => {
  initSocket();
  if (!socket) return () => {};

  // Debug: log all telemetry messages
  socket.on("telemetry", (data: TelemetryData) => {
    console.log("📡 Telemetry received:", data);
    callback(data);
  });

  // Cleanup
  return () => {
    socket?.off("telemetry", callback); // keep the original callback off
  };
};

