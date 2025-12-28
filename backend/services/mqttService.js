import mqtt from "mqtt";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";

let mqttClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let hasLoggedError = false;

export const initMQTT = ({ onMessage, onConnect, onError }) => {
  mqttClient = mqtt.connect(config.mqttBroker, {
    clientId: config.mqttClientId,
    reconnectPeriod: config.mqttReconnectPeriod,
    clean: true
  });

  mqttClient.on("connect", () => {
    reconnectAttempts = 0;
    hasLoggedError = false;
    logger.info(`✅ MQTT connected to broker: ${config.mqttBroker}`);

    mqttClient.subscribe(config.mqttTopic, (err) => {
      if (err) {
        logger.error("❌ MQTT subscription error:", err.message);
        onError?.(err);
      } else {
        logger.info(`📡 Subscribed to topic: ${config.mqttTopic}`);
        onConnect?.();
      }
    });
  });

  mqttClient.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.debug(`📩 MQTT message on ${topic}`, data);
      onMessage(data);
    } catch (err) {
      logger.error("❌ MQTT parse error:", err.message);
    }
  });

  mqttClient.on("error", (err) => {
    reconnectAttempts++;
    if (!hasLoggedError) {
      logger.error(`❌ MQTT broker not available at ${config.mqttBroker}`);
      hasLoggedError = true;
      onError?.(err);
    }
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) mqttClient.end(true);
  });

  // Silent reconnect/close events
  mqttClient.on("reconnect", () => {});
  mqttClient.on("close", () => {});

  return mqttClient;
};

export const publishTelemetry = (topic, data) => {
  if (!mqttClient?.connected) return logger.error("❌ MQTT client not connected");

  mqttClient.publish(topic, JSON.stringify(data), { qos: 1 }, (err) => {
    if (err) logger.error("❌ MQTT publish error:", err.message);
    else logger.debug(`📤 Published to ${topic}:`, data);
  });
};

export const closeMQTT = () => {
  mqttClient?.end();
  logger.info("MQTT connection closed");
};
