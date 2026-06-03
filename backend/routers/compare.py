from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
import pandas as pd
import numpy as np
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db.database import get_db

router = APIRouter(prefix="/api/compare", tags=["compare"])

RADAR_METRICS = ["pm25", "pm10", "no2", "o3", "co", "so2"]
NORMALIZERS = {"pm25": 250, "pm10": 430, "no2": 200, "o3": 200, "co": 15, "so2": 75}


def city_placeholders(cities):
    return ",".join([f"'{c}'" for c in cities])


@router.get("/radar")
async def get_radar_data(
    cities: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    city_list = [c.strip() for c in cities.split(",")][:5]
    if len(city_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 cities.")

    placeholders = city_placeholders(city_list)
    result = await db.execute(text(f"""
        SELECT cr.city, cr.pm25, cr.pm10, cr.no2, cr.o3, cr.co, cr.so2, cr.aqi
        FROM city_readings cr
        INNER JOIN (
            SELECT city, MAX(timestamp) as max_ts FROM city_readings
            WHERE city IN ({placeholders}) GROUP BY city
        ) latest ON cr.city = latest.city AND cr.timestamp = latest.max_ts
    """))
    rows = result.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="No data found.")

    radar_data = []
    for row in rows:
        d = dict(row._mapping)
        normalized = {}
        for metric in RADAR_METRICS:
            val = d.get(metric) or 0
            normalized[metric] = round(min(val / NORMALIZERS.get(metric, 100), 1.0) * 100, 1)
        radar_data.append({
            "city": d["city"],
            "raw": {m: d.get(m) for m in RADAR_METRICS},
            "normalized": normalized,
            "aqi": d.get("aqi"),
        })

    return {"cities": city_list, "radar": radar_data, "metrics": RADAR_METRICS}


@router.get("/correlation")
async def get_correlation_matrix(
    cities: str = Query(...),
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
):
    city_list = [c.strip() for c in cities.split(",")][:5]
    placeholders = city_placeholders(city_list)

    result = await db.execute(text(f"""
        SELECT city, timestamp, aqi FROM city_readings
        WHERE city IN ({placeholders})
        AND timestamp >= datetime('now', '-{days} days')
        ORDER BY timestamp
    """))
    rows = result.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="Insufficient data.")

    df = pd.DataFrame([dict(r._mapping) for r in rows])
    df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.floor("6h")
    pivot = df.pivot_table(index="timestamp", columns="city", values="aqi", aggfunc="mean")
    pivot = pivot.ffill().dropna()

    if pivot.shape[0] < 5:
        raise HTTPException(status_code=422, detail="Not enough overlapping data points.")

    corr = pivot.corr().round(3)
    cities_found = corr.columns.tolist()
    matrix = [
        {"city_a": c1, "city_b": c2, "correlation": float(corr.loc[c1, c2])}
        for c1 in cities_found for c2 in cities_found
    ]

    return {"cities": cities_found, "matrix": matrix, "days": days, "n_datapoints": int(pivot.shape[0])}


@router.get("/scatter")
async def get_scatter_data(
    cities: str = Query(...),
    x_metric: str = Query("pm25"),
    y_metric: str = Query("aqi"),
    days: int = Query(14, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
):
    city_list = [c.strip() for c in cities.split(",")][:5]
    placeholders = city_placeholders(city_list)

    result = await db.execute(text(f"""
        SELECT city, {x_metric}, {y_metric}, timestamp
        FROM city_readings
        WHERE city IN ({placeholders})
        AND timestamp >= datetime('now', '-{days} days')
    """))
    rows = result.fetchall()
    data = [dict(r._mapping) for r in rows if r[1] is not None and r[2] is not None]

    return {"x_metric": x_metric, "y_metric": y_metric, "cities": city_list, "points": data}