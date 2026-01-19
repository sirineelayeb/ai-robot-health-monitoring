import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config/index.js";
import logger from "./utils/logger.js";

// ==================== SERVICE IMPORTS ====================
import { initMQTT } from "./services/mqttService.js";
import { processTelemetry } from "./services/telemetryService.js";

// ==================== ROUTE IMPORTS ====================
import telemetryRoutes from "./routes/telemetryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; 
import engineerRoutes from "./routes/engineerRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import alertsRoutes from "./routes/alertRoutes.js";
// ==================== UTILITY IMPORTS ====================
import initializeSingleAdmin from "./utils/initializeAdmin.js";

// ==================== EXPRESS & SOCKET.IO SETUP ====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: config.frontendUrl || "http://localhost:5173", 
    credentials: true 
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set("io", io);

// ==================== MIDDLEWARE ====================
app.use(cors({ 
  origin: config.frontendUrl || "http://localhost:5173", 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { 
    query: req.query, 
    body: req.body 
  });
  next();
});

// ==================== API ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/engineer", engineerRoutes); 
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/alerts", alertsRoutes); 

// ==================== HEALTH & INFO ENDPOINTS ====================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    connectedClients: io.engine.clientsCount
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Robot Telemetry Monitoring API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      engineer: "/api/engineer",
      telemetry: "/api/telemetry",
      ml: "/api/ml",
      alerts: "/api/alerts",
      health: "/health"
    }
  });
});

// ==================== SOCKET.IO HANDLERS ====================

io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Send connection confirmation
  socket.emit("connected", { 
    message: "Connected to telemetry server", 
    socketId: socket.id, 
    timestamp: new Date().toISOString() 
  });

  // Join room for specific robot
  socket.on("join", (room) => {
    if (room && typeof room === "string") {
      socket.join(room);
      logger.debug(`Client ${socket.id} joined room: ${room}`);
      socket.emit("joined", { room, success: true });
    }
  });

  // Leave room
  socket.on("leave", (room) => {
    if (room && typeof room === "string") {
      socket.leave(room);
      logger.debug(`Client ${socket.id} left room: ${room}`);
    }
  });

  // Subscribe to robot updates
  socket.on("subscribe", (robotId) => {
    if (robotId) {
      const room = `robot_${robotId}`;
      socket.join(room);
      logger.debug(`Client ${socket.id} subscribed to robot: ${robotId}`);
      socket.emit("subscribed", { robotId, room, success: true });
    }
  });

  // Unsubscribe from robot updates
  socket.on("unsubscribe", (robotId) => {
    if (robotId) {
      const room = `robot_${robotId}`;
      socket.leave(room);
      logger.debug(`Client ${socket.id} unsubscribed from robot: ${robotId}`);
    }
  });

  // Ping/pong for connection check
  socket.on("ping", (data) => {
    socket.emit("pong", { ...data, timestamp: new Date().toISOString() });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Handle errors
  socket.on("error", (error) => {
    logger.error(`Socket error from ${socket.id}:`, error);
  });
});

// ==================== MQTT MESSAGE HANDLER ====================

