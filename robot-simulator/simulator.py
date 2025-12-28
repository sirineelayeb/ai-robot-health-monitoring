import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
from dataclasses import dataclass
import psutil

# ==================== CONFIGURATION ====================
class Config:
    BROKER = "localhost"
    PORT = 1883
    TOPIC = "robot/telemetry"
    ROBOT_ID = "robot_001"
    PUBLISH_INTERVAL = 2  # seconds

    ANOMALY_PROBABILITY = 0.20
    SENSOR_FAILURE_PROBABILITY = 0.02
    SENSOR_NOISE_LEVEL = 0.02

# ==================== THRESHOLDS ====================
class Thresholds:
    TEMP_WARNING = 75
    TEMP_CRITICAL = 90
    BATTERY_WARNING = 25
    BATTERY_CRITICAL = 15
    MOTOR_WARNING = 9.0
    MOTOR_CRITICAL = 11.0
    VELOCITY_WARNING = 3.0
    VELOCITY_CRITICAL = 4.5
    CPU_WARNING = 80
    CPU_CRITICAL = 95

# ==================== ROBOT STATE ====================
@dataclass
class RobotState:
    battery_level: float = 95.0
    battery_health: float = 100.0  # NEW: Track battery health
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
    last_anomaly: str = None
    
    # NEW: Velocity anomaly sub-type
    velocity_anomaly_type: str = None

# ==================== MQTT CLIENT ====================
class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=f"{Config.ROBOT_ID}_simulator")
        self.client.on_connect = self._on_connect
        self.connected = False

    def _on_connect(self, client, userdata, flags, rc):
        self.connected = (rc == 0)
        status = "CONNECTED" if rc == 0 else f"FAILED (code: {rc})"
        print(f"\n{'='*80}\n{status} to MQTT Broker: {Config.BROKER}:{Config.PORT}\n{'='*80}\n")

    def connect(self):
        try:
            self.client.connect(Config.BROKER, Config.PORT, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"Connection Error: {e}")
            exit(1)

    def publish(self, payload: dict) -> bool:
        return self.connected and self.client.publish(Config.TOPIC, json.dumps(payload), qos=1).rc == 0

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

