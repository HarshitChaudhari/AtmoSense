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
    yield
    logger.info("AtmoSense API shutting down.")


app = FastAPI(
    title="AtmoSense API",
    description="Real-time global air quality intelligence.",
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
    return {"project": "AtmoSense", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}