import pandas as pd
import numpy as np
import joblib
import os
import logging
import sys
import warnings
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.ingestion import generate_synthetic_history, TRACKED_CITIES

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
MODEL_DIR = os.getenv("MODEL_DIR", "./models")


def forecast_with_moving_average(city_df: pd.DataFrame, days: int = 7) -> pd.DataFrame:
    """Simple but effective exponential weighted moving average forecast."""
    series = city_df[["timestamp", "aqi"]].dropna().sort_values("timestamp")
    series["timestamp"] = pd.to_datetime(series["timestamp"])
    series = series.set_index("timestamp").resample("6h").mean().fillna(method="ffill")

    alpha = 0.3
    last_values = series["aqi"].ewm(alpha=alpha, adjust=False).mean()
    last_val = float(last_values.iloc[-1])
    std = float(series["aqi"].std())

    future_index = pd.date_range(
        start=series.index[-1] + pd.Timedelta(hours=6),
        periods=days * 4,
        freq="6h"
    )

    predicted = []
    val = last_val
    for i in range(len(future_index)):
        noise = np.random.normal(0, std * 0.05)
        val = val * (1 - alpha) + last_val * alpha + noise
        val = max(0, val)
        predicted.append(val)

    result = pd.DataFrame({
        "datetime": future_index,
        "predicted_aqi": np.round(predicted, 1),
        "lower_bound": np.round(np.array(predicted) - std * 0.5, 1),
        "upper_bound": np.round(np.array(predicted) + std * 0.5, 1),
    })
    result["lower_bound"] = result["lower_bound"].clip(lower=0)
    return result


def train_all_forecasters():
    logger.info("Generating synthetic time-series data for forecasting...")
    df = generate_synthetic_history(days=365)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    os.makedirs(f"{MODEL_DIR}/forecasters", exist_ok=True)
    city_stats = {}

    for city_info in TRACKED_CITIES:
        city = city_info["city"]
        city_df = df[df["city"] == city].copy()
        logger.info(f"Computing forecast model for {city} ({len(city_df)} rows)...")

        series = city_df[["timestamp", "aqi"]].dropna().sort_values("timestamp")
        series["timestamp"] = pd.to_datetime(series["timestamp"])
        series = series.set_index("timestamp").resample("6h").mean().fillna(method="ffill")

        city_stats[city] = {
            "mean": float(series["aqi"].mean()),
            "std": float(series["aqi"].std()),
            "last_value": float(series["aqi"].ewm(alpha=0.3, adjust=False).mean().iloc[-1]),
            "values": series["aqi"].tail(100).tolist(),
        }

    joblib.dump(city_stats, f"{MODEL_DIR}/forecasters/city_stats.pkl")
    joblib.dump({c["city"]: c["city"].replace(" ", "_") for c in TRACKED_CITIES},
                f"{MODEL_DIR}/forecasters/city_index.pkl")

    logger.info(f"Forecast models saved for {len(city_stats)} cities.")
    return city_stats


def forecast_city(city: str, days: int = 7) -> pd.DataFrame:
    city_stats = joblib.load(f"{MODEL_DIR}/forecasters/city_stats.pkl")
    if city not in city_stats:
        raise ValueError(f"No forecast data for city: {city}")

    stats = city_stats[city]
    np.random.seed(42)
    alpha = 0.3
    std = stats["std"]
    val = stats["last_value"]

    future_index = pd.date_range(
        start=pd.Timestamp.utcnow(),
        periods=days * 24,
        freq="h"
    )

    predicted = []
    for _ in range(len(future_index)):
        noise = np.random.normal(0, std * 0.05)
        val = val * (1 - alpha) + stats["mean"] * alpha + noise
        val = max(0, val)
        predicted.append(round(val, 1))

    return pd.DataFrame({
        "datetime": future_index,
        "predicted_aqi": predicted,
        "lower_bound": [max(0, round(p - std * 0.5, 1)) for p in predicted],
        "upper_bound": [round(p + std * 0.5, 1) for p in predicted],
    })


if __name__ == "__main__":
    train_all_forecasters()