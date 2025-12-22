import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime

# ---------------- CONFIGURATION ----------------
BROKER = "localhost"
PORT = 1883
TOPIC = "robot/telemetry"
ROBOT_ID = "robot_001"
PUBLISH_INTERVAL = 2  # seconds

MODE = "mixed"

# Base values
TEMPERATURE_BASE = 45.0
BATTERY_START = 100.0

# Anomaly probabilities
ANOMALY_PROB_VELOCITY = 0.05
ANOMALY_PROB_TEMP = 0.05
ANOMALY_PROB_CPU = 0.05
ANOMALY_PROB_BATTERY = 0.05

# ---------------- MQTT SETUP ----------------
def setup_mqtt_client():
    client = mqtt.Client(client_id=ROBOT_ID)
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    return client

# ---------------- SIMULATION FUNCTIONS ----------------
def simulate_telemetry(prev_state):
    battery = prev_state["battery"]
    charging = prev_state["charging"]
    last_velocity = prev_state["velocity"]
    overheat_counter = prev_state.get("overheat_counter", 0)

    is_anomaly = False
    anomaly_type = None

    # ---- Velocity ----
    velocity = max(0.3, last_velocity + random.uniform(-0.2, 0.2))
    if MODE == "mixed" and random.random() < ANOMALY_PROB_VELOCITY:
        velocity = random.choice([0, random.uniform(3.5, 5.0)])  # sudden stop or spike
        is_anomaly = True
        anomaly_type = "velocity"

    # ---- Motor current ----
    motor_current = velocity * random.uniform(1.2, 1.6)

    # ---- Motor temperature ----
    motor_temp = TEMPERATURE_BASE + motor_current * 6

    # Start sustained overheating
    if MODE == "mixed" and random.random() < ANOMALY_PROB_TEMP:
        overheat_counter = random.randint(3, 6)

    if overheat_counter > 0:
        motor_temp += random.uniform(15, 25)
        is_anomaly = True
        anomaly_type = "temperature"
        overheat_counter -= 1

    # ---- CPU load ----
    cpu_load = random.uniform(25, 55)
    if MODE == "mixed" and random.random() < ANOMALY_PROB_CPU:
        cpu_load = random.uniform(90, 100)
        is_anomaly = True
        anomaly_type = "cpu"

    # ---- Battery ----
    if charging:
        battery = min(battery + random.uniform(0.5, 1.0), 100)
        if battery >= 100:
            charging = False
    else:
        drain = random.uniform(0.02, 0.05)
        if battery < 30:
            drain += random.uniform(0.1, 0.3)
        # Battery degradation anomaly
        if MODE == "mixed" and random.random() < ANOMALY_PROB_BATTERY:
            drain += random.uniform(0.05, 0.2)
            is_anomaly = True
            anomaly_type = "battery"
        battery = max(battery - drain, 0)
        if battery <= 20:
            charging = True

    battery_drop_rate = prev_state["battery"] - battery  # new feature

    payload = {
        "robot_id": ROBOT_ID,
        "timestamp": datetime.utcnow().isoformat(),
        "battery": round(battery, 2),
        "motor_temp": round(motor_temp, 2),
        "motor_current": round(motor_current, 2),
        "cpu_load": round(cpu_load, 2),
        "velocity": round(velocity, 2),
        "battery_drop_rate": round(battery_drop_rate, 3),
        "is_anomaly": is_anomaly,
        "anomaly_type": anomaly_type
    }

    # Update state
    prev_state.update({
        "battery": battery,
        "charging": charging,
        "velocity": velocity,
        "overheat_counter": overheat_counter
    })

    return prev_state, payload

# ---------------- MAIN LOOP ----------------
def main():
    state = {
        "battery": BATTERY_START,
        "charging": False,
        "velocity": random.uniform(0.5, 1.5),
        "overheat_counter": 0
    }

    client = setup_mqtt_client()

    print("🚀 Robot simulator started")
    print(f"📡 Publishing to {TOPIC} | MODE={MODE}")

    try:
        while True:
            state, payload = simulate_telemetry(state)
            client.publish(TOPIC, json.dumps(payload))
            print("📤", payload)
            time.sleep(PUBLISH_INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped")
        client.loop_stop()
        client.disconnect()

# ---------------- ENTRY POINT ----------------
if __name__ == "__main__":
    main()
