from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from ml.shap_explainer import explain_prediction, get_global_shap
import logging

router = APIRouter(prefix="/api/predict", tags=["predict"])
logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv("MODEL_DIR", "./models")

FEATURE_COLS = [
    "aqi_value",
    "co_aqi_value",
    "ozone_aqi_value",
    "no2_aqi_value",
    "pm25_aqi_value",
]


class PredictRequest(BaseModel):
    aqi_value: float = Field(..., ge=0, le=500, description="Overall AQI value")
    co_aqi_value: Optional[float] = Field(None, ge=0, le=500, description="CO AQI value")
    ozone_aqi_value: Optional[float] = Field(None, ge=0, le=500, description="Ozone AQI value")
    no2_aqi_value: Optional[float] = Field(None, ge=0, le=500, description="NO2 AQI value")
    pm25_aqi_value: Optional[float] = Field(None, ge=0, le=500, description="PM2.5 AQI value")


def preprocess_input(request: PredictRequest) -> pd.DataFrame:
    imputer = joblib.load(f"{MODEL_DIR}/imputer.pkl")
    scaler = joblib.load(f"{MODEL_DIR}/scaler.pkl")

    row = {
        "aqi_value": request.aqi_value,
        "co_aqi_value": request.co_aqi_value,
        "ozone_aqi_value": request.ozone_aqi_value,
        "no2_aqi_value": request.no2_aqi_value,
        "pm25_aqi_value": request.pm25_aqi_value,
    }

    X = pd.DataFrame([row], columns=FEATURE_COLS)
    X_imputed = pd.DataFrame(imputer.transform(X), columns=FEATURE_COLS)
    X_scaled = pd.DataFrame(scaler.transform(X_imputed), columns=FEATURE_COLS)
    return X_scaled


@router.post("/")
async def predict_aqi(request: PredictRequest):
    """
    Predict AQI category from pollutant AQI sub-values.
    Returns predicted class, probabilities, and SHAP waterfall explanation.
    """
    try:
        X = preprocess_input(request)
        result = explain_prediction(X)
        return {"status": "success", "prediction": result}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run python ml/train_classifier.py first."
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/shap/global")
async def get_global_shap_summary():
    """Global SHAP feature importance for the Model Insight page."""
    try:
        return get_global_shap()
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="SHAP data not available. Run train_classifier.py first."
        )