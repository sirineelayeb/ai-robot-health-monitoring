import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

X_train = pd.read_csv("data/X_train.csv")
y_train = pd.read_csv("data/y_train.csv").values.ravel()

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    class_weight="balanced",
    random_state=42
)

rf.fit(X_train, y_train)

joblib.dump(rf, "models/rf_model.pkl")
print("Random Forest trained")
