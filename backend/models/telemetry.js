import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    // ---------------- Robot identification ----------------
    robot_id: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    // ---------------- Robot sensors (ML FEATURES) ----------------
    battery_level: { type: Number, required: true, min: 0, max: 100 },
    battery_health: { type: Number, required: true, min: 0, max: 100 },
    battery_drop_rate: { type: Number, required: true, min: 0 },
    battery_trend: { type: Number, required: true },

    temperature: { type: Number, required: true }, // motor temp
    motor_current: { type: Number, required: true },
    cpu_load: { type: Number, required: true, min: 0, max: 100 },
    velocity: { type: Number, required: true, min: 0 },

    // ---------------- Sensor health ----------------
    encoder_ok: { type: Boolean, default: true },
    lidar_ok: { type: Boolean, default: true },
    camera_ok: { type: Boolean, default: true },

    // ---------------- PC metrics (visualization only) ----------------
    pc_cpu_load: { type: Number, required: true, min: 0, max: 100 },
    pc_memory_load: { type: Number, required: true, min: 0, max: 100 },
    pc_disk_usage: { type: Number, required: true, min: 0, max: 100 },
    pc_network_sent: { type: Number, required: true, min: 0 },
    pc_network_recv: { type: Number, required: true, min: 0 },
    pc_temperature: { type: Number, required: true },

    // ---------------- Rule-based status (for UI display) ----------------
    status: {
      type: String,
      enum: ["NORMAL", "WARNING", "CRITICAL"],
      default: "NORMAL",
      required: true,
      index: true
    },
    
    // ---------------- Anomaly Detection Results ----------------
    is_anomaly: { 
      type: Boolean, 
      default: false,
      index: true
    },
    
    anomaly_type: {
      type: String,
      enum: [
        // ========== PHYSICAL ROBOT ISSUES ==========
        // Battery-related
        "LOW_BATTERY",           // battery_level low (Rules only)
        "BATTERY_DEGRADATION",   // battery_health low (ML OR Rules)
        
        // Motor/Drive-related  
        "OVERHEATING",           // temperature high (Rules only)
        "MOTOR_OVERHEATING",     // temperature pattern (ML only)
        "HIGH_CURRENT",          // motor_current high (Rules only)
        "ABNORMAL_VELOCITY",     // velocity pattern (ML OR Rules)
        "STALL_DETECTED",        // velocity very low (Rules only)
        
        // Compute-related
        "CPU_OVERLOAD",          // cpu_load high (Rules only)
        
        // Sensor-related
        "SENSOR_FAILURE",        // encoder/lidar/camera failed (Rules only)
        
        // ========== PC/COMPUTER ISSUES ==========
        "PC_CPU_OVERLOAD",       // pc_cpu_load high (Rules only)
        "PC_OVERHEATING",        // pc_temperature high (Rules only)
        "PC_DISK_FULL",          // pc_disk_usage high (Rules only)
        "NETWORK_ISSUE",         // pc_network_sent and pc_network_recv
        
        // ========== GENERIC ==========
        "SYSTEM_ANOMALY",        // Generic/unknown issue
        
        null
      ],
      default: null,
      index: true
    },

    // ---------------- Detailed Issue Tracking ----------------
    detected_issues: [{
      severity: { 
        type: String, 
        enum: ["WARNING", "CRITICAL"],
        required: true 
      },
      message: { 
        type: String, 
        required: true 
      },
      metric: { 
        type: String, 
        required: true 
      },  // e.g., "temperature", "pc_cpu_load", "battery_level"
      value: { 
        type: Number, 
        required: true 
      },
      threshold: { 
        type: Number, 
        required: true 
      },
      detected_at: { 
        type: Date, 
        default: Date.now 
      }
    }],

    // ---------------- ML prediction (AI output) ----------------
    ml_prediction: {
      is_anomaly: { type: Boolean, default: null },
      anomaly_type: {
        type: String,
        enum: ["Normal","MOTOR_OVERHEATING", "BATTERY_DEGRADATION", "ABNORMAL_VELOCITY"],
        default: null,
      },
      confidence: { type: Number, min: 0, max: 1 },
      model_version: { type: String },
      predicted_at: { type: Date },
    }
  },
  { timestamps: true }
);

// ---------------- Indexes for analytics ----------------
telemetrySchema.index({ robot_id: 1, timestamp: -1 });
telemetrySchema.index({ "ml_prediction.is_anomaly": 1, timestamp: -1 });
telemetrySchema.index({ status: 1, timestamp: -1 });
telemetrySchema.index({ is_anomaly: 1, timestamp: -1 });
telemetrySchema.index({ anomaly_type: 1, timestamp: -1 });
telemetrySchema.index({ "detected_issues.severity": 1, timestamp: -1 });

const Telemetry = mongoose.models.Telemetry || mongoose.model("Telemetry", telemetrySchema);

export default Telemetry;

