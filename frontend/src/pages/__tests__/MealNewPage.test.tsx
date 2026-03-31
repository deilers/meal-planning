import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import MealNewPage from '../MealNewPage'

describe('MealNewPage', () => {
  it('renders the meal form', () => {
    renderWithProviders(<MealNewPage />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipe')).toBeInTheDocument()
    expect(screen.getByLabelText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('Save meal')).toBeInTheDocument()
  })

  it('submits the form with entered values', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/" element={<MealNewPage />} />
        <Route path="/meals/:id" element={<div>Meal detail</div>} />
      </Routes>,
    )

    await user.type(screen.getByLabelText('Name'), 'Tacos')
    await user.click(screen.getByText('Save meal'))

    await waitFor(() => {
      expect(screen.getByText('Meal detail')).toBeInTheDocument()
    })
  })

  it('cancel navigates away without submitting', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/" element={<MealNewPage />} />
        <Route path="/meals" element={<div>Meals list</div>} />
      </Routes>,
    )

    await user.click(screen.getByText('Cancel'))
    expect(screen.getByText('Meals list')).toBeInTheDocument()
  })
})
