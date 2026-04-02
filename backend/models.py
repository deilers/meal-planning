from pydantic import BaseModel, Field
from typing import Optional


class MealCreate(BaseModel):
    name: str
    recipe: str = ""
    ingredients: str = ""
    tags: str = ""
    weight: int = Field(default=1, ge=1, le=5)
    enabled: bool = True


class MealUpdate(BaseModel):
    name: Optional[str] = None
    recipe: Optional[str] = None
    ingredients: Optional[str] = None
    tags: Optional[str] = None
    weight: Optional[int] = Field(default=None, ge=1, le=5)
    enabled: Optional[bool] = None


class Meal(BaseModel):
    id: str
    name: str
    recipe: str = ""
    ingredients: str = ""
    tags: str = ""
    weight: int = 1
    enabled: bool = True
    created_at: str


class WeekEntry(BaseModel):
    week: int
    meal_1_id: str
    meal_2_id: str
    meal_1_name: str = ""
    meal_2_name: str = ""


class PlanGenerateRequest(BaseModel):
    weeks: int = Field(default=4, ge=1, le=52)
    name: str = ""
    tag: Optional[str] = None


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    weeks: Optional[list[WeekEntry]] = None


class Plan(BaseModel):
    id: str
    name: str
    created_at: str
    weeks: list[WeekEntry]
