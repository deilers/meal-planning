import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import PlanDetailPage from '../PlanDetailPage'

function renderPlanDetail(id = 'p1') {
  return renderWithProviders(
    <Routes>
      <Route path="/plans/:id" element={<PlanDetailPage />} />
      <Route path="/plans" element={<div>Plans list</div>} />
    </Routes>,
    { route: `/plans/${id}` },
  )
}

describe('PlanDetailPage', () => {
  it('renders the plan name', async () => {
    renderPlanDetail()
    await waitFor(() => {
      expect(screen.getByText('April Plan')).toBeInTheDocument()
    })
  })

  it('renders week entries with meal names', async () => {
    renderPlanDetail()
    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeInTheDocument()
      expect(screen.getAllByText('Tacos').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Spaghetti').length).toBeGreaterThan(0)
    })
  })

  it('prompts for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderPlanDetail()
    await waitFor(() => screen.getByText('Delete'))
    await user.click(screen.getByText('Delete'))

    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('navigates to meals list after confirmed delete', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPlanDetail()
    await waitFor(() => screen.getByText('Delete'))
    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByText('Plans list')).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })
})
