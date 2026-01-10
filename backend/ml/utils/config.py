# utils/config.py

FEATURES = [
    "battery_level",
    "battery_health",
    "battery_drop_rate",
    "battery_trend",
    "temperature",
    "motor_current",
    "cpu_load",
    "velocity"
]

TARGET = "anomaly_type"

VALID_LABELS = [
    "NORMAL",
    "MOTOR_OVERHEATING",
    "BATTERY_DEGRADATION",
    "ABNORMAL_VELOCITY"
]

# MODEL_PATH = "models/anomaly_model.pkl"
# RAW_DATA_PATH = "data/raw_telemetry.csv"
# PROCESSED_DATA_PATH = "data/processed_telemetry.csv"
