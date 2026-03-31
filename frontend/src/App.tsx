import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import MealsPage from './pages/MealsPage'
import MealDetailPage from './pages/MealDetailPage'
import MealNewPage from './pages/MealNewPage'
import PlansPage from './pages/PlansPage'
import PlanGeneratePage from './pages/PlanGeneratePage'
import PlanDetailPage from './pages/PlanDetailPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
          <span className="font-semibold text-gray-900">Meal Planner</span>
          <NavLink
            to="/meals"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`
            }
          >
            Meals
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`
            }
          >
            Plans
          </NavLink>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/plans" replace />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/meals/new" element={<MealNewPage />} />
          <Route path="/meals/:id" element={<MealDetailPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/generate" element={<PlanGeneratePage />} />
          <Route path="/plans/:id" element={<PlanDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
