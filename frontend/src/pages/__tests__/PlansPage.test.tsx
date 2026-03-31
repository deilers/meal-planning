import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import PlansPage from '../PlansPage'

describe('PlansPage', () => {
  it('renders the plan list', async () => {
    renderWithProviders(<PlansPage />)
    await waitFor(() => {
      expect(screen.getByText('April Plan')).toBeInTheDocument()
    })
  })

  it('has a link to generate a plan', async () => {
    renderWithProviders(<PlansPage />)
    expect(await screen.findByText('Generate plan')).toBeInTheDocument()
  })

  it('shows week count and date for each plan', async () => {
    renderWithProviders(<PlansPage />)
    await waitFor(() => {
      expect(screen.getByText(/2 weeks/)).toBeInTheDocument()
    })
  })

  it('prompts for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithProviders(<PlansPage />)
    await waitFor(() => screen.getByText('Delete'))

    await user.click(screen.getByText('Delete'))
    expect(confirmSpy).toHaveBeenCalled()

    confirmSpy.mockRestore()
  })
})
