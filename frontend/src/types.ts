export interface Meal {
  id: string
  name: string
  recipe: string
  ingredients: string
  tags: string
  weight: number
  enabled: boolean
  created_at: string
}

export interface WeekEntry {
  week: number
  meal_1_id: string
  meal_2_id: string
  meal_1_name: string
  meal_2_name: string
}

export interface Plan {
  id: string
  name: string
  created_at: string
  weeks: WeekEntry[]
}
