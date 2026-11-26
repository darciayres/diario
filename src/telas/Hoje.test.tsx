import 'fake-indexeddb/auto'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { abrirBanco, carregarDia, salvarDia } from '../armazenamento/dia.ts'
import { Hoje } from './Hoje.tsx'

const HOJE = '2026-10-21' // uma quarta-feira

beforeEach(async () => {
  // Só o relógio é simulado; o resto dos temporizadores continua de verdade.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 9, 30))
  const banco = await abrirBanco()
  await banco.clear('dias')
  banco.close()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Tela Hoje', () => {
  it('mostra o título do dia de hoje', () => {
    render(<Hoje />)
    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Quarta-feira')
    expect(titulo).toHaveTextContent('21 de Outubro')
  })

  it('abre com o cursor no editor', async () => {
    render(<Hoje />)
    expect(await screen.findByRole('textbox', { name: 'Texto do dia' })).toHaveFocus()
  })

  it('mostra o texto que já estava salvo', async () => {
    await salvarDia(HOJE, 'acordei cedo\nhumor/4')
    render(<Hoje />)
    expect(await screen.findByRole('textbox', { name: 'Texto do dia' })).toHaveValue('acordei cedo\nhumor/4')
  })

  it('salva o que a pessoa escreve', async () => {
    render(<Hoje />)
    const editor = await screen.findByRole('textbox', { name: 'Texto do dia' })
    fireEvent.change(editor, { target: { value: 'fui ao parque' } })
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('fui ao parque'))
  })

  it('salva na hora quando a pessoa sai da tela, sem esperar', async () => {
    const { unmount } = render(<Hoje />)
    const editor = await screen.findByRole('textbox', { name: 'Texto do dia' })
    fireEvent.change(editor, { target: { value: 'escrevi e fechei' } })
    unmount()
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('escrevi e fechei'), { timeout: 300 })
  })

  it('o último texto vence, mesmo escrevendo rápido', async () => {
    render(<Hoje />)
    const editor = await screen.findByRole('textbox', { name: 'Texto do dia' })
    for (const parcial of ['a', 'ab', 'abc', 'abcd']) {
      fireEvent.change(editor, { target: { value: parcial } })
    }
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('abcd'))
  })

  it('se não conseguir ler o dia, bloqueia a escrita e avisa', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    render(<Hoje />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('se não conseguir salvar, avisa e mantém o texto na tela', async () => {
    render(<Hoje />)
    const editor = await screen.findByRole('textbox', { name: 'Texto do dia' })
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('cheio')
    })
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'não pode sumir' } })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(editor).toHaveValue('não pode sumir')
  })

  it('avisa que os dados ficam só no aparelho', () => {
    render(<Hoje />)
    expect(screen.getByText(/só neste aparelho/)).toBeInTheDocument()
  })
})
