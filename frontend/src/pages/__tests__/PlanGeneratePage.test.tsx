import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import PlanGeneratePage from '../PlanGeneratePage'

describe('PlanGeneratePage', () => {
  it('renders the generate form', () => {
    renderWithProviders(<PlanGeneratePage />)
    expect(screen.getByLabelText(/Number of weeks/)).toBeInTheDocument()
    expect(screen.getByText('Generate')).toBeInTheDocument()
  })

  it('defaults to 4 weeks', () => {
    renderWithProviders(<PlanGeneratePage />)
    expect(screen.getByLabelText(/Number of weeks/)).toHaveValue(4)
  })

  it('submits and navigates to the new plan', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/" element={<PlanGeneratePage />} />
        <Route path="/plans/:id" element={<div>Plan detail</div>} />
      </Routes>,
    )

    await user.click(screen.getByText('Generate'))
    await waitFor(() => {
      expect(screen.getByText('Plan detail')).toBeInTheDocument()
    })
  })

  it('cancel navigates back to plans', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/" element={<PlanGeneratePage />} />
        <Route path="/plans" element={<div>Plans list</div>} />
      </Routes>,
    )

    await user.click(screen.getByText('Cancel'))
    expect(screen.getByText('Plans list')).toBeInTheDocument()
  })
})
