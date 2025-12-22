import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "supersecret",

  mqttBroker: process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
  mqttTopic: process.env.MQTT_TOPIC || "robot/telemetry",
};
