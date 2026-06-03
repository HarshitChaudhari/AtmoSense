import httpx
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import logging

logger = logging.getLogger(__name__)

OPENAQ_BASE = os.getenv("OPENAQ_BASE_URL", "https://api.openaq.org/v2")
OPEN_METEO_BASE = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "")

TRACKED_CITIES = [
    {"city": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090},
    {"city": "Mumbai", "country": "India", "lat": 19.0760, "lon": 72.8777},
    {"city": "Beijing", "country": "China", "lat": 39.9042, "lon": 116.4074},
    {"city": "Shanghai", "country": "China", "lat": 31.2304, "lon": 121.4737},
    {"city": "Los Angeles", "country": "USA", "lat": 34.0522, "lon": -118.2437},
    {"city": "New York", "country": "USA", "lat": 40.7128, "lon": -74.0060},
    {"city": "London", "country": "UK", "lat": 51.5074, "lon": -0.1278},
    {"city": "Paris", "country": "France", "lat": 48.8566, "lon": 2.3522},
    {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503},
    {"city": "São Paulo", "country": "Brazil", "lat": -23.5505, "lon": -46.6333},
    {"city": "Cairo", "country": "Egypt", "lat": 30.0444, "lon": 31.2357},
    {"city": "Lahore", "country": "Pakistan", "lat": 31.5204, "lon": 74.3587},
    {"city": "Dhaka", "country": "Bangladesh", "lat": 23.8103, "lon": 90.4125},
    {"city": "Karachi", "country": "Pakistan", "lat": 24.8607, "lon": 67.0011},
    {"city": "Bangkok", "country": "Thailand", "lat": 13.7563, "lon": 100.5018},
    {"city": "Jakarta", "country": "Indonesia", "lat": -6.2088, "lon": 106.8456},
    {"city": "Sydney", "country": "Australia", "lat": -33.8688, "lon": 151.2093},
    {"city": "Toronto", "country": "Canada", "lat": 43.6532, "lon": -79.3832},
    {"city": "Berlin", "country": "Germany", "lat": 52.5200, "lon": 13.4050},
    {"city": "Seoul", "country": "South Korea", "lat": 37.5665, "lon": 126.9780},
]


async def fetch_weather(client: httpx.AsyncClient, lat: float, lon: float) -> Dict:
    """Fetch current weather from Open-Meteo (free, no key needed)."""
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
            "timezone": "auto",
        }
        r = await client.get(f"{OPEN_METEO_BASE}/forecast", params=params, timeout=10)
        r.raise_for_status()
        curr = r.json().get("current", {})
        return {
            "temperature": curr.get("temperature_2m"),
            "humidity": curr.get("relative_humidity_2m"),
            "wind_speed": curr.get("wind_speed_10m"),
        }
    except Exception as e:
        logger.warning(f"Weather fetch failed for ({lat},{lon}): {e}")
        return {"temperature": None, "humidity": None, "wind_speed": None}


async def fetch_openaq(client: httpx.AsyncClient, city: str) -> Dict:
    """Fetch latest pollutant readings from OpenAQ v2."""
    try:
        headers = {"X-API-Key": OPENAQ_API_KEY} if OPENAQ_API_KEY else {}
        params = {"city": city, "limit": 10, "order_by": "lastUpdated", "sort": "desc"}
        r = await client.get(f"{OPENAQ_BASE}/latest", params=params, headers=headers, timeout=10)
        r.raise_for_status()
        results = r.json().get("results", [])
        pollutants = {}
        for item in results:
            for m in item.get("measurements", []):
                param = m.get("parameter", "").lower()
                val = m.get("value")
                if param in ["pm25", "pm10", "no2", "o3", "co", "so2"] and val and val > 0:
                    pollutants[param] = round(val, 2)
        return pollutants
    except Exception as e:
        logger.warning(f"OpenAQ fetch failed for {city}: {e}")
        return {}


