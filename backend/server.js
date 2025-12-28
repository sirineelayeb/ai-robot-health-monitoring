import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initMQTT } from "./services/mqttService.js";
import { processTelemetry } from "./services/TelemetryService.js";
import { config } from "./config/index.js";
import logger from "./utils/logger.js";

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl || "http://localhost:5173",
    credentials: true
  }
});
app.set("io", io);

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: config.frontendUrl || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { query: req.query, body: req.body });
  next();
});

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/telemetry", telemetryRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Robot Telemetry Monitoring API",
    version: "1.0.0",
    endpoints: { auth: "/api/auth", telemetry: "/api/telemetry", health: "/health" }
  });
});

// ==================== SOCKET.IO ====================
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.emit("connected", { message: "Connected to telemetry server", socketId: socket.id, timestamp: new Date().toISOString() });

  socket.on("subscribe", (robotId) => {
    socket.join(`robot_${robotId}`);
    logger.debug(`Client ${socket.id} subscribed to robot_${robotId}`);
  });

  socket.on("unsubscribe", (robotId) => {
    socket.leave(`robot_${robotId}`);
    logger.debug(`Client ${socket.id} unsubscribed from robot_${robotId}`);
  });

  socket.on("disconnect", (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// ==================== MQTT ====================
initMQTT({
onMessage: async (data) => {
  try {
    const result = await processTelemetry(data);
    const telemetry = result.telemetry;

    // ✅ Build telemetryData using telemetry, not telemetryData
    const telemetryData = {
      robot_id: telemetry.robot_id,
      timestamp: telemetry.timestamp,
      battery_level: telemetry.battery_level,
      motor_current: telemetry.motor_current,
      cpu_load: telemetry.cpu_load,
      temperature: telemetry.temperature,
      velocity: telemetry.velocity,
      encoder_ok: telemetry.encoder_ok,
      lidar_ok: telemetry.lidar_ok,
      camera_ok: telemetry.camera_ok,
      pc_cpu_load: telemetry.pc_cpu_load,
      pc_memory_load: telemetry.pc_memory_load,
      pc_disk_usage: telemetry.pc_disk_usage,
      pc_network_sent: telemetry.pc_network_sent,
      pc_network_recv: telemetry.pc_network_recv,
      pc_temperature: telemetry.pc_temperature,
      is_anomaly: telemetry.is_anomaly,
      status: telemetry.status,
      detection_method: result.detection_method
    };

    io.emit("telemetry", telemetryData);
    io.to(`robot_${telemetry.robot_id}`).emit("robot_telemetry", telemetryData);

      // LOG ALL STATUSES - CHANGED THIS SECTION
      const statusEmoji = {
        'CRITICAL': '🚨',
        'WARNING': '⚠️',
        'NORMAL': '✅'
      };

      logger.info(`${telemetry.status} | Bat:${telemetry.battery_level}% Temp:${telemetry.temperature}°C CPU:${telemetry.cpu_load}% Motor:${telemetry.motor_current}A | E:${telemetry.encoder_ok} L:${telemetry.lidar_ok} C:${telemetry.camera_ok}`);

      // Still emit alerts for anomalies
      if (telemetry.is_anomaly) {
        io.emit("anomaly_alert", {
          robot_id: telemetry.robot_id,
          timestamp: telemetry.timestamp,
          status: telemetry.status,
          detection_method: result.detection_method,
          data: telemetryData
        });
      }
      
   } catch (err) {
    logger.error("Telemetry processing error:", err);
    io.emit("telemetry_error", { 
      message: "Failed to process telemetry", 
      error: err.message, 
      timestamp: new Date().toISOString() 
    });
  }
  },

  onConnect: () => logger.info("MQTT broker connected"),
  onError: (error) => logger.error("MQTT error:", error)
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error", ...(config.env === "development" && { stack: err.stack }) });
});

// ==================== SERVER START ====================
const startServer = async () => {
  try {
    await mongoose.connect(config.mongoURI, { serverSelectionTimeoutMS: 5000 });
    logger.info("MongoDB connected successfully");

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env || 'development'}`);
    });
  } catch (err) {
    logger.error("Startup error:", err);
    process.exit(1);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    logger.info("HTTP server closed");
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => { logger.error("Uncaught Exception:", err); gracefulShutdown("UNCAUGHT_EXCEPTION"); });
process.on("unhandledRejection", (reason, promise) => { logger.error("Unhandled Rejection at:", promise, "reason:", reason); gracefulShutdown("UNHANDLED_REJECTION"); });

startServer();
export default app;
