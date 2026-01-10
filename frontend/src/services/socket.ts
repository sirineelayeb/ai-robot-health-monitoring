import { io, Socket } from "socket.io-client";
import type { TelemetryData } from "../types/telemetry";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log("🔧 Socket Config:", {
  BACKEND_URL,
  env: import.meta.env.MODE
});

// Singleton socket instance
let socket: Socket | null = null;

// Initialize WebSocket - SIMPLIFIED VERSION
export const initSocket = (): Socket => {
  if (socket) {
    console.log("♻️ Returning existing socket instance");
    return socket;
  }
  
  console.log("🔌 Creating NEW socket connection to:", BACKEND_URL);
  
  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  // Debug events
  socket.on("connect", () => {
    console.log("✅ Socket CONNECTED! ID:", socket?.id);
  });
  
  socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket DISCONNECTED, reason:", reason);
  });
  
  socket.on("connect_error", (err) => {
    console.error("❌ Socket CONNECTION ERROR:", err.message);
  });
  
  socket.on("error", (err) => {
    console.error("❌ Socket ERROR:", err);
  });

  // Listen for all server events for debugging
  socket.onAny((eventName, ...args) => {
    if (!['pong'].includes(eventName)) { // Filter out noisy events
      console.log(`📡 [${eventName}]`, args[0] || 'no data');
    }
  });

  return socket;
};

// Get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Simple callback management
const telemetryCallbacks = new Set<(data: TelemetryData) => void>();
const anomalyCallbacks = new Set<(data: TelemetryData) => void>();

export const subscribeTelemetry = (callback: (data: TelemetryData) => void) => {
  console.log("🔔 Adding telemetry callback");
  
  // Get or create socket
  const s = initSocket();
  
  // Add callback to set
  telemetryCallbacks.add(callback);
  
  // Set up listener if not already set
  const existingListener = (s as any)._telemetryListener;
  if (!existingListener) {
    console.log("🎧 Setting up telemetry listener on socket");
    const listener = (data: TelemetryData) => {
      console.log("📡 Raw telemetry from socket:", data);
      telemetryCallbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error("Error in telemetry callback:", err);
        }
      });
    };
    s.on("telemetry", listener);
    (s as any)._telemetryListener = listener;
  }
  
  return () => {
    console.log("🔕 Removing telemetry callback");
    telemetryCallbacks.delete(callback);
  };
};

export const subscribeAnomalies = (callback: (data: TelemetryData) => void) => {
  console.log("🔔 Adding anomaly callback");
  
  // Get or create socket
  const s = initSocket();
  
  // Add callback to set
  anomalyCallbacks.add(callback);
  
  // Set up listener if not already set
  const existingListener = (s as any)._anomalyListener;
  if (!existingListener) {
    console.log("🎧 Setting up anomaly listener on socket");
    const listener = (data: TelemetryData) => {
      console.log("🚨 Raw anomaly from socket:", data);
      anomalyCallbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error("Error in anomaly callback:", err);
        }
      });
    };
    s.on("anomaly_alert", listener);
    (s as any)._anomalyListener = listener;
  }
  
  return () => {
    console.log("🔕 Removing anomaly callback");
    anomalyCallbacks.delete(callback);
  };
};

// Helper to subscribe to robot
export const subscribeToRobot = (robotId: string) => {
  const s = getSocket();
  if (s && s.connected) {
    console.log(`🤖 Subscribing to robot: ${robotId}`);
    s.emit("subscribe", robotId);
  } else {
    console.log(`⏳ Socket not connected, cannot subscribe to ${robotId}`);
  }
};

// Helper to unsubscribe from robot
export const unsubscribeFromRobot = (robotId: string) => {
  const s = getSocket();
  if (s && s.connected) {
    console.log(`🤖 Unsubscribing from robot: ${robotId}`);
    s.emit("unsubscribe", robotId);
  }
};