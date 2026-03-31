# Architecture

## System Overview

The app is a standard three-tier web application: a React SPA, a Python REST API, and PostgreSQL as the data store. In local development the Vite dev server proxies all `/api` requests to FastAPI, so the browser only ever talks to one origin.

```mermaid
graph LR
    Browser["Browser<br/>React SPA"]
    Vite["Vite Dev Server<br/>localhost:5173"]
    FastAPI["FastAPI<br/>localhost:8000"]
    PG["PostgreSQL<br/>localhost:5432"]

    Browser -- "HTTP" --> Vite
    Vite -- "/api/* proxy" --> FastAPI
    FastAPI -- "SQLAlchemy" --> PG
```

---

## Request Flow

A typical data-fetch cycle from the browser's perspective:

```mermaid
sequenceDiagram
    participant Browser
    participant Vite
    participant FastAPI
    participant PG

    Browser->>Vite: GET /api/meals
    Vite->>FastAPI: GET /api/meals (proxied)
    FastAPI->>PG: SELECT * FROM meals ORDER BY name
    PG-->>FastAPI: rows
    FastAPI-->>Vite: JSON array (sorted by name)
    Vite-->>Browser: JSON array
    Note over Browser: TanStack Query caches result
```

---

## Data Model (PostgreSQL)

Two tables. Plan weeks are stored as a JSON column — no join table needed at this scale.

```mermaid
erDiagram
    meals {
        string id PK
        string name
        text   recipe
        text   ingredients
        string tags
        int    weight
        string created_at
    }

    plans {
        string id PK
        string name
        string created_at
        text   weeks
    }

    plans }o--o{ meals : "weeks JSON references meal IDs"
```

**Table notes:**

| Table | Notable columns |
|---|---|
| `meals` | `weight` 1–5 controls selection frequency; `tags` is a comma-separated string |
| `plans` | `weeks` stores a JSON array of `{week, meal_1_id, meal_2_id}`; meal names are resolved at read time |

---

## Backend Structure

```mermaid
graph TD
    main["main.py<br/>FastAPI routes"]
    models["models.py<br/>Pydantic schemas"]
    db["db.py<br/>SQLAlchemy models + session"]
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
