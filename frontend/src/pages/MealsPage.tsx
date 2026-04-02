import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMeals, useDeleteMeal, useUpdateMeal } from '../api/meals'

function ToggleEnabled({ id, enabled }: { id: string; enabled: boolean }) {
  const update = useUpdateMeal(id)
  return (
    <button
      onClick={() => update.mutate({ enabled: !enabled })}
      disabled={update.isPending}
      className={`text-xs px-2 py-1 rounded border ${
        enabled
          ? 'border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600'
          : 'border-amber-300 text-amber-600 hover:border-gray-200 hover:text-gray-400'
      }`}
      title={enabled ? 'Disable meal' : 'Enable meal'}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  )
}

export default function MealsPage() {
  const [tagFilter, setTagFilter] = useState('')
  const { data: meals, isLoading } = useMeals(tagFilter || undefined)
  const deleteMeal = useDeleteMeal()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Meals</h1>
        <Link
          to="/meals/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          Add meal
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by tag…"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48"
        />
        {tagFilter && (
          <button
            onClick={() => setTagFilter('')}
            className="ml-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {!isLoading && !meals?.length && (
        <p className="text-gray-500">No meals yet. Add one to get started.</p>
      )}

      <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
        {meals?.map((meal) => (
          <li key={meal.id} className={`flex items-center justify-between px-4 py-3 ${!meal.enabled ? 'opacity-50' : ''}`}>
            <Link
              to={`/meals/${meal.id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {meal.name}
            </Link>
            <div className="flex items-center gap-3 text-sm">
              {meal.tags && <span className="text-gray-400">{meal.tags}</span>}
              <span className="text-gray-300">weight {meal.weight}</span>
              <ToggleEnabled id={meal.id} enabled={meal.enabled} />
              <button
                onClick={() => {
                  if (confirm(`Delete "${meal.name}"?`)) deleteMeal.mutate(meal.id)
                }}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
