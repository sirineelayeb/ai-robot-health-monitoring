import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
from dataclasses import dataclass, field
import psutil
from collections import deque

# ==================== CONFIGURATION ====================
class Config:
    BROKER = "mqtt"
    PORT = 1883
    TOPIC = "robot/telemetry"
    ROBOT_ID = "robot_001"
    PUBLISH_INTERVAL = 2  # seconds
    ANOMALY_PROBABILITY = 0.4  # 40% chance to start anomaly
    MAX_ANOMALIES = 5          # maximum number of anomalies to generate

# ==================== ROBOT STATE ====================
@dataclass
class RobotState:
    battery_level: float = 95.0
    battery_health: float = 100.0
    temperature: float = 45.0
    motor_current: float = 4.5
    cpu_load: float = 35.0
    velocity: float = 1.2

    encoder_ok: bool = True
    lidar_ok: bool = True
    camera_ok: bool = True
    is_charging: bool = False

    cycle_count: int = 0
    anomaly_cooldown: int = 0
    degradation_mode: str = None
    degradation_progress: int = 0
    anomalies_generated: int = 0
    anomaly_intensity: float = 1.0  # Controls how severe anomalies are

    battery_history: deque = field(default_factory=lambda: deque(maxlen=10))
    prev_battery_level: float = 95.0
    battery_drop_rate: float = 0.0
    battery_trend: float = 0.0

# ==================== MQTT CLIENT ====================
class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"{Config.ROBOT_ID}_simulator")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.connected = False

    def _on_connect(self, client, userdata, flags, rc, properties):
        print(f"DEBUG: on_connect called with rc={rc}")
        self.connected = (rc == 0)
        if rc == 0:
            print("*** Connected to MQTT Broker ***")
        else:
            print(f"!!! MQTT Connection Failed with code {rc} !!!")

    def _on_disconnect(self, client, userdata, rc, properties):
        print(f"DEBUG: on_disconnect called with rc={rc}")
        self.connected = False

    def connect(self):
        try:
            print(f"DEBUG: Attempting to connect to {Config.BROKER}:{Config.PORT}")
            self.client.connect(Config.BROKER, Config.PORT, 60)
            self.client.loop_start()
            # Wait longer for connection
            for i in range(10):
                if self.connected:
                    print(f"DEBUG: Connected after {i+1} attempts")
                    break
                time.sleep(0.5)
            print(f"DEBUG: Final connection status: {self.connected}")
        except Exception as e:
            print(f"!!! Failed to connect to MQTT: {e} !!!")
            self.connected = False

    def publish(self, payload: dict):
        if self.connected:
            try:
                self.client.publish(Config.TOPIC, json.dumps(payload), qos=1)
                return True
            except Exception as e:
                print(f"!!! Failed to publish: {e} !!!")
                return False
        else:
            print("! MQTT not connected, skipping publish!")
            return False

    def disconnect(self):
        self.client.loop_stop()
        if self.connected:
            self.client.disconnect()

