# Architecture

## System Overview

The app is a standard three-tier web application: a React SPA, a Python REST API, and Redis as the data store. In local development the Vite dev server proxies all `/api` requests to FastAPI, so the browser only ever talks to one origin.

```mermaid
graph LR
    Browser["Browser<br/>React SPA"]
    Vite["Vite Dev Server<br/>localhost:5173"]
    FastAPI["FastAPI<br/>localhost:8000"]
    Redis["Redis<br/>localhost:6379"]

    Browser -- "HTTP" --> Vite
    Vite -- "/api/* proxy" --> FastAPI
    FastAPI -- "redis-py" --> Redis
```

---

## Request Flow

A typical data-fetch cycle from the browser's perspective:

```mermaid
sequenceDiagram
    participant Browser
    participant Vite
    participant FastAPI
    participant Redis

    Browser->>Vite: GET /api/meals
    Vite->>FastAPI: GET /api/meals (proxied)
    FastAPI->>Redis: SMEMBERS meals:all
    Redis-->>FastAPI: [uuid-1, uuid-2, ...]
    loop for each UUID
        FastAPI->>Redis: HGETALL meal:{uuid}
        Redis-->>FastAPI: {id, name, weight, ...}
    end
    FastAPI-->>Vite: JSON array (sorted by name)
    Vite-->>Browser: JSON array
    Note over Browser: TanStack Query caches result
```

---

## Data Model (Redis)

Redis key layout. There are no joins — plan weeks store meal IDs, and meal names are resolved by the API at read time.

```mermaid
erDiagram
    MEAL_HASH {
        string id
        string name
        string recipe
        string ingredients
        string tags
        int    weight
        string created_at
    }

    PLAN_HASH {
        string id
        string name
        string created_at
        json   weeks
    }

    MEALS_INDEX {
        string type "Redis Set"
        string description "Index of all meal UUIDs"
    }

    PLANS_INDEX {
        string type "Redis Sorted Set"
        string description "Scored by creation timestamp"
    }

    MEALS_INDEX ||--o{ MEAL_HASH : "member to key meal:{uuid}"
    PLANS_INDEX ||--o{ PLAN_HASH : "member to key plan:{uuid}"
    PLAN_HASH }o--o{ MEAL_HASH : "weeks JSON references meal IDs"
```

**Key naming:**

| Key | Type | Purpose |
|---|---|---|
| `meal:{uuid}` | Hash | All fields for one meal |
| `meals:all` | Set | Index of all meal UUIDs |
| `plan:{uuid}` | Hash | All fields for one plan (weeks stored as JSON) |
| `plans:all` | Sorted Set | Index of all plan UUIDs, scored by creation time |

---

## Backend Structure

```mermaid
graph TD
    main["main.py<br/>FastAPI routes"]
    models["models.py<br/>Pydantic schemas"]
    db["db.py<br/>Redis client"]
    generator["generator.py<br/>Plan generation logic"]
    seed["seed.py<br/>One-time data import"]

    main --> models
    main --> db
    main --> generator
    seed --> db
```

All modules are flat in `backend/`. No package structure — imports are direct.

---

## Frontend Structure

```mermaid
graph TD
    main["main.tsx<br/>App entry point"]
    App["App.tsx<br/>Router + nav"]

    main --> App

    App --> MealsPage
    App --> MealDetailPage
    App --> MealNewPage
    App --> PlansPage
    App --> PlanDetailPage
    App --> PlanGeneratePage

    MealNewPage -- "exports MealForm" --> MealDetailPage

    subgraph "api/ — TanStack Query hooks"
        useMeals
        useMeal
        useCreateMeal
        useUpdateMeal
        useDeleteMeal
        usePlans
        usePlan
        useGeneratePlan
        useDeletePlan
    end

    MealsPage --> useMeals
    MealsPage --> useDeleteMeal
    MealDetailPage --> useMeal
    MealDetailPage --> useUpdateMeal
    MealDetailPage --> useDeleteMeal
    MealNewPage --> useCreateMeal
    PlansPage --> usePlans
    PlansPage --> useDeletePlan
    PlanDetailPage --> usePlan
    PlanDetailPage --> useDeletePlan
    PlanGeneratePage --> useGeneratePlan
```

---

## Plan Generation Algorithm

```mermaid
flowchart TD
    A([Start]) --> B["Build weighted pool<br/>Each meal ID repeated weight times"]
    B --> C["week = 1"]
    C --> D["available = pool items<br/>not in previous week"]
    D --> E{≥ 2 unique<br/>available?}
    E -- No --> F["Relax: use full<br/>remaining pool"]
    F --> G{≥ 2 unique<br/>remaining?}
    G -- No --> H([Raise ValueError])
    G -- Yes --> I
    E -- Yes --> I["Pick meal_1 at random<br/>from available"]
    I --> J["Pick meal_2 at random<br/>(must differ from meal_1)"]
    J --> K["Remove one occurrence of<br/>each from pool"]
    K --> L["Append week entry<br/>{week, meal_1_id, meal_2_id}"]
    L --> M{week ==<br/>num_weeks?}
    M -- No --> N["week += 1<br/>previous = {meal_1, meal_2}"]
    N --> D
    M -- Yes --> O([Return plan])
```

**Key properties the algorithm guarantees:**
- No meal appears twice in the same week
- No meal carries over from the previous week (back-to-back constraint)
- Each meal is removed from the pool after selection — within a single run, a meal can only repeat if its `weight` is > 1
- Constraints are relaxed gracefully when the pool runs low, rather than failing silently
