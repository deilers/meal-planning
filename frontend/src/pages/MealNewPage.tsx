import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateMeal } from '../api/meals'
import MDEditor from '@uiw/react-md-editor'

export default function MealNewPage() {
  const navigate = useNavigate()
  const createMeal = useCreateMeal()
  const [form, setForm] = useState({ name: '', recipe: '', ingredients: '', tags: '', weight: 1 })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMeal.mutate(form, { onSuccess: (meal) => navigate(`/meals/${meal.id}`) })
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">New Meal</h1>
      <MealForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/meals')}
        isPending={createMeal.isPending}
        submitLabel="Save meal"
      />
    </div>
  )
}

export function MealForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  form: { name: string; recipe: string; ingredients: string; tags: string; weight: number }
  onChange: (f: typeof form) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name" htmlFor="meal-name">
        <input
          id="meal-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Ingredients" htmlFor="meal-ingredients">
        <textarea
          id="meal-ingredients"
          rows={4}
          value={form.ingredients}
          onChange={(e) => onChange({ ...form, ingredients: e.target.value })}
          placeholder="One ingredient per line"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Recipe" htmlFor="meal-recipe">
        <div data-color-mode="light">
          <MDEditor
            id="meal-recipe"
            value={form.recipe}
            onChange={(val) => onChange({ ...form, recipe: val ?? '' })}
            height={240}
          />
        </div>
      </Field>
      <Field label="Tags" htmlFor="meal-tags">
        <input
          id="meal-tags"
          type="text"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
          placeholder="e.g. chicken, quick"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Weight (1–5)" htmlFor="meal-weight">
        <input
          id="meal-weight"
          type="number"
          min={1}
          max={5}
          value={form.weight}
          onChange={(e) => onChange({ ...form, weight: parseInt(e.target.value) })}
          className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </Field>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
