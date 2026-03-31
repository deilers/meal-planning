# Implementation Plan

## Overview

Expand the reference Python script into a full web application with a meal library, recipe management, and configurable weekly meal plan generation.

**Non-goals (for now):** authentication, Docker/container deployment (deferred until after prototype).

---

## Data Model (Redis)

```
meal:{uuid}          → Hash
  name               string
  recipe             string (markdown)
  ingredients        string (newline-separated)
  tags               string (comma-separated)
  weight             int    (1–5, controls selection frequency)
  created_at         ISO timestamp

meals:all            → Set of meal UUIDs

plan:{uuid}          → Hash
  name               string
  created_at         ISO timestamp
  weeks              JSON (array of {week, meal_1_id, meal_2_id})

plans:all            → Sorted Set  (score = creation timestamp)
```

`weight` replaces the duplicate-entry trick from `meals.txt`. A meal with weight 3 is 3× more likely to be selected during plan generation.

---

## API Surface (FastAPI)

```
# Meals
GET    /api/meals              List all (optional ?tag= filter)
POST   /api/meals              Create
GET    /api/meals/{id}         Get one
PUT    /api/meals/{id}         Update
DELETE /api/meals/{id}         Delete
POST   /api/meals/import       Bulk import from meals.txt format

# Plans
POST   /api/plans/generate     Generate new plan  body: { weeks: int, name: str }
GET    /api/plans              List saved plans
GET    /api/plans/{id}         Get plan + full meal details
PUT    /api/plans/{id}         Update (rename or swap a meal)
DELETE /api/plans/{id}         Delete
```

---

## Frontend Routes

```
/                    Dashboard — latest plan preview + quick actions
/meals               Meal library list with search/filter
/meals/new           Create meal form
/meals/{id}          Meal detail: recipe, ingredients, edit/delete controls
/plans               Plan history list
/plans/generate      Generate form — configurable week count + name
/plans/{id}          Plan view — week-by-week grid, inline meal swapping
```

---

## Generation Algorithm

1. Build a weighted pool (each meal ID repeated `weight` times).
2. For each week, pick 2 meals such that:
   - The two meals are not the same.
   - Neither meal appeared in the previous week (no back-to-back repeats).
3. Remove picked meals from the pool — no full-plan repeats within a single run.
4. Graceful fallback if the pool is exhausted relative to the requested week count (relax constraints or surface an error to the user).

Week count is user-specified at generation time (e.g. 4, 8, 12 weeks).

---

## Implementation Phases

### Phase 1 — Core (MVP)

- [x] Local Redis setup + FastAPI project scaffold
- [x] `seed.py`: import `reference-script/meals.txt` into Redis on first run
- [x] Meal CRUD — all five endpoints wired up and tested
- [x] Plan generation endpoint with configurable week count
- [x] React app scaffold (Vite + TypeScript + Tailwind)
- [x] Meal library page: list, create, edit, delete
- [x] Plan generate page + plan view page

### Phase 2 — Recipes & Rich Data

- [ ] Markdown recipe editor in the meal form
- [ ] Ingredients list editor (add/remove individual items)
- [ ] Meal detail page with rendered recipe and ingredient list

### Phase 3 — Plan Management

- [ ] Inline meal swapping on the plan view page
- [ ] Tag support: add/filter by tags in meal library
- [ ] Weight/frequency control per meal (UI slider or select)
- [ ] Tag-based filtering during plan generation

### Phase 4 — Polish

- [ ] Dashboard with latest plan summary
- [ ] Print/export plan view
- [ ] Bulk re-import / sync from `meals.txt` format (for future batch edits)
- [ ] Docker Compose setup (Redis + backend + frontend)
