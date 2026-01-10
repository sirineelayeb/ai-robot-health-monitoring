# evaluate.py
import pandas as pd
import joblib

from utils import evaluate_model

# ===================== Load Data =====================
X_train = pd.read_csv("data/X_train.csv")
y_train = pd.read_csv("data/y_train.csv").values.ravel()

X_test = pd.read_csv("data/X_test.csv")
y_test = pd.read_csv("data/y_test.csv").values.ravel()

# ===================== Load Model =====================
model = joblib.load("models/xgboost_model.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

# ===================== Evaluate =====================
evaluate_model(
    model=model,
    X_test=X_test,
    y_test=y_test,
    labels=label_encoder.classes_,
    title="XGBoost Evaluation",
    X_train=X_train,
    y_train=y_train
)
