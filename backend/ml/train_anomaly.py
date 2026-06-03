import pandas as pd
import numpy as np
import joblib
import os
import logging
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
MODEL_DIR = os.getenv("MODEL_DIR", "./models")
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "global_air_pollution.csv")

ANOMALY_FEATURES = ["aqi_value", "co_aqi_value", "ozone_aqi_value", "no2_aqi_value", "pm25_aqi_value"]


def classify_severity(score: float) -> str:
    if score < -0.3:
        return "Critical"
    elif score < -0.1:
        return "High"
    elif score < 0.0:
        return "Medium"
    return "Low"


def train_anomaly_detector():
    logger.info("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df = df.rename(columns={"pm2.5_aqi_value": "pm25_aqi_value"})

    feature_df = df[ANOMALY_FEATURES].copy()
    for col in ANOMALY_FEATURES:
        feature_df[col] = pd.to_numeric(feature_df[col], errors="coerce")
    feature_df = feature_df.fillna(feature_df.median())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(feature_df)

    logger.info("Training Isolation Forest...")
    model = IsolationForest(
        n_estimators=200,
        contamination=0.03,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    scores = model.decision_function(X_scaled)
    predictions = model.predict(X_scaled)
    n_anomalies = (predictions == -1).sum()
    logger.info(f"Flagged {n_anomalies} anomalies ({n_anomalies/len(df)*100:.1f}%) in training data")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, f"{MODEL_DIR}/isolation_forest.pkl")
    joblib.dump(scaler, f"{MODEL_DIR}/anomaly_scaler.pkl")
    logger.info(f"Anomaly detector saved to {MODEL_DIR}/")
    return model, scaler


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    model = joblib.load(f"{MODEL_DIR}/isolation_forest.pkl")
    scaler = joblib.load(f"{MODEL_DIR}/anomaly_scaler.pkl")

    feature_df = df[ANOMALY_FEATURES].copy().fillna(0) if all(c in df.columns for c in ANOMALY_FEATURES) else pd.DataFrame(0, index=df.index, columns=ANOMALY_FEATURES)
    X_scaled = scaler.transform(feature_df)

    scores = model.decision_function(X_scaled)
    predictions = model.predict(X_scaled)

    df = df.copy()
    df["anomaly_score"] = np.round(scores, 4)
    df["is_anomaly"] = predictions == -1
    df["severity"] = df["anomaly_score"].apply(classify_severity)
    return df


if __name__ == "__main__":
    train_anomaly_detector()