def compute_aqi(pm25: Optional[float]) -> tuple[Optional[float], Optional[str]]:
    """US EPA AQI formula from PM2.5 concentration."""
    if pm25 is None:
        return None, None

    breakpoints = [
        (0.0, 12.0, 0, 50, "Good"),
        (12.1, 35.4, 51, 100, "Moderate"),
        (35.5, 55.4, 101, 150, "Unhealthy for Sensitive Groups"),
        (55.5, 150.4, 151, 200, "Unhealthy"),
        (150.5, 250.4, 201, 300, "Very Unhealthy"),
        (250.5, 500.4, 301, 500, "Hazardous"),
    ]

    for c_lo, c_hi, i_lo, i_hi, category in breakpoints:
        if c_lo <= pm25 <= c_hi:
            aqi = ((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo
            return round(aqi, 1), category

    return None, None


async def ingest_all_cities() -> pd.DataFrame:
    """Fetch live data for all tracked cities concurrently."""
    records = []

    async with httpx.AsyncClient() as client:
        tasks = []
        for city_info in TRACKED_CITIES:
            tasks.append(
                asyncio.gather(
                    fetch_openaq(client, city_info["city"]),
                    fetch_weather(client, city_info["lat"], city_info["lon"]),
                )
            )
        results = await asyncio.gather(*tasks)

    for city_info, (pollutants, weather) in zip(TRACKED_CITIES, results):
        pm25 = pollutants.get("pm25")
        aqi_val, aqi_cat = compute_aqi(pm25)

        records.append({
            "city": city_info["city"],
            "country": city_info["country"],
            "lat": city_info["lat"],
            "lon": city_info["lon"],
            "timestamp": datetime.utcnow(),
            "pm25": pm25,
            "pm10": pollutants.get("pm10"),
            "no2": pollutants.get("no2"),
            "o3": pollutants.get("o3"),
            "co": pollutants.get("co"),
            "so2": pollutants.get("so2"),
            "aqi": aqi_val,
            "aqi_category": aqi_cat,
            "temperature": weather.get("temperature"),
            "humidity": weather.get("humidity"),
            "wind_speed": weather.get("wind_speed"),
        })

    df = pd.DataFrame(records)
    logger.info(f"Ingested {len(df)} city records at {datetime.utcnow()}")
    return df


def generate_synthetic_history(days: int = 365) -> pd.DataFrame:
    """
    Generate realistic synthetic historical data for training.
    Used when live API data is insufficient for ML training.
    """
    np.random.seed(42)
    records = []
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    for city_info in TRACKED_CITIES:
        city = city_info["city"]
        base_pm25 = {
            "Delhi": 90, "Lahore": 85, "Dhaka": 80, "Karachi": 75,
            "Beijing": 70, "Cairo": 65, "Jakarta": 55, "Mumbai": 60,
            "Shanghai": 50, "Bangkok": 45, "São Paulo": 40, "Seoul": 38,
            "Tokyo": 25, "Los Angeles": 28, "Paris": 18, "Berlin": 15,
            "London": 16, "New York": 20, "Toronto": 14, "Sydney": 10,
        }.get(city, 35)

        current = start
        while current <= end:
            hour = current.hour
            month = current.month

            seasonal = 15 * np.sin(2 * np.pi * (month - 1) / 12)
            diurnal = 10 * np.sin(2 * np.pi * (hour - 6) / 24)
            noise = np.random.normal(0, base_pm25 * 0.15)
            spike = np.random.choice([0, base_pm25 * 1.5], p=[0.97, 0.03])

            pm25 = max(1.0, base_pm25 + seasonal + diurnal + noise + spike)
            pm10 = pm25 * np.random.uniform(1.4, 1.8)
            no2 = max(0, np.random.normal(40, 15))
            o3 = max(0, np.random.normal(60, 20))
            temp = np.random.normal(20, 10)
            humidity = np.clip(np.random.normal(60, 20), 10, 100)
            wind = max(0, np.random.normal(10, 5))

            aqi_val, aqi_cat = compute_aqi(pm25)

            records.append({
                "city": city,
                "country": city_info["country"],
                "lat": city_info["lat"],
                "lon": city_info["lon"],
                "timestamp": current,
                "pm25": round(pm25, 2),
                "pm10": round(pm10, 2),
                "no2": round(no2, 2),
                "o3": round(o3, 2),
                "co": round(np.random.uniform(0.5, 5), 2),
                "so2": round(np.random.uniform(2, 30), 2),
                "aqi": aqi_val,
                "aqi_category": aqi_cat,
                "temperature": round(temp, 1),
                "humidity": round(humidity, 1),
                "wind_speed": round(wind, 1),
            })
            current += timedelta(hours=6)

    df = pd.DataFrame(records)
    logger.info(f"Generated {len(df)} synthetic historical records")
    return df
