# ml/utils.py
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import classification_report, confusion_matrix, accuracy_score


def evaluate_model(
    model,
    X_test,
    y_test,
    labels,
    title="Model Evaluation",
    X_train=None,
    y_train=None
):
    # ===== FORCE save inside ml/results =====
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # ml/
    RESULTS_DIR = os.path.join(BASE_DIR, "results")
    os.makedirs(RESULTS_DIR, exist_ok=True)

    safe_title = title.replace(" ", "_").lower()

    # ===== Predictions =====
    y_pred = model.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)

    print(f"\n{'=' * 50}")
    print(title)
    print(f"{'=' * 50}")
    print(f"Test Accuracy: {test_acc:.4f}")

    # ===== Overfitting =====
    if X_train is not None and y_train is not None:
        train_acc = accuracy_score(y_train, model.predict(X_train))
        print(f"Train Accuracy: {train_acc:.4f}")
        print(f"Overfitting Gap: {train_acc - test_acc:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=labels))

    # ===== Confusion Matrix =====
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels,
        yticklabels=labels
    )
    plt.title(f"{title} - Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("True")

    cm_path = os.path.join(
        RESULTS_DIR, f"{safe_title}_confusion_matrix.png"
    )
    plt.savefig(cm_path, dpi=300, bbox_inches="tight")
    plt.close()

    print(f" Saved: {cm_path}")

    # ===== Feature Importance =====
    if hasattr(model, "feature_importances_"):
        importance = model.feature_importances_

        feature_names = (
            X_test.columns
            if hasattr(X_test, "columns")
            else [f"Feature {i}" for i in range(len(importance))]
        )

        idx = np.argsort(importance)[::-1]

        plt.figure(figsize=(10, 6))
        plt.bar(range(len(importance)), importance[idx])
        plt.xticks(
            range(len(importance)),
            [feature_names[i] for i in idx],
            rotation=45,
            ha="right"
        )
        plt.title("Feature Importance")

        fi_path = os.path.join(
            RESULTS_DIR, f"{safe_title}_feature_importance.png"
        )
        plt.savefig(fi_path, dpi=300, bbox_inches="tight")
        plt.close()

        print(f" Saved: {fi_path}")
