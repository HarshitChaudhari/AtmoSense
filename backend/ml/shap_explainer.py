import numpy as np
import pandas as pd
import shap
import joblib
import os
import logging

logger = logging.getLogger(__name__)
MODEL_DIR = os.getenv("MODEL_DIR", "./models")

FEATURE_COLS = [
    "aqi_value",
    "co_aqi_value",
    "ozone_aqi_value",
    "no2_aqi_value",
    "pm25_aqi_value",
]

FEATURE_LABELS = {
    "aqi_value": "Overall AQI",
    "co_aqi_value": "Carbon Monoxide (CO)",
    "ozone_aqi_value": "Ozone (O₃)",
    "no2_aqi_value": "Nitrogen Dioxide (NO₂)",
    "pm25_aqi_value": "PM2.5 Particles",
}


def explain_prediction(X_row: pd.DataFrame) -> dict:
    """Per-feature SHAP values for a single prediction — waterfall chart."""
    explainer = joblib.load(f"{MODEL_DIR}/shap_explainer.pkl")
    model = joblib.load(f"{MODEL_DIR}/xgb_classifier.pkl")
    le = joblib.load(f"{MODEL_DIR}/label_encoder.pkl")

    pred_class = int(model.predict(X_row)[0])
    pred_proba = model.predict_proba(X_row)[0].tolist()
    pred_label = le.classes_[pred_class]

    shap_vals = explainer(X_row)

    if len(shap_vals.values.shape) == 3:
        class_shap = shap_vals.values[0, :, pred_class]
    else:
        class_shap = shap_vals.values[0]

    features = X_row.columns.tolist()
    feature_values = X_row.iloc[0].tolist()

    contributions = [
        {
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "value": round(float(fval), 3),
            "shap_value": round(float(sval), 4),
            "direction": "positive" if sval > 0 else "negative",
        }
        for feat, fval, sval in zip(features, feature_values, class_shap)
    ]
    contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return {
        "predicted_class": pred_label,
        "predicted_index": pred_class,
        "probabilities": {
            le.classes_[i]: round(p, 4) for i, p in enumerate(pred_proba)
        },
        "base_value": round(
            float(shap_vals.base_values[0][pred_class])
            if len(np.array(shap_vals.base_values).shape) > 1
            else float(shap_vals.base_values[0]),
            4,
        ),
        "top_features": contributions[:5],
        "all_features": contributions,
    }


def get_global_shap() -> dict:
    """Global SHAP summary for Model Insight page."""
    shap_path = f"{MODEL_DIR}/global_shap.csv"
    importance_path = f"{MODEL_DIR}/feature_importance.csv"
    metadata_path = f"{MODEL_DIR}/classifier_metadata.pkl"

    if not os.path.exists(shap_path):
        raise FileNotFoundError("Global SHAP not computed. Run train_classifier.py first.")

    shap_df = pd.read_csv(shap_path)
    importance_df = pd.read_csv(importance_path)
    metadata = joblib.load(metadata_path)

    shap_df["label"] = shap_df["feature"].map(FEATURE_LABELS)
    importance_df["label"] = importance_df["feature"].map(FEATURE_LABELS)

    return {
        "global_shap": shap_df.to_dict(orient="records"),
        "feature_importance": importance_df.to_dict(orient="records"),
        "metadata": metadata,
    }