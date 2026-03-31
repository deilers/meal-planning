import json
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import MealRow, PlanRow, get_session, init_db
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Meal Planning API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _row_to_meal(row: MealRow) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "recipe": row.recipe or "",
        "ingredients": row.ingredients or "",
        "tags": row.tags or "",
        "weight": row.weight,
        "created_at": row.created_at,
    }


def _enrich_plan(db: Session, row: PlanRow) -> dict:
    weeks = json.loads(row.weeks)
    enriched = []
    for entry in weeks:
        m1 = db.get(MealRow, entry["meal_1_id"])
        m2 = db.get(MealRow, entry["meal_2_id"])
        enriched.append(
            {
                **entry,
                "meal_1_name": m1.name if m1 else "Unknown",
                "meal_2_name": m2.name if m2 else "Unknown",
            }
        )
    return {
        "id": row.id,
        "name": row.name,
        "created_at": row.created_at,
        "weeks": enriched,
    }


# ── Meals ─────────────────────────────────────────────────────────────────────


@app.get("/api/meals", response_model=list[Meal])
def list_meals(tag: str | None = None, db: Session = Depends(get_session)):
    rows = db.query(MealRow).order_by(MealRow.name).all()
    meals = [_row_to_meal(r) for r in rows]
    if tag:
        meals = [m for m in meals if tag in [t.strip() for t in m["tags"].split(",")]]
    return meals


@app.post("/api/meals", response_model=Meal, status_code=201)
def create_meal(body: MealCreate, db: Session = Depends(get_session)):
    meal = MealRow(
        id=str(uuid.uuid4()),
        name=body.name,
        recipe=body.recipe,
        ingredients=body.ingredients,
        tags=body.tags,
        weight=body.weight,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return _row_to_meal(meal)


@app.get("/api/meals/{meal_id}", response_model=Meal)
def get_meal(meal_id: str, db: Session = Depends(get_session)):
    meal = db.get(MealRow, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return _row_to_meal(meal)


@app.put("/api/meals/{meal_id}", response_model=Meal)
def update_meal(meal_id: str, body: MealUpdate, db: Session = Depends(get_session)):
    meal = db.get(MealRow, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(meal, field, value)
    db.commit()
    db.refresh(meal)
    return _row_to_meal(meal)


@app.delete("/api/meals/{meal_id}", status_code=204)
def delete_meal(meal_id: str, db: Session = Depends(get_session)):
    meal = db.get(MealRow, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()


# ── Plans ─────────────────────────────────────────────────────────────────────


@app.post("/api/plans/generate", response_model=Plan, status_code=201)
def generate(body: PlanGenerateRequest, db: Session = Depends(get_session)):
    meals = [{"id": r.id, "weight": r.weight} for r in db.query(MealRow).all()]
    if len(meals) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 meals to generate a plan")

    try:
        weeks = generate_plan(meals, body.weeks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    plan = PlanRow(
        id=str(uuid.uuid4()),
        name=body.name or f"Plan {datetime.now(timezone.utc).strftime('%B %d, %Y')}",
        created_at=datetime.now(timezone.utc).isoformat(),
        weeks=json.dumps(weeks),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _enrich_plan(db, plan)


@app.get("/api/plans", response_model=list[Plan])
def list_plans(db: Session = Depends(get_session)):
    rows = db.query(PlanRow).order_by(PlanRow.created_at.desc()).all()
    return [_enrich_plan(db, r) for r in rows]


@app.get("/api/plans/{plan_id}", response_model=Plan)
def get_plan(plan_id: str, db: Session = Depends(get_session)):
    plan = db.get(PlanRow, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _enrich_plan(db, plan)


@app.put("/api/plans/{plan_id}", response_model=Plan)
def update_plan(plan_id: str, body: PlanUpdate, db: Session = Depends(get_session)):
    plan = db.get(PlanRow, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if body.name is not None:
        plan.name = body.name
    if body.weeks is not None:
        plan.weeks = json.dumps(
            [w.model_dump(exclude={"meal_1_name", "meal_2_name"}) for w in body.weeks]
        )
    db.commit()
    db.refresh(plan)
    return _enrich_plan(db, plan)


@app.delete("/api/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: str, db: Session = Depends(get_session)):
    plan = db.get(PlanRow, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
