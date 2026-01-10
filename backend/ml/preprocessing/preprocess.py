from pathlib import Path
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ===== Directories =====
SCRIPT_DIR = Path(__file__).resolve().parent         # ml/preprocessing
ML_DIR = SCRIPT_DIR.parent                           # ml
MODELS_DIR = ML_DIR / "models"
DATA_DIR = ML_DIR / "data"

# Make sure directories exist
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# ===== Load data =====
df = pd.read_csv(DATA_DIR / "telemetry_ml.csv")

# ===== Features & Target =====
X = df.drop("anomaly_type", axis=1)
y = df["anomaly_type"]

# ===== Encode target =====
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
joblib.dump(label_encoder, MODELS_DIR / "label_encoder.pkl")  

# ===== Split data =====
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
)

# ===== Save splits =====
X_train.to_csv(DATA_DIR / "X_train.csv", index=False)
X_test.to_csv(DATA_DIR / "X_test.csv", index=False)
pd.Series(y_train).to_csv(DATA_DIR / "y_train.csv", index=False)
pd.Series(y_test).to_csv(DATA_DIR / "y_test.csv", index=False)

print("Preprocessing complete. Label encoder saved in:", MODELS_DIR / "label_encoder.pkl")
