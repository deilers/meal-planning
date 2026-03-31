import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlan, useDeletePlan } from '../api/plans'

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: plan, isLoading } = usePlan(id!)
  const deletePlan = useDeletePlan()

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (!plan) return <p className="text-gray-500">Plan not found.</p>

  function handleDelete() {
    if (confirm(`Delete "${plan!.name}"?`)) {
      deletePlan.mutate(plan!.id, { onSuccess: () => navigate('/plans') })
    }
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
            <div className="flex gap-4">
              <Link
                to={`/meals/${entry.meal_1_id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {entry.meal_1_name}
              </Link>
              <span className="text-gray-300">·</span>
              <Link
                to={`/meals/${entry.meal_2_id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {entry.meal_2_name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
