import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import MealsPage from '../MealsPage'

describe('MealsPage', () => {
  it('renders the meal list', async () => {
    renderWithProviders(<MealsPage />)
    await waitFor(() => {
      expect(screen.getByText('Tacos')).toBeInTheDocument()
      expect(screen.getByText('Spaghetti')).toBeInTheDocument()
    })
  })

  it('has a link to add a new meal', async () => {
    renderWithProviders(<MealsPage />)
    expect(await screen.findByText('Add meal')).toBeInTheDocument()
  })

  it('renders the tag filter input', () => {
    renderWithProviders(<MealsPage />)
    expect(screen.getByPlaceholderText(/Filter by tag/)).toBeInTheDocument()
  })

  it('renders enabled/disabled toggle for each meal', async () => {
    renderWithProviders(<MealsPage />)
    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument()
      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })
  })

  it('prompts for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithProviders(<MealsPage />)
    await waitFor(() => screen.getAllByText('Delete'))

    await user.click(screen.getAllByText('Delete')[0])
    expect(confirmSpy).toHaveBeenCalled()

    confirmSpy.mockRestore()
  })
})
