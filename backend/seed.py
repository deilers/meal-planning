"""
One-time import of reference-script/meals.txt into Redis.
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
from db import get_client

MEALS_FILE = os.path.join(
    os.path.dirname(__file__), "..", "reference-script", "meals.txt"
)


def seed():
    r = get_client()

    existing = r.scard("meals:all")
    if existing > 0:
        print(f"Database already has {existing} meals. Skipping seed.")
        print("To re-seed, flush Redis first: redis-cli FLUSHDB")
        return

    with open(MEALS_FILE, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    counts = Counter(lines)

    for name, count in counts.items():
        meal_id = str(uuid.uuid4())
        r.hset(
            f"meal:{meal_id}",
            mapping={
                "id": meal_id,
                "name": name,
                "recipe": "",
                "ingredients": "",
                "tags": "",
                "weight": str(min(count, 5)),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        r.sadd("meals:all", meal_id)

    print(f"Seeded {len(counts)} meals.")


if __name__ == "__main__":
    seed()
