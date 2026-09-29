import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('mostra "Olá, Diário"', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Olá, Diário' })).toBeInTheDocument()
  })
})
