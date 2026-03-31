import { Link } from 'react-router-dom'
import { usePlans, useDeletePlan } from '../api/plans'

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans()
  const deletePlan = useDeletePlan()

  if (isLoading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <Link
          to="/plans/generate"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate plan
        </Link>
      </div>

      {!plans?.length && (
        <p className="text-gray-500">No plans yet. Generate one to get started.</p>
      )}

      <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
        {plans?.map((plan) => (
          <li key={plan.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link
                to={`/plans/${plan.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {plan.name}
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">
                {plan.weeks.length} weeks · {new Date(plan.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete "${plan.name}"?`)) deletePlan.mutate(plan.id)
              }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
