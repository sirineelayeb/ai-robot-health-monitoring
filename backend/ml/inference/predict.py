import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path


def load_models():
    """Load trained ML model and label encoder"""
    try:
        SCRIPT_DIR = Path(__file__).resolve().parent      # ml/inference
        ML_DIR = SCRIPT_DIR.parent                       # ml
        MODELS_DIR = ML_DIR / "models"

        model = joblib.load(MODELS_DIR / "xgboost_model.pkl")
        label_encoder = joblib.load(MODELS_DIR / "label_encoder.pkl")

        return model, label_encoder

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Failed to load models: {str(e)}"
        }), file=sys.stderr)
        sys.exit(1)


def predict(telemetry_data, model, label_encoder):
    """Predict anomaly type from telemetry data"""

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

    try:
        missing = [f for f in FEATURES if f not in telemetry_data]
        if missing:
            raise ValueError(f"Missing required features: {missing}")

        df = pd.DataFrame([telemetry_data])[FEATURES]
        df = df.apply(pd.to_numeric, errors="coerce")

        if df.isnull().any().any():
            raise ValueError("Invalid or non-numeric values in telemetry data")

        y_pred = model.predict(df)
        y_proba = model.predict_proba(df)

        anomaly_type = label_encoder.inverse_transform(y_pred)[0]

        probabilities = {
            label: float(prob)
            for label, prob in zip(label_encoder.classes_, y_proba[0])
        }

        return {
            "success": True,
            "anomaly_type": anomaly_type,
            "is_anomaly": anomaly_type != "Normal",
            "confidence": float(np.max(y_proba[0])),
            "probabilities": probabilities
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No telemetry data provided")

        input_arg = sys.argv[1]

        import os
        if os.path.isfile(input_arg):
            telemetry_data = json.loads(open(input_arg).read())
        else:
            telemetry_data = json.loads(input_arg)

        model, label_encoder = load_models()
        result = predict(telemetry_data, model, label_encoder)

        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get("success") else 1)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
