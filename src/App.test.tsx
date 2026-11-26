import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('abre direto no dia de hoje', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'Texto do dia' })).toBeInTheDocument()
  })
})
