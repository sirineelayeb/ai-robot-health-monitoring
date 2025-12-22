# predict.py
import sys, json
import joblib
import pandas as pd

model = joblib.load("ml/rf_model.joblib")
scaler = joblib.load("ml/scaler.joblib")

def predict(data, threshold=0.4):
    ts = pd.to_datetime(data["timestamp"])
    row = {
        "battery": data["battery"],
        "motor_temp": data["motor_temp"],
        "motor_current": data["motor_current"],
        "cpu_load": data["cpu_load"],
        "velocity": data["velocity"],
        "battery_drop_rate": data["battery_drop_rate"],
        "hour": ts.hour,
        "minute": ts.minute,
        "second": ts.second,
    }
    X = pd.DataFrame([row])
    X_scaled = scaler.transform(X)
    proba = model.predict_proba(X_scaled)[0][1]
    is_anomaly = proba >= threshold
    return {"anomaly_score": round(float(proba),3), "is_anomaly": bool(is_anomaly)}

# Command line execution
if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    result = predict(input_data)
    print(json.dumps(result))
