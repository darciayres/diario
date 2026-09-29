import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { carregarDia, dataDeHoje } from './armazenamento/dia.ts'

const campo = () => screen.getByLabelText('Texto do dia') as HTMLTextAreaElement

/** Simula o que o navegador faz ao digitar (ou colar) um texto no campo. */
function digitar(valor: string, inputType = 'insertText') {
  fireEvent.input(campo(), { target: { value: valor }, inputType })
}

beforeEach(() => {
  localStorage.clear()
  // Só a data é falsa; os temporizadores continuam reais.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 29, 16, 5))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('tela da prova de conceito', () => {
  it('mostra o editor, os 5 botões de humor e as células de exemplo', () => {
    render(<App />)
    expect(campo()).toBeInTheDocument()
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: `Humor ${n}` })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('img', { name: /^Dia \d+/ })).toHaveLength(5)
  })

  it('o texto salvo aparece ao reabrir', () => {
    const { unmount } = render(<App />)
    digitar('bom dia')
    unmount()

    render(<App />)
    expect(campo().value).toBe('bom dia')
    expect(carregarDia(dataDeHoje())).toBe('bom dia')
  })

  it('o botão de humor insere humor/N e salva', () => {
    render(<App />)
    digitar('oi')
    fireEvent.click(screen.getByRole('button', { name: 'Humor 4' }))
    expect(campo().value).toBe('humor/4\noi')
    expect(carregarDia(dataDeHoje())).toBe('humor/4\noi')
  })

  it('o botão de humor troca o humor que já existe', () => {
    render(<App />)
    digitar('humor/4\noi')
    fireEvent.click(screen.getByRole('button', { name: 'Humor 2' }))
    expect(campo().value).toBe('humor/2\noi')
  })

  it('digitar um segundo humor/ insere hora/ com a hora atual', () => {
    render(<App />)
    digitar('hora/14:32\nhumor/4\n\nhumor/3')
    expect(campo().value).toBe('hora/14:32\nhumor/4\n\nhora/16:05\nhumor/3')
    expect(screen.queryByText(/Já havia um humor/)).not.toBeInTheDocument()
  })

  it('colar um segundo humor/ não insere hora/: o parser abre bloco sem horário e avisa', () => {
    render(<App />)
    digitar('hora/14:32\nhumor/4\n\nhumor/3', 'insertFromPaste')
    expect(campo().value).toBe('hora/14:32\nhumor/4\n\nhumor/3')
    expect(screen.getByText(/Já havia um humor/)).toBeInTheDocument()
  })

  it('comando inválido aparece como aviso discreto', () => {
    render(<App />)
    digitar('humor/7')
    expect(screen.getByText(/Humor inválido/)).toBeInTheDocument()
  })
})
