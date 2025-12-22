import mqtt from "mqtt";
import { config } from "../config/index.js";

export const initMQTT = ({ onMessage }) => {
  const client = mqtt.connect(config.mqttBroker, { clientId: "backend_subscriber", reconnectPeriod: 1000 });

  client.on("connect", () => {
    console.log("✅ MQTT connected");

    client.subscribe(config.mqttTopic, (err) => {
      if (err) console.error("❌ MQTT subscription error:", err.message);
      else console.log(`📡 Subscribed to topic: ${config.mqttTopic}`);
    });
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      onMessage(data);
    } catch (err) {
      console.error("❌ MQTT parse error:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("❌ MQTT connection error:", err.message);
    client.end();
  });
};