# ==================== TELEMETRY GENERATOR ====================
class TelemetryGenerator:
    def __init__(self, state: RobotState):
        self.state = state
        print("\n" + "="*60)
        print("ROBOT TELEMETRY SIMULATOR (ANOMALY TEST MODE)")
        print("="*60)
        print("Anomalies will be VERY pronounced for ML detection")
        print("Press Ctrl+C to stop")
        print("="*60)

    def _simulate_battery(self):
        if self.state.is_charging:
            self.state.battery_level = min(self.state.battery_level + random.uniform(0.5, 1.0), 100)
            if self.state.battery_level >= 98:
                self.state.is_charging = False
        else:
            drain = random.uniform(0.1, 0.3) + self.state.motor_current / 20 + self.state.velocity * 0.05
            drain *= (100 / max(self.state.battery_health, 30))  # Faster drain with degraded battery
            self.state.battery_level = max(self.state.battery_level - drain, 0)
            if self.state.battery_level <= 20:
                self.state.is_charging = True

        self.state.battery_history.append(self.state.battery_level)
        self.state.battery_drop_rate = max(round(self.state.prev_battery_level - self.state.battery_level, 2), 0)
        if len(self.state.battery_history) >= 2:
            self.state.battery_trend = round(self.state.battery_history[-1] - self.state.battery_history[0], 2)
        else:
            self.state.battery_trend = 0.0
        self.state.prev_battery_level = self.state.battery_level
        return round(self.state.battery_level, 2)

    def _simulate_temperature(self):
        ambient = 25
        target = ambient + self.state.motor_current * 3.5 + self.state.cpu_load * 0.15
        
        # If overheating anomaly, increase target significantly
        if self.state.degradation_mode == "MOTOR_OVERHEATING":
            target += self.state.degradation_progress * 10
            
        self.state.temperature += (target - self.state.temperature) * 0.15
        return round(self.state.temperature, 2)

    def _simulate_motor(self):
        base = 3.0
        load = self.state.velocity * 1.8
        if self.state.temperature > 70:
            load += (self.state.temperature - 70) * 0.1
            
        if self.state.degradation_mode == "MOTOR_OVERHEATING":
            load += self.state.degradation_progress * 1.5
            
        self.state.motor_current = base + load + random.uniform(-0.2, 0.3)
        return round(self.state.motor_current, 2)

    def _simulate_velocity(self):
        if self.state.cycle_count % 20 < 15:
            target = random.uniform(1.0, 2.2)
        else:
            target = random.uniform(0, 0.5)
            
        if self.state.degradation_mode == "ABNORMAL_VELOCITY":
            if self.state.cycle_count % 10 < 7:
                target = random.uniform(3.5, 5.0)
            else:
                target = random.uniform(0, 0.2)
                
        self.state.velocity += (target - self.state.velocity) * 0.3
        return round(max(self.state.velocity, 0), 2)

    def _simulate_cpu(self):
        base = 30
        self.state.cpu_load = min(max(base + self.state.velocity * 3 + random.uniform(-5, 5), 15), 100)
        return round(self.state.cpu_load, 2)

    def _get_pc_metrics(self):
        try:
            net = psutil.net_io_counters()
            return {
                "pc_cpu_load": round(psutil.cpu_percent(None), 2),
                "pc_memory_load": round(psutil.virtual_memory().percent, 2),
                "pc_disk_usage": round(psutil.disk_usage("/").percent, 2),
                "pc_network_sent": net.bytes_sent,
                "pc_network_recv": net.bytes_recv,
                "pc_temperature": round(35 + random.uniform(-2, 2), 2)
            }
        except:
            return {
                "pc_cpu_load": round(40 + random.uniform(-10, 20), 2),
                "pc_memory_load": round(60 + random.uniform(-10, 15), 2),
                "pc_disk_usage": round(50 + random.uniform(-5, 10), 2),
                "pc_network_sent": random.randint(1000, 10000),
                "pc_network_recv": random.randint(1000, 10000),
                "pc_temperature": round(35 + random.uniform(-2, 2), 2)
            }

    def generate(self):
        self.state.cycle_count += 1

        battery = self._simulate_battery()
        temp = self._simulate_temperature()
        motor = self._simulate_motor()
        velocity = self._simulate_velocity()
        cpu = self._simulate_cpu()
        pc_metrics = self._get_pc_metrics()

        SENSOR_FAILURE_PROBABILITY = 0.005
        if random.random() < SENSOR_FAILURE_PROBABILITY:
            sensor = random.choice(["encoder", "lidar", "camera"])
            if sensor == "encoder":
                self.state.encoder_ok = False
                print("ENCODER FAILURE!")
            elif sensor == "lidar":
                self.state.lidar_ok = False
                print("LIDAR FAILURE!")
            elif sensor == "camera":
                self.state.camera_ok = False
                print("CAMERA FAILURE!")
        
        if not self.state.encoder_ok and random.random() < 0.1:
            self.state.encoder_ok = True
        if not self.state.lidar_ok and random.random() < 0.1:
            self.state.lidar_ok = True
        if not self.state.camera_ok and random.random() < 0.1:
            self.state.camera_ok = True

        if (self.state.degradation_mode is None
            and self.state.anomaly_cooldown <= 0
            and self.state.anomalies_generated < Config.MAX_ANOMALIES):
            
            if random.random() < Config.ANOMALY_PROBABILITY:
                self.state.degradation_mode = random.choice([
                    "MOTOR_OVERHEATING",
                    "BATTERY_DEGRADATION", 
                    "ABNORMAL_VELOCITY"
                ])
                self.state.degradation_progress = 0
                self.state.anomalies_generated += 1
                self.state.anomaly_intensity = random.uniform(1.5, 3.0)
                
                print(f"\n{'='*50}")
                print(f"!!!ANOMALY #{self.state.anomalies_generated} STARTED!")
                print(f"!!!TYPE: {self.state.degradation_mode}")
                print(f"{'='*50}")

        if self.state.degradation_mode:
            self.state.degradation_progress += 1
            
            if self.state.degradation_mode == "MOTOR_OVERHEATING":
                temp += self.state.degradation_progress * 3.0 * self.state.anomaly_intensity
                motor += self.state.degradation_progress * 0.6 * self.state.anomaly_intensity
                
            elif self.state.degradation_mode == "BATTERY_DEGRADATION":
                health_loss = 2.5 * self.state.anomaly_intensity
                self.state.battery_health = max(self.state.battery_health - health_loss, 20)
                
            elif self.state.degradation_mode == "ABNORMAL_VELOCITY":
                velocity += random.uniform(1.0, 2.5) * self.state.anomaly_intensity

            if self.state.degradation_progress > 8:
                self.state.degradation_mode = None
                self.state.anomaly_cooldown = 5
                self.state.anomaly_intensity = 1.0

        if self.state.anomaly_cooldown > 0:
            self.state.anomaly_cooldown -= 1

        payload = {
            "robot_id": Config.ROBOT_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "battery_level": round(battery, 2),
            "battery_health": round(self.state.battery_health, 2),
            "battery_drop_rate": self.state.battery_drop_rate,
            "battery_trend": self.state.battery_trend,
            "temperature": round(temp, 2),
            "motor_current": round(motor, 2),
            "cpu_load": round(cpu, 2),
            "velocity": round(velocity, 2),
            "encoder_ok": self.state.encoder_ok,
            "lidar_ok": self.state.lidar_ok,
            "camera_ok": self.state.camera_ok,
            **pc_metrics
        }

        print(f"\nCycle #{self.state.cycle_count}")
        print(f"  Battery: {battery}% (Health: {self.state.battery_health:.1f}%)")
        print(f"  Temperature: {temp}°C")
        print(f"  Motor Current: {motor}A")
        print(f"  Velocity: {velocity}m/s")
        print(f"  CPU: {cpu}%")
        
        if self.state.degradation_mode:
            print(f"   ACTIVE ANOMALY: {self.state.degradation_mode}")

        return payload

