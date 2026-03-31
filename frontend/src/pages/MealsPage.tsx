import { Link } from 'react-router-dom'
import { useMeals, useDeleteMeal } from '../api/meals'

export default function MealsPage() {
  const { data: meals, isLoading } = useMeals()
  const deleteMeal = useDeleteMeal()

  if (isLoading) return <p className="text-gray-500">Loading...</p>

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

      {!meals?.length && (
        <p className="text-gray-500">No meals yet. Add one to get started.</p>
      )}

      <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
        {meals?.map((meal) => (
          <li key={meal.id} className="flex items-center justify-between px-4 py-3">
            <Link
              to={`/meals/${meal.id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {meal.name}
            </Link>
            <div className="flex items-center gap-4 text-sm">
              {meal.tags && <span className="text-gray-400">{meal.tags}</span>}
              <span className="text-gray-300">weight {meal.weight}</span>
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
