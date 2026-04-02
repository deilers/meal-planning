import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import MealDetailPage from '../MealDetailPage'

vi.mock('@uiw/react-md-editor', () => {
  const Markdown = ({ source }: { source: string }) => <div>{source}</div>
  return { default: Object.assign(() => null, { Markdown }) }
})

function renderMealDetail(id = '1') {
  return renderWithProviders(
    <Routes>
      <Route path="/meals/:id" element={<MealDetailPage />} />
      <Route path="/meals" element={<div>Meals list</div>} />
    </Routes>,
    { route: `/meals/${id}` },
  )
}

describe('MealDetailPage', () => {
  it('renders meal name and details', async () => {
    renderMealDetail('1')
    await waitFor(() => {
      expect(screen.getByText('Tacos')).toBeInTheDocument()
      expect(screen.getByText('Cook the beef.')).toBeInTheDocument()
    })
  })

  it('shows edit and delete buttons', async () => {
    renderMealDetail('1')
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('clicking edit shows the edit form', async () => {
    const user = userEvent.setup()
    renderMealDetail('1')
    await waitFor(() => screen.getByText('Edit'))

    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Save changes')).toBeInTheDocument()
  })

  it('renders each ingredient as a list item', async () => {
    renderMealDetail('1')
    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent('Beef')
      expect(items[1]).toHaveTextContent('Cheese')
    })
  })

  it('renders recipe via markdown component', async () => {
    renderMealDetail('1')
    await waitFor(() => {
      expect(screen.getByText('Cook the beef.')).toBeInTheDocument()
    })
  })

  it('prompts for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderMealDetail('1')
    await waitFor(() => screen.getByText('Delete'))
    await user.click(screen.getByText('Delete'))

    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
