import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMeal, useUpdateMeal, useDeleteMeal } from '../api/meals'
import { MealForm } from './MealNewPage'
import MDEditor from '@uiw/react-md-editor'

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: meal, isLoading } = useMeal(id!)
  const updateMeal = useUpdateMeal(id!)
  const deleteMeal = useDeleteMeal()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<{
    name: string; recipe: string; ingredients: string; tags: string; weight: number
  } | null>(null)

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (!meal) return <p className="text-gray-500">Meal not found.</p>

  function startEdit() {
    setForm({ name: meal!.name, recipe: meal!.recipe, ingredients: meal!.ingredients, tags: meal!.tags, weight: meal!.weight })
    setEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMeal.mutate(form!, { onSuccess: () => setEditing(false) })
  }

  function handleDelete() {
    if (confirm(`Delete "${meal!.name}"?`)) {
      deleteMeal.mutate(meal!.id, { onSuccess: () => navigate('/meals') })
    }
  }

  if (editing && form) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">Edit Meal</h1>
        <MealForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
          isPending={updateMeal.isPending}
          submitLabel="Save changes"
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-semibold">{meal.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={startEdit}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500 mb-6">
        {meal.tags && <span>Tags: {meal.tags}</span>}
        <span>Weight: {meal.weight}</span>
      </div>

      {meal.ingredients && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h2>
          <ul className="list-disc list-inside space-y-1">
            {meal.ingredients.split('\n').filter(Boolean).map((item, i) => (
              <li key={i} className="text-sm text-gray-600">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {meal.recipe && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Recipe</h2>
          <div data-color-mode="light" className="prose prose-sm max-w-none">
            <MDEditor.Markdown source={meal.recipe} />
          </div>
        </div>
      )}

      {!meal.ingredients && !meal.recipe && (
        <p className="text-sm text-gray-400">No recipe or ingredients yet. Edit to add them.</p>
      )}
    </div>
  )
}