# ==================== TELEMETRY GENERATOR ====================
class TelemetryGenerator:
    def __init__(self, state: RobotState):
        self.state = state
        print("ROBOT SIMULATOR - ML TRAINING MODE (FIXED)\n")

    def _simulate_sensors(self):
        if self.state.encoder_ok:
            if random.random() < 0.01:
                self.state.encoder_ok = False
        else:
            if random.random() < 0.10:
                self.state.encoder_ok = True
        
        if self.state.lidar_ok:
            if random.random() < 0.01:
                self.state.lidar_ok = False
        else:
            if random.random() < 0.10:
                self.state.lidar_ok = True
        
        if self.state.camera_ok:
            if random.random() < 0.01:
                self.state.camera_ok = False
        else:
            if random.random() < 0.10:
                self.state.camera_ok = True

    def _simulate_battery(self):
        if self.state.is_charging:
            self.state.battery_level = min(self.state.battery_level + random.uniform(0.8, 1.2), 100)
            if self.state.battery_level >= 98:
                self.state.is_charging = False
        else:
            # Base drain affected by battery health
            base_drain = random.uniform(0.15, 0.35)
            load_drain = self.state.motor_current / 20.0
            
            # FIXED: Battery health affects discharge rate
            health_factor = 100 / self.state.battery_health  # 1.0 for healthy, 1.67 for 60% health
            
            drain = (base_drain + load_drain) * health_factor
            self.state.battery_level = max(self.state.battery_level - drain, 0)
            
            if self.state.battery_level <= 20:
                self.state.is_charging = True
                
        return round(self.state.battery_level, 2)

    def _simulate_temperature(self):
        ambient = 25
        heat_from_motor = self.state.motor_current * 3.5
        heat_from_cpu = self.state.cpu_load * 0.15
        
        target_temp = ambient + heat_from_motor + heat_from_cpu + random.uniform(-2, 3)
        
        self.state.temperature += (target_temp - self.state.temperature) * 0.15
        
        return round(max(self.state.temperature, 25), 2)

    def _simulate_motor(self):
        base_current = 3.0
        load_current = self.state.velocity * 1.8
        noise = random.uniform(-0.3, 0.4)
        
        self.state.motor_current = base_current + load_current + noise
        return round(max(self.state.motor_current, 2.5), 2)

    def _simulate_velocity(self):
        if self.state.cycle_count % 20 < 15:
            target_velocity = random.uniform(1.0, 2.2)
        else:
            target_velocity = random.uniform(0, 0.5)
        
        self.state.velocity += (target_velocity - self.state.velocity) * 0.3
        return round(max(self.state.velocity, 0), 2)

    def _simulate_cpu(self):
        base_load = 30
        failed_sensors = sum([not self.state.encoder_ok, not self.state.lidar_ok, not self.state.camera_ok])
        sensor_load = failed_sensors * 12
        variance = random.uniform(-8, 12)
        
        self.state.cpu_load = min(max(base_load + sensor_load + variance, 15), 100)
        return round(self.state.cpu_load, 2)

    def _get_pc_metrics(self):
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent
        net = psutil.net_io_counters()

        pc_temp = None
        try:
            temps = psutil.sensors_temperatures()
            if temps:
                for _, entries in temps.items():
                    if entries:
                        pc_temp = round(entries[0].current, 2)
                        break
        except:
            pass
        if pc_temp is None:
            pc_temp = round(35 + random.uniform(-2, 2), 2)

        return {
            "pc_cpu_load": round(cpu, 2),
            "pc_memory_load": round(mem, 2),
            "pc_disk_usage": round(disk, 2),
            "pc_network_sent": net.bytes_sent,
            "pc_network_recv": net.bytes_recv,
            "pc_temperature": pc_temp
        }

    def generate(self):
        self.state.cycle_count += 1
        
        self._simulate_sensors()
        battery = self._simulate_battery()
        temp = self._simulate_temperature()
        motor = self._simulate_motor()
        velocity = self._simulate_velocity()
        cpu = self._simulate_cpu()
        pc_metrics = self._get_pc_metrics()

        anomaly_type = None
        status = "NORMAL"
        is_anomaly = False

        # ==================== FIXED: IMPROVED ANOMALY GENERATION ====================
        # Start new degradation pattern
        if self.state.degradation_mode is None and self.state.anomaly_cooldown <= 0:
            if random.random() < Config.ANOMALY_PROBABILITY:
                anomaly_types = ["MOTOR_OVERHEATING", "BATTERY_DEGRADATION", "ABNORMAL_VELOCITY"]
                
                if self.state.last_anomaly:
                    anomaly_types.remove(self.state.last_anomaly)
                
                self.state.degradation_mode = random.choice(anomaly_types)
                self.state.degradation_progress = 0
                
                # Choose velocity anomaly sub-type
                if self.state.degradation_mode == "ABNORMAL_VELOCITY":
                    self.state.velocity_anomaly_type = random.choice([
                        "sudden_stop", "stuck_wheels", "erratic", "drift"
                    ])
                    print(f"\n⚠️  Starting: {self.state.degradation_mode} ({self.state.velocity_anomaly_type})\n")
                else:
                    print(f"\n⚠️  Starting: {self.state.degradation_mode}\n")
        
        # Progress existing degradation
        if self.state.degradation_mode:
            self.state.degradation_progress += 1
            
            if self.state.degradation_mode == "MOTOR_OVERHEATING":
                # Gradually increase temperature and motor current
                temp += self.state.degradation_progress * 1.5
                motor += self.state.degradation_progress * 0.2
                
                if self.state.degradation_progress > 10:
                    is_anomaly = True
                    anomaly_type = "MOTOR_OVERHEATING"
                    status = "WARNING" if self.state.degradation_progress < 20 else "CRITICAL"
                    
            elif self.state.degradation_mode == "BATTERY_DEGRADATION":
                # FIXED: Simulate actual battery degradation
                # Reduce battery health gradually
                self.state.battery_health = max(60, 100 - self.state.degradation_progress * 1.2)
                
                # Degraded battery shows:
                # 1. Faster discharge (handled in _simulate_battery via health_factor)
                # 2. Voltage drops under load
                if motor > 7.0:
                    battery -= 0.8  # Extra drop under load
                
                # 3. Inconsistent readings
                if random.random() < 0.15:
                    battery += random.uniform(-2, 2)
                
                if self.state.degradation_progress > 8:
                    is_anomaly = True
                    anomaly_type = "BATTERY_DEGRADATION"
                    status = "WARNING" if battery > 15 else "CRITICAL"
                    
            elif self.state.degradation_mode == "ABNORMAL_VELOCITY":
                # FIXED: Specific velocity anomaly patterns
                
                if self.state.velocity_anomaly_type == "sudden_stop":
                    # Robot moving normally then suddenly stops
                    if self.state.degradation_progress < 10:
                        velocity = random.uniform(1.3, 1.8)  # Normal movement
                    else:
                        velocity = 0.0  # Sudden stop
                        motor += 2.0  # Motor still trying to move
                
                elif self.state.velocity_anomaly_type == "stuck_wheels":
                    # High motor current but very low velocity
                    velocity = random.uniform(0.0, 0.3)
                    motor = random.uniform(9.0, 12.0)
                    temp += 0.8  # Motor heating up
                
                elif self.state.velocity_anomaly_type == "erratic":
                    # Rapid velocity oscillations
                    velocity = random.choice([0.2, 1.9, 0.4, 2.3, 0.1, 1.8, 0.5])
                    motor = 5.0 + abs(velocity - 1.0) * 2.0
                
                elif self.state.velocity_anomaly_type == "drift":
                    # Moving when should be stationary
                    velocity = random.uniform(0.3, 0.6)
                    motor = random.uniform(4.0, 6.0)
                
                if self.state.degradation_progress > 8:
                    is_anomaly = True
                    anomaly_type = f"ABNORMAL_VELOCITY_{self.state.velocity_anomaly_type.upper()}"
                    status = "WARNING" if velocity < 3.0 else "CRITICAL"
            
            # Reset after full cycle
            if self.state.degradation_progress > 35:
                print(f"\n✓ Resolved: {self.state.degradation_mode}\n")
                self.state.last_anomaly = self.state.degradation_mode
                self.state.degradation_mode = None
                self.state.degradation_progress = 0
                self.state.anomaly_cooldown = 15
                self.state.velocity_anomaly_type = None
                
                # Reset battery health after degradation test
                if self.state.last_anomaly == "BATTERY_DEGRADATION":
                    self.state.battery_health = 100.0

        if self.state.anomaly_cooldown > 0:
            self.state.anomaly_cooldown -= 1
        # ==================== END FIXED ANOMALY GENERATION ====================

        # Check threshold violations
        if not is_anomaly:
            if temp >= Thresholds.TEMP_CRITICAL:
                status = "CRITICAL"
                anomaly_type = "MOTOR_OVERHEATING"
                is_anomaly = True
            elif motor >= Thresholds.MOTOR_CRITICAL:
                status = "CRITICAL"
                anomaly_type = "MOTOR_OVERHEATING"
                is_anomaly = True
            elif battery <= Thresholds.BATTERY_CRITICAL:
                status = "CRITICAL"
                anomaly_type = "BATTERY_DEGRADATION"
                is_anomaly = True
            elif velocity >= Thresholds.VELOCITY_CRITICAL:
                status = "CRITICAL"
                anomaly_type = "ABNORMAL_VELOCITY"
                is_anomaly = True
            elif cpu >= Thresholds.CPU_CRITICAL:
                status = "CRITICAL"
                is_anomaly = True
            elif temp >= Thresholds.TEMP_WARNING:
                status = "WARNING"
            elif motor >= Thresholds.MOTOR_WARNING:
                status = "WARNING"
            elif battery <= Thresholds.BATTERY_WARNING:
                status = "WARNING"
            elif velocity >= Thresholds.VELOCITY_WARNING:
                status = "WARNING"
            elif cpu >= Thresholds.CPU_WARNING:
                status = "WARNING"

        return {
            "robot_id": Config.ROBOT_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "battery_level": round(battery, 2),
            "battery_health": round(self.state.battery_health, 2),  # NEW
            "temperature": round(temp, 2),
            "motor_current": round(motor, 2),
            "cpu_load": round(cpu, 2),
            "velocity": round(velocity, 2),
            "encoder_ok": self.state.encoder_ok,
            "lidar_ok": self.state.lidar_ok,
            "camera_ok": self.state.camera_ok,
            **pc_metrics,
            "status": status,
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type
        }

