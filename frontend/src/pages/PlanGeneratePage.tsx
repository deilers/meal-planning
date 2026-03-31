import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGeneratePlan } from '../api/plans'
import type { AxiosError } from 'axios'

export default function PlanGeneratePage() {
  const navigate = useNavigate()
  const generatePlan = useGeneratePlan()
  const [form, setForm] = useState({ weeks: 4, name: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    generatePlan.mutate(form, { onSuccess: (plan) => navigate(`/plans/${plan.id}`) })
  }

  const errorMsg = generatePlan.error
    ? ((generatePlan.error as AxiosError<{ detail: string }>).response?.data?.detail ?? 'Something went wrong.')
    : null

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold mb-6">Generate Plan</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. April 2026"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of weeks</label>
          <input
            type="number"
            min={1}
            max={52}
            required
            value={form.weeks}
            onChange={(e) => setForm({ ...form, weeks: parseInt(e.target.value) })}
            className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={generatePlan.isPending}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generatePlan.isPending ? 'Generating...' : 'Generate'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/plans')}
            className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
