from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import pandas as pd
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db.database import get_db, CityReading
from data.ingestion import ingest_all_cities, TRACKED_CITIES, compute_aqi
from ml.train_anomaly import detect_anomalies
import asyncio
import logging

router = APIRouter(prefix="/api/map", tags=["map"])
logger = logging.getLogger(__name__)

POPULATION_DENSITY = {
    "Delhi": 11320, "Mumbai": 20694, "Beijing": 1311, "Shanghai": 3816,
    "Los Angeles": 3276, "New York": 10194, "London": 5598, "Paris": 20164,
    "Tokyo": 6158, "São Paulo": 7786, "Cairo": 19376, "Lahore": 6318,
    "Dhaka": 44500, "Karachi": 24000, "Bangkok": 5343, "Jakarta": 15400,
    "Sydney": 433, "Toronto": 4457, "Berlin": 4090, "Seoul": 16364,
}

def compute_health_risk(aqi: float, pop_density: float) -> float:
    if aqi is None:
        return 0.0
    norm_aqi = min(aqi / 500, 1.0)
    norm_pop = min(pop_density / 50000, 1.0)
    return round((0.6 * norm_aqi + 0.4 * norm_pop) * 100, 1)


@router.get("/world")
async def get_world_aqi(
    refresh: bool = Query(False, description="Force live API refresh"),
    db: AsyncSession = Depends(get_db),
):
    """Returns GeoJSON FeatureCollection of latest AQI per city."""
    if refresh:
        try:
            df = await ingest_all_cities()
            df = detect_anomalies(df)
            await _save_readings(db, df)
        except Exception as e:
            logger.warning(f"Live ingestion failed, using cached data: {e}")

    rows = await _get_latest_per_city(db)

    features = []
    for row in rows:
        pop_density = POPULATION_DENSITY.get(row.city, 5000)
        health_risk = compute_health_risk(row.aqi, pop_density)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row.lon, row.lat]},
            "properties": {
                "city": row.city,
                "country": row.country,
                "aqi": row.aqi,
                "aqi_category": row.aqi_category,
                "pm25": row.pm25,
                "no2": row.no2,
                "o3": row.o3,
                "temperature": row.temperature,
                "humidity": row.humidity,
                "health_risk_score": health_risk,
                "population_density": pop_density,
                "timestamp": str(row.timestamp) if row.timestamp else None,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
        "total": len(features),
    }


@router.get("/health-risk")
async def get_health_risk_index(db: AsyncSession = Depends(get_db)):
    """Ranked health risk index across all tracked cities."""
    rows = await _get_latest_per_city(db)
    risks = []
    for row in rows:
        pd_ = POPULATION_DENSITY.get(row.city, 5000)
        risks.append({
            "city": row.city,
            "country": row.country,
            "aqi": row.aqi,
            "aqi_category": row.aqi_category,
            "population_density": pd_,
            "health_risk_score": compute_health_risk(row.aqi or 0, pd_),
            "pm25": row.pm25,
        })
    risks.sort(key=lambda x: x["health_risk_score"], reverse=True)
    return {"rankings": risks}


async def _get_latest_per_city(db: AsyncSession):
    result = await db.execute(
        text("""
            SELECT cr.* FROM city_readings cr
            INNER JOIN (
                SELECT city, MAX(timestamp) as max_ts
                FROM city_readings GROUP BY city
            ) latest ON cr.city = latest.city AND cr.timestamp = latest.max_ts
        """)
    )
    return result.fetchall()


async def _save_readings(db: AsyncSession, df: pd.DataFrame):
    for _, row in df.iterrows():
        reading = CityReading(
            city=row.get("city"), country=row.get("country"),
            lat=row.get("lat"), lon=row.get("lon"),
            timestamp=row.get("timestamp"),
            pm25=row.get("pm25"), pm10=row.get("pm10"),
            no2=row.get("no2"), o3=row.get("o3"),
            co=row.get("co"), so2=row.get("so2"),
            aqi=row.get("aqi"), aqi_category=row.get("aqi_category"),
            temperature=row.get("temperature"),
            humidity=row.get("humidity"), wind_speed=row.get("wind_speed"),
        )
        db.add(reading)
    await db.commit()