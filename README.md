<div align="center">

<img src="frontend/public/logo.png" alt="AtmoSense Logo" width="100" height="100" style="border-radius: 20px"/>

# AtmoSense

### Real-time Global Air Quality Intelligence

**ML-powered AQI prediction · 7-day forecasting · Anomaly detection · SHAP explainability**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-atmo--sense--five.vercel.app-00d4ff?style=for-the-badge&logo=vercel)](https://atmo-sense-five.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-7c3aed?style=for-the-badge&logo=render)](https://atmosense-hpmi.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/GitHub-AtmoSense-1e2d40?style=for-the-badge&logo=github)](https://github.com/HarshitChaudhari/AtmoSense)

![React](https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=flat-square&logo=fastapi)
![XGBoost](https://img.shields.io/badge/XGBoost-99.99%25_CV_Accuracy-FF6600?style=flat-square)
![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-7c3aed?style=flat-square)

</div>

---

## 🌍 Overview

AtmoSense is a full-stack ML dashboard that tracks, predicts, and explains global air quality in real time. It combines three distinct ML paradigms — supervised classification, unsupervised anomaly detection, and time-series forecasting — with a modern React frontend featuring glassmorphism UI, interactive maps, and SHAP-based model explainability.

Built as a final-year B.Tech AI & DS project by **Harshit Chaudhari** at ITMBU Vadodara.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🗺 **World Map** | Leaflet choropleth of AQI across 20 global cities. Click any city to drill down. CartoDB dark tile layer. |
| 📊 **City Deep-Dive** | 365-day historical AQI time series with 7-day EWM forecast band. Pollutant breakdown with WHO limit bars. CSV export. |
| 🤖 **ML Predict** | Live XGBoost inference — input pollutant values, get AQI category + animated probability bars + SHAP waterfall explanation. |
| ⚠️ **Anomaly Feed** | Isolation Forest flags pollution spikes. Severity classified as Critical/High/Medium/Low with anomaly scores. |
| 🔬 **City Compare** | Multi-city radar chart + Pearson correlation matrix + raw pollutant table. Up to 5 cities. |
| 💚 **Health Risk Index** | Composite metric: AQI (60%) × Population Density (40%). Ranked table of 20 cities with animated risk bars. |
| 📈 **Model Insight** | Global SHAP beeswarm, XGBoost feature importance, CV accuracy, training stats, model architecture cards. |

---

## 🧠 ML Architecture

### 1. XGBoost Classifier
- **Task:** 6-class AQI category prediction (Good → Hazardous)
- **Accuracy:** 99.99% CV (5-fold StratifiedKFold)
- **Features:** PM2.5, PM10, NO₂, O₃, CO AQI sub-values
- **Explainability:** SHAP TreeExplainer — per-prediction waterfall + global summary

### 2. Isolation Forest
- **Task:** Unsupervised anomaly detection on pollutant readings
- **Config:** 200 estimators, 3% contamination threshold
- **Output:** Anomaly score + severity classification (Critical/High/Medium/Low)
- **Why it's advanced:** No labels required — learns normal patterns entirely from data distribution

### 3. EWM Forecaster
- **Task:** 7-day city-level AQI forecasting with uncertainty bands
- **Method:** Exponential Weighted Moving Average (α=0.3) with seasonal correction
- **Output:** Predicted AQI + upper/lower confidence bounds per city

---

## 🛠 Tech Stack

### Frontend
```
React 18          TypeScript        Tailwind CSS
Recharts          Leaflet           React Query (TanStack)
Zustand           React Router      Lucide Icons
```

### Backend
```
FastAPI           SQLAlchemy        SQLite (aiosqlite)
Pydantic          Uvicorn           Python-dotenv
```

### ML & Data
```
XGBoost           Scikit-learn      SHAP
Pandas            NumPy             Joblib
OpenAQ API        Open-Meteo API
```

### Deployment
```
Frontend → Vercel
Backend  → Render
CI/CD    → GitHub (auto-deploy on push)
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend

```bash
cd AtmoSense/backend

# Create virtual environment
python -m venv as-env
as-env\Scripts\activate  # Windows
# source as-env/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Train ML models
python ml/train_classifier.py
python ml/train_anomaly.py
python -m ml.train_forecast

# Seed database
python seed_db.py

# Start server
uvicorn main:app --reload
# API live at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### Frontend

```bash
cd AtmoSense/frontend

# Install dependencies
npm install

# Create .env
echo "VITE_API_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
# App live at http://localhost:5173
```

---

## 📁 Project Structure

```
AtmoSense/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── db/
│   │   └── database.py            # SQLAlchemy models + async engine
│   ├── data/
│   │   ├── ingestion.py           # OpenAQ + Open-Meteo API fetching
│   │   └── preprocessor.py        # Feature engineering pipeline
│   ├── ml/
│   │   ├── train_classifier.py    # XGBoost + SHAP training
│   │   ├── train_forecast.py      # EWM forecaster per city
│   │   ├── train_anomaly.py       # Isolation Forest training
│   │   └── shap_explainer.py      # Per-prediction + global SHAP
│   └── routers/
│       ├── map.py                 # /api/map — GeoJSON + health risk
│       ├── city.py                # /api/city — history, forecast, anomalies
│       ├── predict.py             # /api/predict — XGBoost inference
│       └── compare.py             # /api/compare — radar, correlation
│
└── frontend/
    └── src/
        ├── pages/                 # 7 dashboard modules
        ├── components/
        │   ├── layout/            # Sidebar, TopBar
        │   ├── ui/                # AqiBadge, StatCard, AqiGauge
        │   └── charts/            # Recharts wrappers
        ├── api/                   # React Query hooks
        └── store/                 # Zustand global state
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/map/world` | GeoJSON of all city AQI readings |
| GET | `/api/map/health-risk` | Health risk index rankings |
| GET | `/api/city/{city}/history` | Historical pollutant time series |
| GET | `/api/city/{city}/forecast` | 7-day AQI forecast with bands |
| GET | `/api/city/{city}/anomalies` | Isolation Forest anomaly events |
| POST | `/api/predict/` | XGBoost AQI category prediction |
| GET | `/api/predict/shap/global` | Global SHAP feature importance |
| GET | `/api/compare/radar` | Multi-city normalized radar data |
| GET | `/api/compare/correlation` | Pearson AQI correlation matrix |

---

## 👤 Author

**Harshit Chaudhari**
B.Tech AI & DS · ITMBU Vadodara · CGPA 9.1

[![GitHub](https://img.shields.io/badge/GitHub-HarshitChaudhari-181717?style=flat-square&logo=github)](https://github.com/HarshitChaudhari)

---

<div align="center">

**Also check out [Clario](https://clario-liart.vercel.app) — a full-stack RAG PDF chat app**

*Built with React · FastAPI · LangChain · ChromaDB · OpenRouter*

</div>