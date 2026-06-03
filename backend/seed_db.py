import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from db.database import init_db, AsyncSessionLocal, CityReading, AnomalyEvent
from data.ingestion import generate_synthetic_history, TRACKED_CITIES
from datetime import datetime
import random

async def seed():
    await init_db()

    print("Generating 365-day synthetic history (this takes ~30 seconds)...")
    df = generate_synthetic_history(days=365)
    print(f"Generated {len(df)} records for {df['city'].nunique()} cities")

    async with AsyncSessionLocal() as session:
        print("Inserting city readings in batches...")
        batch_size = 500
        records = []
        for _, row in df.iterrows():
            records.append(CityReading(
                city=row['city'], country=row['country'],
                lat=row['lat'], lon=row['lon'],
                timestamp=row['timestamp'],
                pm25=row.get('pm25'), pm10=row.get('pm10'),
                no2=row.get('no2'), o3=row.get('o3'),
                co=row.get('co'), so2=row.get('so2'),
                aqi=row.get('aqi'), aqi_category=row.get('aqi_category'),
                temperature=row.get('temperature'),
                humidity=row.get('humidity'),
                wind_speed=row.get('wind_speed'),
            ))
            if len(records) >= batch_size:
                session.add_all(records)
                await session.flush()
                records = []
                print(f"  Inserted batch...")

        if records:
            session.add_all(records)

        # Seed anomaly events
        print("Seeding anomaly events...")
        severities = ['Critical', 'High', 'Medium', 'Low']
        pollutants = ['pm25', 'pm10', 'no2', 'o3']
        now = datetime.utcnow()
        from datetime import timedelta

        for city_info in TRACKED_CITIES:
            city = city_info['city']
            n_events = random.randint(3, 10)
            for _ in range(n_events):
                severity = random.choice(severities)
                score_map = {'Critical': -0.4, 'High': -0.2, 'Medium': -0.05, 'Low': 0.05}
                session.add(AnomalyEvent(
                    city=city,
                    timestamp=now - timedelta(hours=random.randint(1, 720)),
                    pollutant=random.choice(pollutants),
                    value=round(random.uniform(150, 450), 1),
                    anomaly_score=round(score_map[severity] + random.uniform(-0.05, 0.05), 4),
                    severity=severity,
                    detected_at=now,
                ))

        await session.commit()

    print(f"\nDone! Seeded {len(df)} readings + anomaly events for all 20 cities.")
    print("City Deep-Dive time series charts will now show full historical data.")

if __name__ == "__main__":
    asyncio.run(seed())