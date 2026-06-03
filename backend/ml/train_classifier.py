import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
import os
import logging
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
MODEL_DIR = os.getenv("MODEL_DIR", "./models")
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "global_air_pollution.csv")

AQI_CATEGORIES = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous",
]

FEATURE_COLS = [
    "aqi_value",
    "co_aqi_value",
    "ozone_aqi_value",
    "no2_aqi_value",
    "pm25_aqi_value",
]


def load_dataset() -> pd.DataFrame:
    logger.info(f"Loading dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    rename_map = {
        "pm2.5_aqi_value": "pm25_aqi_value",
        "pm2.5_aqi_category": "pm25_aqi_category",
    }
    df = df.rename(columns=rename_map)
    logger.info(f"Loaded {len(df)} rows, columns: {df.columns.tolist()}")
    return df


def preprocess(df: pd.DataFrame):
    df = df.copy()
    for col in FEATURE_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["aqi_category"] = df["aqi_category"].str.strip()
    df = df[df["aqi_category"].isin(AQI_CATEGORIES)].reset_index(drop=True)

    le = LabelEncoder()
    le.classes_ = np.array(AQI_CATEGORIES)
    df["aqi_label"] = df["aqi_category"].apply(
        lambda x: int(np.where(le.classes_ == x)[0][0]) if x in le.classes_ else -1
    )
    df = df[df["aqi_label"] >= 0].reset_index(drop=True)

    X = df[FEATURE_COLS].copy()
    y = df["aqi_label"]

    imputer = SimpleImputer(strategy="median")
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=FEATURE_COLS)

    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X_imputed), columns=FEATURE_COLS)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(imputer, f"{MODEL_DIR}/imputer.pkl")
    joblib.dump(scaler, f"{MODEL_DIR}/scaler.pkl")
    joblib.dump(le, f"{MODEL_DIR}/label_encoder.pkl")

    logger.info(f"Preprocessed: X={X_scaled.shape}, classes={le.classes_}")
    return X_scaled, y, imputer, scaler, le


def train_classifier():
    df = load_dataset()
    X, y, imputer, scaler, le = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    logger.info("Training XGBoost classifier...")
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    logger.info("\n" + classification_report(y_test, y_pred, target_names=AQI_CATEGORIES, zero_division=0))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
    logger.info(f"CV Accuracy: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    logger.info("Computing SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_test[:200])

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, f"{MODEL_DIR}/xgb_classifier.pkl")
    joblib.dump(explainer, f"{MODEL_DIR}/shap_explainer.pkl")

    shap_arr = shap_values.values
    if len(shap_arr.shape) == 3:
        mean_shap = np.abs(shap_arr).mean(axis=(0, 2))
    else:
        mean_shap = np.abs(shap_arr).mean(axis=0)

    shap_df = pd.DataFrame({"feature": FEATURE_COLS, "mean_shap": mean_shap})
    shap_df.sort_values("mean_shap", ascending=False).to_csv(f"{MODEL_DIR}/global_shap.csv", index=False)

    pd.DataFrame({
        "feature": FEATURE_COLS,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False).to_csv(f"{MODEL_DIR}/feature_importance.csv", index=False)

    joblib.dump({
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "classes": AQI_CATEGORIES,
        "feature_cols": FEATURE_COLS,
    }, f"{MODEL_DIR}/classifier_metadata.pkl")

    logger.info(f"All models saved to {MODEL_DIR}/")
    return model, explainer


if __name__ == "__main__":
    train_classifier()