# ==================== MAIN ====================
def main():
    state = RobotState()
    generator = TelemetryGenerator(state)
    mqtt_client = MQTTClient()
    
    print("\n *Connecting to MQTT broker...")
    mqtt_client.connect()
    time.sleep(2)
    
    if not mqtt_client.connected:
        print("!!Could not connect to MQTT. Running in simulation mode only...")
    
    cycle = 0
    try:
        while True:
            cycle += 1
            telemetry = generator.generate()
            
            if mqtt_client.connected:
                success = mqtt_client.publish(telemetry)
                if success:
                    print(f"   MQTT: Published successfully")
                else:
                    print(f"   MQTT: Failed to publish")
            else:
                print(f"   (Simulation only - no MQTT)")
            
            if cycle % 10 == 0:
                print(f"\n{'='*60}")
                print(f" SUMMARY after {cycle} cycles:")
                print(f"  Anomalies generated: {state.anomalies_generated}/{Config.MAX_ANOMALIES}")
                print(f"  Current anomaly: {state.degradation_mode or 'None'}")
                print(f"  Battery health: {state.battery_health:.1f}%")
                print(f"{'='*60}")
            
            time.sleep(Config.PUBLISH_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("!! SIMULATOR STOPPED BY USER")
        print("="*60)
        print(f"Total cycles: {cycle}")
        print(f"Anomalies generated: {state.anomalies_generated}")
        print(f"Final battery health: {state.battery_health:.1f}%")
        print("="*60)
        
    finally:
        if mqtt_client.connected:
            mqtt_client.disconnect()

if __name__ == "__main__":
    main()