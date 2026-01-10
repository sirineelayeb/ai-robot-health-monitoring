import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score
import joblib
import numpy as np

X_train = pd.read_csv("data/X_train.csv")
y_train = pd.read_csv("data/y_train.csv").values.ravel()

model = XGBClassifier(
    objective="multi:softprob", # Multi-class classification with probabilities
    num_class=4,                # 4 classes (Normal + 3 anomalies)
    n_estimators=300,           # 300 decision trees
    max_depth=6,                # Max tree depth (prevents overfitting)
    learning_rate=0.05,         # Small steps = more careful learning
    subsample=0.8,              # Use 80% of data per tree
    colsample_bytree=0.8,       # Use 80% of features per tree
    eval_metric="mlogloss",     # Loss function for multi-class
    tree_method="hist",         # Faster training method
    random_state=42            # For reproducibility
)

# cross-validation
print("Running 5-fold cross-validation...")
cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Train final model
model.fit(X_train, y_train)

joblib.dump(model, "models/xgboost_model.pkl")
print("XGBoost trained")