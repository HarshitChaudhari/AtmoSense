from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import pandas as pd
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db.database import get_db, CityReading, AnomalyEvent
from ml.train_forecast import forecast_city
import logging

router = APIRouter(prefix="/api/city", tags=["city"])
logger = logging.getLogger(__name__)


@router.get("/{city}/history")
async def get_city_history(
    city: str,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Historical pollutant time series for a city."""
    result = await db.execute(
        text("""
            SELECT timestamp, pm25, pm10, no2, o3, co, so2, aqi, aqi_category,
                   temperature, humidity, wind_speed
            FROM city_readings
            WHERE city = :city
            ORDER BY timestamp DESC
            LIMIT :limit
        """),
        {"city": city, "limit": days * 4},
    )
    rows = result.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No data found for city: {city}")

    data = [dict(row._mapping) for row in rows]
    for d in data:
        if d.get("timestamp"):
            d["timestamp"] = d["timestamp"].isoformat() if hasattr(d["timestamp"], "isoformat") else str(d["timestamp"])

    return {
        "city": city,
        "days": days,
        "records": len(data),
        "history": data,
    }


@router.get("/{city}/forecast")
async def get_city_forecast(
    city: str,
    days: int = Query(7, ge=1, le=14),
):
    """7-day Prophet AQI forecast with uncertainty bands."""
    try:
        forecast_df = forecast_city(city, days=days)
        records = forecast_df.to_dict(orient="records")
        for r in records:
            if hasattr(r.get("datetime"), "isoformat"):
                r["datetime"] = r["datetime"].isoformat()
        return {
            "city": city,
            "forecast_days": days,
            "forecast": records,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.get("/{city}/anomalies")
async def get_city_anomalies(
    city: str,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Recent anomaly events flagged by Isolation Forest."""
    result = await db.execute(
        text("""
            SELECT timestamp, pollutant, value, anomaly_score, severity
            FROM anomaly_events
            WHERE city = :city
            ORDER BY timestamp DESC
            LIMIT :limit
        """),
        {"city": city, "limit": limit},
    )
    rows = result.fetchall()
    events = [dict(row._mapping) for row in rows]
    for e in events:
        if hasattr(e.get("timestamp"), "isoformat"):
            e["timestamp"] = e["timestamp"].isoformat()

    return {"city": city, "anomalies": events, "count": len(events)}


@router.get("/{city}/summary")
async def get_city_summary(city: str, db: AsyncSession = Depends(get_db)):
    """Latest reading + 7-day stats for a city."""
    result = await db.execute(
        text("""
            SELECT * FROM city_readings
            WHERE city = :city
            ORDER BY timestamp DESC LIMIT 1
        """),
        {"city": city},
    )
    latest = result.fetchone()
    if not latest:
        raise HTTPException(status_code=404, detail=f"No data for {city}")

    stats_result = await db.execute(
        text("""
            SELECT
                AVG(pm25) as avg_pm25, MAX(pm25) as max_pm25,
                AVG(aqi) as avg_aqi, MAX(aqi) as max_aqi,
                COUNT(*) as readings
            FROM city_readings
            WHERE city = :city
            AND timestamp >= datetime('now', '-7 days')
        """),
        {"city": city},
    )
    stats = stats_result.fetchone()

    latest_dict = dict(latest._mapping)
    if hasattr(latest_dict.get("timestamp"), "isoformat"):
        latest_dict["timestamp"] = latest_dict["timestamp"].isoformat()

    return {
        "city": city,
        "latest": latest_dict,
        "seven_day_stats": dict(stats._mapping) if stats else {},
    }
