import { http, HttpResponse } from 'msw'
import type { Meal, Plan } from '../types'

export const mockMeals: Meal[] = [
  { id: '1', name: 'Tacos', recipe: 'Cook the beef.', ingredients: 'Beef\nCheese', tags: 'mexican', weight: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Spaghetti', recipe: '', ingredients: '', tags: 'italian', weight: 1, created_at: '2026-01-01T00:00:00Z' },
]

export const mockPlans: Plan[] = [
  {
    id: 'p1',
    name: 'April Plan',
    created_at: '2026-04-01T00:00:00Z',
    weeks: [
      { week: 1, meal_1_id: '1', meal_2_id: '2', meal_1_name: 'Tacos', meal_2_name: 'Spaghetti' },
      { week: 2, meal_1_id: '2', meal_2_id: '1', meal_1_name: 'Spaghetti', meal_2_name: 'Tacos' },
    ],
  },
]

export const handlers = [
  http.get('/api/meals', () => HttpResponse.json(mockMeals)),

  http.get('/api/meals/:id', ({ params }) => {
    const meal = mockMeals.find((m) => m.id === params.id)
    return meal
      ? HttpResponse.json(meal)
      : new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/meals', async ({ request }) => {
    const body = (await request.json()) as Partial<Meal>
    const meal: Meal = {
      id: 'new-meal',
      name: body.name ?? '',
      recipe: body.recipe ?? '',
      ingredients: body.ingredients ?? '',
      tags: body.tags ?? '',
      weight: body.weight ?? 1,
      created_at: '2026-01-01T00:00:00Z',
    }
    return HttpResponse.json(meal, { status: 201 })
  }),

  http.put('/api/meals/:id', async ({ params, request }) => {
    const meal = mockMeals.find((m) => m.id === params.id)
    if (!meal) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as Partial<Meal>
    return HttpResponse.json({ ...meal, ...body })
  }),

  http.delete('/api/meals/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/plans', () => HttpResponse.json(mockPlans)),

  http.get('/api/plans/:id', ({ params }) => {
    const plan = mockPlans.find((p) => p.id === params.id)
    return plan
      ? HttpResponse.json(plan)
      : new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/plans/generate', async ({ request }) => {
    const body = (await request.json()) as { weeks: number; name: string }
    const plan: Plan = {
      id: 'new-plan',
      name: body.name || 'Generated Plan',
      created_at: '2026-04-01T00:00:00Z',
      weeks: Array.from({ length: body.weeks }, (_, i) => ({
        week: i + 1,
        meal_1_id: '1',
        meal_2_id: '2',
        meal_1_name: 'Tacos',
        meal_2_name: 'Spaghetti',
      })),
    }
    return HttpResponse.json(plan, { status: 201 })
  }),

  http.delete('/api/plans/:id', () => new HttpResponse(null, { status: 204 })),
]
