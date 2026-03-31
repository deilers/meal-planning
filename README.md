# Meal Planning App

A web application for managing a meal library and generating weekly meal plans.

## Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS + shadcn/ui, TanStack Query
- **Backend**: FastAPI (Python)
- **Database**: Redis (local)

## Project Structure

```
meal-planning/
  backend/
    main.py            FastAPI app + routes
    models.py          Pydantic schemas
    db.py              Redis client + helpers
    generator.py       Plan generation logic
    seed.py            One-time import from meals.txt
    requirements.txt
  frontend/
    src/
      components/      shadcn/ui + shared components
      pages/           Route-level components
      api/             TanStack Query hooks
      types.ts         Shared TypeScript types
    package.json
    vite.config.ts
  reference-script/    Original Python meal picker script
```

## Getting Started

> Prerequisites: Python 3.11+, Node.js 20+, Redis running locally on default port 6379.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Seed the database from the reference meals list (first run only)
python seed.py

# Start the API server
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

## Testing

### Backend

```bash
cd backend
source .venv/bin/activate
pip install -r requirements-dev.txt  # first time only
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run test:run   # single run
npm test           # watch mode
```

## Reference Script

The original `reference-script/meal_picker.py` is preserved for reference. It picks 2 meals/week for a configurable number of weeks from a flat `meals.txt` list, avoiding back-to-back repeats. The web app ports and extends this logic with weighted selection, a full meal library, and saved plan history.