# ==================== DISPLAY ====================
def print_telemetry(payload):
    print(f"{'-'*100}")
    print(f"Status: {payload['status']} | {payload['timestamp']}")
    print(f"Robot -> Bat:{payload['battery_level']}% (Health:{payload['battery_health']}%) "
          f"Temp:{payload['temperature']}°C Motor:{payload['motor_current']}A "
          f"CPU:{payload['cpu_load']}% Vel:{payload['velocity']}m/s")
    print(f"Sensors -> Encoder[{payload['encoder_ok']}] "
          f"LiDAR[{payload['lidar_ok']}] Camera[{payload['camera_ok']}]")
    print(f"PC -> CPU:{payload['pc_cpu_load']}% RAM:{payload['pc_memory_load']}% "
          f"Disk:{payload['pc_disk_usage']}% Temp:{payload['pc_temperature']}°C")
    
    if payload['is_anomaly']:
        print(f"🚨 ANOMALY: {payload['anomaly_type']}")
    print(f"{'-'*100}\n")

# ==================== MAIN ====================
def main():
    state = RobotState()
    generator = TelemetryGenerator(state)
    mqtt_client = MQTTClient()
    mqtt_client.connect()
    
    print("Collecting training data... Press Ctrl+C to stop\n")
    
    try:
        sample_count = 0
        while True:
            payload = generator.generate()
            mqtt_client.publish(payload)
            print_telemetry(payload)
            sample_count += 1
            
            if sample_count % 100 == 0:
                print(f"📊 Samples collected: {sample_count}\n")
            
            time.sleep(Config.PUBLISH_INTERVAL)
            
    except KeyboardInterrupt:
        print(f"\n✓ Simulator stopped. Total samples: {sample_count}")
        mqtt_client.disconnect()

if __name__ == "__main__":
    main()