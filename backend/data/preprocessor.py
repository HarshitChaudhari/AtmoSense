import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import joblib
import os
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv("MODEL_DIR", "./models")

FEATURE_COLS = [
    "pm25", "pm10", "no2", "o3", "co", "so2",
    "temperature", "humidity", "wind_speed",
    "hour", "month", "day_of_week", "is_weekend",
    "pm25_rolling_24h", "pm10_rolling_24h", "no2_rolling_24h",
    "pm25_lag_1", "pm25_lag_6", "pm25_lag_24",
]

AQI_CATEGORIES = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous",
]


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["city", "timestamp"]).reset_index(drop=True)

    numeric_cols = ["pm25", "pm10", "no2", "o3", "co", "so2", "temperature", "humidity", "wind_speed", "aqi"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            upper = df[col].quantile(0.999)
            df.loc[df[col] > upper * 2, col] = np.nan

    return df


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["hour"] = df["timestamp"].dt.hour
    df["month"] = df["timestamp"].dt.month
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    return df


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for city, group in df.groupby("city"):
        idx = group.index
        for col, window in [("pm25", 4), ("pm10", 4), ("no2", 4)]:
            if col in df.columns:
                df.loc[idx, f"{col}_rolling_24h"] = (
                    group[col].rolling(window=window, min_periods=1).mean().values
                )

        if "pm25" in df.columns:
            df.loc[idx, "pm25_lag_1"] = group["pm25"].shift(1).values
            df.loc[idx, "pm25_lag_6"] = group["pm25"].shift(6).values
            df.loc[idx, "pm25_lag_24"] = group["pm25"].shift(24).values

    return df


def encode_target(df: pd.DataFrame) -> tuple[pd.DataFrame, LabelEncoder]:
    df = df.copy()
    le = LabelEncoder()
    le.classes_ = np.array(AQI_CATEGORIES)
    df["aqi_label"] = le.transform(
        df["aqi_category"].fillna("Moderate").apply(
            lambda x: x if x in AQI_CATEGORIES else "Moderate"
        )
    )
    return df, le


def build_feature_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    available = [c for c in FEATURE_COLS if c in df.columns]
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    for col in missing:
        df[col] = 0.0
    X = df[FEATURE_COLS].copy()
    y = df["aqi_label"] if "aqi_label" in df.columns else pd.Series(dtype=int)
    return X, y


def preprocess_for_training(df: pd.DataFrame) -> tuple:
    logger.info("Starting preprocessing pipeline...")
    df = clean(df)
    df = add_time_features(df)
    df = add_rolling_features(df)
    df = df.dropna(subset=["aqi_category"])
    df, le = encode_target(df)

    X, y = build_feature_matrix(df)

    imputer = SimpleImputer(strategy="median")
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=FEATURE_COLS)

    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X_imputed), columns=FEATURE_COLS)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(imputer, f"{MODEL_DIR}/imputer.pkl")
    joblib.dump(scaler, f"{MODEL_DIR}/scaler.pkl")
    joblib.dump(le, f"{MODEL_DIR}/label_encoder.pkl")

    logger.info(f"Preprocessing done. X: {X_scaled.shape}, y classes: {le.classes_}")
    return X_scaled, y, imputer, scaler, le


def preprocess_single(row: dict) -> pd.DataFrame:
    """Preprocess a single prediction request."""
    imputer = joblib.load(f"{MODEL_DIR}/imputer.pkl")
    scaler = joblib.load(f"{MODEL_DIR}/scaler.pkl")

    df = pd.DataFrame([row])
    df["timestamp"] = pd.to_datetime(df.get("timestamp", [pd.Timestamp.utcnow()]))
    df = add_time_features(df)

    for lag_col in ["pm25_rolling_24h", "pm10_rolling_24h", "no2_rolling_24h",
                    "pm25_lag_1", "pm25_lag_6", "pm25_lag_24"]:
        if lag_col not in df.columns:
            df[lag_col] = df.get("pm25", 0)

    X, _ = build_feature_matrix(df)
    X_imputed = pd.DataFrame(imputer.transform(X), columns=FEATURE_COLS)
    X_scaled = pd.DataFrame(scaler.transform(X_imputed), columns=FEATURE_COLS)
    return X_scaled
