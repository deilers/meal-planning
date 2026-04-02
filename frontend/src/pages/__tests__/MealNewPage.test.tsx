import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import MealNewPage from '../MealNewPage'

vi.mock('@uiw/react-md-editor', () => {
  const Markdown = ({ source }: { source: string }) => <div>{source}</div>
  const Editor = Object.assign(
    ({ value, id, onChange }: { value?: string; id?: string; onChange?: (val: string) => void }) => (
      <textarea id={id} value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
    ),
    { Markdown }
  )
  return { default: Editor }
})

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
