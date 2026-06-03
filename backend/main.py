from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import sys

sys.path.append(os.path.dirname(__file__))

from db.database import init_db
from routers import map, city, predict, compare

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AtmoSense API starting up...")
    os.makedirs("./db", exist_ok=True)
    os.makedirs("./models", exist_ok=True)
    await init_db()
    logger.info("Database initialized.")

    # Auto-seed if DB is empty
    if count == 0:
        logger.info("Empty DB detected — seeding full history...")
        from data.ingestion import generate_synthetic_history
        df = generate_synthetic_history(days=30)
        batch = []
        for _, row in df.iterrows():
            batch.append(CityReading(
                city=row['city'], country=row['country'],
                lat=row['lat'], lon=row['lon'],
                timestamp=row['timestamp'],
                pm25=row.get('pm25'), pm10=row.get('pm10'),
                no2=row.get('no2'), o3=row.get('o3'),
                co=row.get('co'), so2=row.get('so2'),
                aqi=row.get('aqi'), aqi_category=row.get('aqi_category'),
                temperature=row.get('temperature'),
                humidity=row.get('humidity'), wind_speed=row.get('wind_speed'),
            ))
            if len(batch) >= 500:
                session.add_all(batch)
                await session.flush()
                batch = []
        if batch:
            session.add_all(batch)
        await session.commit()
        logger.info("Auto-seed complete — 30 days of history loaded.")


app = FastAPI(
    title="AtmoSense API",
    description="Real-time global air quality intelligence — ML-powered AQI prediction, forecasting, and anomaly detection.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map.router)
app.include_router(city.router)
app.include_router(predict.router)
app.include_router(compare.router)


@app.get("/")
async def root():
    return {
        "project": "AtmoSense",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": ["/api/map", "/api/city", "/api/predict", "/api/compare"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
