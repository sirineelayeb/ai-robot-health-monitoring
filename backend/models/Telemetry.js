import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema({
  robot_id: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },

  // Sensor data
  battery: { 
    type: Number, 
    required: true,
    min: 0, 
    max: 100 
  },
  
  motor_temp: { 
    type: Number,
    required: true 
  },
  
  motor_current: { 
    type: Number,
    required: true 
  },
  
  cpu_load: { 
    type: Number,
    required: true, 
    min: 0, 
    max: 100 
  },
  
  velocity: { 
    type: Number,
    required: true 
  },

  // Calculated features
  battery_drop_rate: { 
    type: Number, 
    default: 0 
  },

  // ML anomaly detection fields
  is_anomaly: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  anomaly_type: { 
    type: String, 
    enum: ["normal", "battery", "temperature", "velocity", "cpu", null],
    default: "normal"
  },
  
  anomaly_score: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 1
  },
  
  status: { 
    type: String, 
    enum: ["NORMAL", "WARNING", "CRITICAL"], 
    default: "NORMAL",
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
telemetrySchema.index({ robot_id: 1, timestamp: -1 });
telemetrySchema.index({ is_anomaly: 1, timestamp: -1 });

export default mongoose.model("Telemetry", telemetrySchema);