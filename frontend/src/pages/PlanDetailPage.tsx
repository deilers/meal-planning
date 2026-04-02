import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlan, useDeletePlan, useUpdatePlan } from '../api/plans'
import { useMeals } from '../api/meals'
import type { WeekEntry } from '../types'

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: plan, isLoading } = usePlan(id!)
  const { data: meals } = useMeals()
  const deletePlan = useDeletePlan()
  const updatePlan = useUpdatePlan(id!)
  const [swapping, setSwapping] = useState<{ week: number; slot: 1 | 2 } | null>(null)

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (!plan) return <p className="text-gray-500">Plan not found.</p>

  function handleDelete() {
    if (confirm(`Delete "${plan!.name}"?`)) {
      deletePlan.mutate(plan!.id, { onSuccess: () => navigate('/plans') })
    }
  }

  function handleSwap(weekNum: number, slot: 1 | 2, newMealId: string) {
    const updatedWeeks = plan!.weeks.map((entry) => {
      if (entry.week !== weekNum) return entry
      return slot === 1
        ? { ...entry, meal_1_id: newMealId }
        : { ...entry, meal_2_id: newMealId }
    })
    updatePlan.mutate({ weeks: updatedWeeks as WeekEntry[] }, { onSuccess: () => setSwapping(null) })
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {plan.weeks.length} weeks · Generated {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="space-y-3">
        {plan.weeks.map((entry) => (
          <div
            key={entry.week}
            className="bg-white border border-gray-200 rounded-lg px-4 py-3"
          >
            <p className="text-xs font-medium text-gray-400 mb-2">Week {entry.week}</p>
            <div className="flex gap-4 items-center">
              {([1, 2] as const).map((slot) => {
                const mealId = slot === 1 ? entry.meal_1_id : entry.meal_2_id
                const mealName = slot === 1 ? entry.meal_1_name : entry.meal_2_name
                const isSwapping = swapping?.week === entry.week && swapping?.slot === slot

                return (
                  <div key={slot} className="flex items-center gap-2">
                    {isSwapping ? (
                      <>
                        <select
                          autoFocus
                          defaultValue={mealId}
                          onChange={(e) => handleSwap(entry.week, slot, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          {meals?.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setSwapping(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/meals/${mealId}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {mealName}
                        </Link>
                        <button
                          onClick={() => setSwapping({ week: entry.week, slot })}
                          className="text-xs text-gray-400 hover:text-blue-500"
                        >
                          swap
                        </button>
                      </>
                    )}
                    {slot === 1 && <span className="text-gray-300">·</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
