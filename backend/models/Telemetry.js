import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    // ---------------- Robot identification ----------------
    robot_id: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    // ---------------- Robot sensors ----------------
    battery_level: { type: Number, required: true, min: 0, max: 100 },
    temperature: { type: Number, required: true },       // Motor temperature
    motor_current: { type: Number, required: true },
    cpu_load: { type: Number, required: true, min: 0, max: 100 },
    velocity: { type: Number, required: true, min: 0 },

    // ---------------- Sensor health ----------------
    encoder_ok: { type: Boolean, default: true },
    lidar_ok: { type: Boolean, default: true },
    camera_ok: { type: Boolean, default: true },

    // ---------------- PC metrics ----------------
    pc_cpu_load: { type: Number, required: true, min: 0, max: 100 },
    pc_memory_load: { type: Number, required: true, min: 0, max: 100 },
    pc_disk_usage: { type: Number, required: true, min: 0, max: 100 },
    pc_network_sent: { type: Number, required: true, min: 0 },
    pc_network_recv: { type: Number, required: true, min: 0 },
    pc_temperature: { type: Number, required: true },   // PC/system temperature

    // ---------------- Rule-based status ----------------
    status: {
      type: String,
      enum: ["NORMAL", "WARNING", "CRITICAL"],
      required: true,
      index: true
    },

    is_anomaly: { type: Boolean, default: false, index: true },

 anomaly_type: {
  type: String,
  enum: [
    "MOTOR_OVERHEATING", 
    "BATTERY_DEGRADATION", 
    "ABNORMAL_VELOCITY_SUDDEN_STOP",
    "ABNORMAL_VELOCITY_STUCK_WHEELS",
    "ABNORMAL_VELOCITY_ERRATIC",
    "ABNORMAL_VELOCITY_DRIFT"
  ],
  default: null
}
  },
  { timestamps: true }
);

// Indexes for dashboards & analytics
telemetrySchema.index({ robot_id: 1, timestamp: -1 });
telemetrySchema.index({ is_anomaly: 1, timestamp: -1 });

export default mongoose.model("Telemetry", telemetrySchema);
