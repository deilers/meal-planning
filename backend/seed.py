"""
One-time import of reference-script/meals.txt into PostgreSQL.
Duplicate entries in meals.txt are collapsed into a single meal with
a weight equal to the number of times they appeared (capped at 5).
Run: python seed.py
"""
import os
import sys
import uuid
from collections import Counter
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from db import Base, MealRow, SessionLocal, engine, init_db

MEALS_FILE = os.path.join(
    os.path.dirname(__file__), "..", "reference-script", "meals.txt"
)


def seed():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(MealRow).count()
        if existing > 0:
            print(f"Database already has {existing} meals. Skipping seed.")
            print("To re-seed, truncate the meals table first.")
            return

        with open(MEALS_FILE, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        counts = Counter(lines)

        for name, count in counts.items():
            db.add(
                MealRow(
                    id=str(uuid.uuid4()),
                    name=name,
                    recipe="",
                    ingredients="",
                    tags="",
                    weight=min(count, 5),
                    created_at=datetime.now(timezone.utc).isoformat(),
                )
            )

        db.commit()
        print(f"Seeded {len(counts)} meals.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
