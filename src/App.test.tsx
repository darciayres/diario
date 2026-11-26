import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('mostra o título "Diário"', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Diário' })).toBeInTheDocument()
  })

  it('avisa que os dados ficam só no aparelho', () => {
    render(<App />)
    expect(screen.getByText(/fica só neste aparelho/)).toBeInTheDocument()
  })
})
