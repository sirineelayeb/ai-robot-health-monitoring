import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import { initMQTT } from "./services/mqttService.js";
import processTelemetry from "./services/TelemetryService.js";
const app = express();
const server = http.createServer(app);
import { config } from "./config/index.js";
import { predictAnomaly } from "./services/mlService.js";

const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true,               // allow cookies or Authorization headers
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/ml", mlRoutes);
// Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`Client disconnected: ${socket.id}`));
});

// Initialize MQTT after DB
const startServer = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("MongoDB connected");

  initMQTT({
  onMessage: async (data) => {
    try {
      const telemetry = await processTelemetry(data);
      // const mlPrediction = await predictAnomaly(telemetry);
 io.emit("telemetry", { ...telemetry }); // frontend receives live telemetry + ML
      console.log("Telemetry + ML prediction sent:", { ...telemetry });
      console.log("Saved telemetry:", telemetry);
      
    } catch (err) {
      console.error("Telemetry processing error:", err);
    }
  }
});

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server...");
  io.close(() => {
    mongoose.connection.close(() => process.exit(0));
  });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});