initMQTT({
  onMessage: async (data) => {
    try {
      const telemetry = await processTelemetry(data, io);

      if (!telemetry || !telemetry._id) {
        logger.warn("Telemetry processing returned null or invalid data");
        return;
      }

      // Convert to plain object if needed
      const telemetryData = telemetry.toObject ? telemetry.toObject() : telemetry;
      const robotRoom = `robot_${telemetryData.robot_id}`;

      // Prepare data for Socket.IO
      const socketData = {
        _id: telemetryData._id,
        robot_id: telemetryData.robot_id,
        timestamp: telemetryData.timestamp,
        
        // Robot sensors
        battery_level: telemetryData.battery_level,
        battery_health: telemetryData.battery_health,
        battery_drop_rate: telemetryData.battery_drop_rate,
        battery_trend: telemetryData.battery_trend,
        temperature: telemetryData.temperature,
        motor_current: telemetryData.motor_current,
        cpu_load: telemetryData.cpu_load,
        velocity: telemetryData.velocity,
        
        // Sensor health
        encoder_ok: telemetryData.encoder_ok,
        lidar_ok: telemetryData.lidar_ok,
        camera_ok: telemetryData.camera_ok,
        
        // PC metrics
        pc_cpu_load: telemetryData.pc_cpu_load,
        pc_memory_load: telemetryData.pc_memory_load,
        pc_disk_usage: telemetryData.pc_disk_usage,
        pc_network_sent: telemetryData.pc_network_sent,
        pc_network_recv: telemetryData.pc_network_recv,
        pc_temperature: telemetryData.pc_temperature,
        
        // Anomaly detection results
        status: telemetryData.status,
        is_anomaly: telemetryData.is_anomaly || false,
        anomaly_type: telemetryData.anomaly_type || null,
        detected_issues: telemetryData.detected_issues || [],
        ml_prediction: telemetryData.ml_prediction || null,
      };

      // Emit telemetry to all clients and specific room
      io.emit("telemetry", socketData);
      io.to(robotRoom).emit("telemetry", socketData);
      io.to(robotRoom).emit("robot_update", socketData);

      // Emit threshold alerts if issues detected
      if (telemetryData.detected_issues && telemetryData.detected_issues.length > 0) {
        const alertData = {
          robot_id: telemetryData.robot_id,
          issues: telemetryData.detected_issues,
          severity: telemetryData.status,
          anomaly_type: telemetryData.anomaly_type,
          is_anomaly: telemetryData.is_anomaly,
          telemetry_id: telemetryData._id,
          timestamp: telemetryData.timestamp,
          metrics: {
            battery_level: telemetryData.battery_level,
            temperature: telemetryData.temperature,
            cpu_load: telemetryData.cpu_load,
            velocity: telemetryData.velocity,
            motor_current: telemetryData.motor_current,
            pc_cpu_load: telemetryData.pc_cpu_load,
            pc_disk_usage: telemetryData.pc_disk_usage,
            pc_temperature: telemetryData.pc_temperature
          }
        };
        
        io.to(robotRoom).emit("threshold_alert", alertData);
        io.emit("threshold_alert", alertData);
        
        if (telemetryData.status === "CRITICAL" || telemetryData.is_anomaly) {
          logger.warn(
            `${telemetryData.robot_id} ALERT: ${telemetryData.detected_issues.length} issues detected | ` +
            `Type: ${telemetryData.anomaly_type || 'None'} | ` +
            `ML: ${telemetryData.ml_prediction?.is_anomaly ? 'YES' : 'NO'}`
          );
        }
      }

      // Emit ML anomaly alerts
      if (telemetryData.ml_prediction?.is_anomaly) {
        const mlAlertData = {
          ...socketData,
          ml_confidence: telemetryData.ml_prediction.confidence,
          ml_anomaly_type: telemetryData.ml_prediction.anomaly_type
        };
        
        io.to(robotRoom).emit("ml_anomaly_alert", mlAlertData);
        io.emit("ml_anomaly_alert", mlAlertData);
        
        logger.warn(
          `🤖 ML ANOMALY: ${telemetryData.robot_id} | ${telemetryData.ml_prediction.anomaly_type} ` +
          `(${(telemetryData.ml_prediction.confidence * 100).toFixed(0)}%)`
        );
      }
      if (config.env === "development") {
        logger.debug(
          `[MQTT->Socket] ${telemetryData.robot_id} | ` +
          `Status:${telemetryData.status} | ` +
          `Anomaly:${telemetryData.is_anomaly} | ` +
          `ML:${telemetryData.ml_prediction?.is_anomaly ? 'YES' : 'NO'}`
        );
      }

    } catch (err) {
      logger.error("Telemetry processing error:", err.message);
      io.emit("telemetry_error", {
        message: "Failed to process telemetry",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  onConnect: () => logger.info("  MQTT broker connected"),
  onError: (err) => logger.error("  MQTT error:", err)
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(config.env === "development" && { stack: err.stack })
  });
});

// ==================== HELPER FUNCTIONS ====================

export const emitToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
};

export const emitToAll = (event, data) => {
  io.emit(event, data);
};

export const getConnectedClients = () => {
  return io.engine.clientsCount;
};

// ==================== SERVER STARTUP ====================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, { 
      serverSelectionTimeoutMS: 5000 
    });
    logger.info("  MongoDB connected");
    
    // Initialize default thresholds
    // await thresholdService.initializeDefaultThresholds();
    // logger.info("  Default thresholds initialized");
    
    // Initialize admin user
    await initializeSingleAdmin();
    logger.info("  Admin user initialized");
    
    // Start HTTP server
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(" Robot Telemetry Monitoring Server is running!");
      logger.info(`Port:        ${config.port}`);
      logger.info(`Environment: ${config.env || "development"}`);
      logger.info(`MongoDB:     Connected`);
      logger.info(`Socket.IO:   Ready`);
      logger.info(`Clients:     ${getConnectedClients()}`);
      logger.info("API Endpoints:");
      logger.info("  • Auth:      /api/auth");
      logger.info("  • Admin:     /api/admin");
      logger.info("  • Engineer:  /api/engineer");
      logger.info("  • Telemetry: /api/telemetry");
      logger.info("  • ML:        /api/ml");
      logger.info("  • Alerts:    /api/alerts");
      logger.info("  • Health:    /health");
    });

  } catch (err) {
    logger.error("  Startup error:", err);
    process.exit(1);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("HTTP server closed");
    }

    await mongoose.connection.close();
    logger.info("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    logger.error("Graceful shutdown error:", err);
    process.exit(1);
  }
};


// ==================== PROCESS EVENT HANDLERS ====================

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => { 
  logger.error("Uncaught Exception:", err); 
  gracefulShutdown("UNCAUGHT_EXCEPTION"); 
});

process.on("unhandledRejection", async (err) => {
  console.error("UNHANDLED_REJECTION:", err);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("HTTP server closed");
    }

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (shutdownErr) {
    console.error("Shutdown error:", shutdownErr);
  } finally {
    process.exit(1);
  }
});


// ==================== START SERVER ====================

startServer();

export default app;