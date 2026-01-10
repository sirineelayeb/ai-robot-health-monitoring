import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from utils import evaluate_model
# ==================== LOAD DATA ====================
df = pd.read_csv("data/telemetry_ml.csv")

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

df[TARGET] = df[TARGET].fillna("Normal")

X = df[FEATURES]
y = df[TARGET]

# Encode labels
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

labels = label_encoder.classes_

# ==================== SPLIT ====================
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.3,
    random_state=42,
    stratify=y_encoded
)

# ==================== LOAD MODEL ====================
model = joblib.load("models/rf_model.pkl")

# ==================== EVALUATE ====================
evaluate_model(
    model,
    X_test,
    y_test,
    labels,
    title="Random Forest Evaluation"
)
