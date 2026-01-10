import pandas as pd
from pymongo import MongoClient
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DATA_DIR = BACKEND_DIR / "data"

# Create data directory
DATA_DIR.mkdir(exist_ok=True)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["robot_db"]
collection = db["telemetries"]

# Fetch data
docs = list(collection.find({}))
df = pd.DataFrame(docs)

# Select features
FEATURES = [
    "battery_level",
    "battery_health",
    "battery_drop_rate",
    "battery_trend",
    "temperature",
    "motor_current",
    "cpu_load",
    "velocity",
    "anomaly_type"
]

df = df[FEATURES]
df["anomaly_type"] = df["anomaly_type"].fillna("Normal")

# Save
output_path = DATA_DIR / "telemetry_ml.csv"
df.to_csv(output_path, index=False)

print(f"Exported {len(df)} records to: {output_path}")
print(f"\nClass Distribution:")
print(df["anomaly_type"].value_counts())