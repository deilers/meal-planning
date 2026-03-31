import json
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import get_client
from generator import generate_plan
from models import (
    Meal,
    MealCreate,
    MealUpdate,
    Plan,
    PlanGenerateRequest,
    PlanUpdate,
    WeekEntry,
)

app = FastAPI(title="Meal Planning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_meal(r, meal_id: str) -> dict | None:
    meal = r.hgetall(f"meal:{meal_id}")
    if meal:
        meal["weight"] = int(meal.get("weight", 1))
    return meal or None


def _enrich_plan(r, plan_data: dict) -> dict:
    weeks = json.loads(plan_data.get("weeks", "[]"))
    enriched = []
    for entry in weeks:
        m1 = _get_meal(r, entry["meal_1_id"]) or {}
        m2 = _get_meal(r, entry["meal_2_id"]) or {}
        enriched.append(
            {
                **entry,
                "meal_1_name": m1.get("name", "Unknown"),
                "meal_2_name": m2.get("name", "Unknown"),
            }
        )
    return {**plan_data, "weeks": enriched}


# ── Meals ─────────────────────────────────────────────────────────────────────


@app.get("/api/meals", response_model=list[Meal])
def list_meals(tag: str | None = None):
    r = get_client()
    meals = []
    for mid in r.smembers("meals:all"):
        meal = _get_meal(r, mid)
        if not meal:
            continue
        if tag and tag not in [t.strip() for t in meal.get("tags", "").split(",")]:
            continue
        meals.append(meal)
    return sorted(meals, key=lambda m: m["name"].lower())


@app.post("/api/meals", response_model=Meal, status_code=201)
def create_meal(body: MealCreate):
    r = get_client()
    meal_id = str(uuid.uuid4())
    data = {
        "id": meal_id,
        "name": body.name,
        "recipe": body.recipe,
        "ingredients": body.ingredients,
        "tags": body.tags,
        "weight": str(body.weight),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    r.hset(f"meal:{meal_id}", mapping=data)
    r.sadd("meals:all", meal_id)
    return {**data, "weight": body.weight}


@app.get("/api/meals/{meal_id}", response_model=Meal)
def get_meal(meal_id: str):
    meal = _get_meal(get_client(), meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@app.put("/api/meals/{meal_id}", response_model=Meal)
def update_meal(meal_id: str, body: MealUpdate):
    r = get_client()
    meal = _get_meal(r, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    updates = body.model_dump(exclude_none=True)
    if updates:
        if "weight" in updates:
            updates["weight"] = str(updates["weight"])
        r.hset(f"meal:{meal_id}", mapping=updates)
    return _get_meal(r, meal_id)


@app.delete("/api/meals/{meal_id}", status_code=204)
def delete_meal(meal_id: str):
    r = get_client()
    if not r.exists(f"meal:{meal_id}"):
        raise HTTPException(status_code=404, detail="Meal not found")
    r.delete(f"meal:{meal_id}")
    r.srem("meals:all", meal_id)


# ── Plans ─────────────────────────────────────────────────────────────────────


@app.post("/api/plans/generate", response_model=Plan, status_code=201)
def generate(body: PlanGenerateRequest):
    r = get_client()
    meals = [
        {"id": mid, "weight": int((_get_meal(r, mid) or {}).get("weight", 1))}
        for mid in r.smembers("meals:all")
        if r.exists(f"meal:{mid}")
    ]
    if len(meals) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 meals to generate a plan")

    try:
        weeks = generate_plan(meals, body.weeks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    plan_id = str(uuid.uuid4())
    name = body.name or f"Plan {datetime.now(timezone.utc).strftime('%B %d, %Y')}"
    created_at = datetime.now(timezone.utc).isoformat()
    plan_data = {
        "id": plan_id,
        "name": name,
        "created_at": created_at,
        "weeks": json.dumps(weeks),
    }
    r.hset(f"plan:{plan_id}", mapping=plan_data)
    r.zadd("plans:all", {plan_id: datetime.now(timezone.utc).timestamp()})
    return _enrich_plan(r, plan_data)


@app.get("/api/plans", response_model=list[Plan])
def list_plans():
    r = get_client()
    plans = []
    for pid in r.zrevrange("plans:all", 0, -1):
        plan = r.hgetall(f"plan:{pid}")
        if plan:
            plans.append(_enrich_plan(r, plan))
    return plans


@app.get("/api/plans/{plan_id}", response_model=Plan)
def get_plan(plan_id: str):
    r = get_client()
    plan = r.hgetall(f"plan:{plan_id}")
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _enrich_plan(r, plan)


@app.put("/api/plans/{plan_id}", response_model=Plan)
def update_plan(plan_id: str, body: PlanUpdate):
    r = get_client()
    plan = r.hgetall(f"plan:{plan_id}")
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    updates: dict = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.weeks is not None:
        updates["weeks"] = json.dumps(
            [w.model_dump(exclude={"meal_1_name", "meal_2_name"}) for w in body.weeks]
        )
    if updates:
        r.hset(f"plan:{plan_id}", mapping=updates)
    return _enrich_plan(r, r.hgetall(f"plan:{plan_id}"))


@app.delete("/api/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: str):
    r = get_client()
    if not r.exists(f"plan:{plan_id}"):
        raise HTTPException(status_code=404, detail="Plan not found")
    r.delete(f"plan:{plan_id}")
    r.zrem("plans:all", plan_id)
