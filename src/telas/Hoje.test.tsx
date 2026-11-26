import 'fake-indexeddb/auto'
import { EditorView } from '@codemirror/view'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { abrirBanco, carregarDia, salvarDia } from '../armazenamento/dia.ts'
import { Hoje } from './Hoje.tsx'

const HOJE = '2026-10-21' // uma quarta-feira

/** Acha o editor na tela (espera o dia terminar de ser lido). */
const acharEditor = () => screen.findByRole('textbox', { name: 'Texto do dia' })
const vistaDe = (editor: HTMLElement) => EditorView.findFromDOM(editor)!
const textoDo = (editor: HTMLElement) => vistaDe(editor).state.doc.toString()

/** Troca o texto do editor como se a pessoa tivesse digitado. */
function escrever(editor: HTMLElement, texto: string) {
  const vista = vistaDe(editor)
  act(() => {
    vista.dispatch({ changes: { from: 0, to: vista.state.doc.length, insert: texto } })
  })
}

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
    expect(await acharEditor()).toHaveFocus()
  })

  it('mostra o texto que já estava salvo', async () => {
    await salvarDia(HOJE, 'acordei cedo\nhumor/4')
    render(<Hoje />)
    expect(textoDo(await acharEditor())).toBe('acordei cedo\nhumor/4')
  })

  it('salva o que a pessoa escreve', async () => {
    render(<Hoje />)
    const editor = await acharEditor()
    escrever(editor, 'fui ao parque')
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('fui ao parque'))
  })

  it('salva na hora quando a pessoa sai da tela, sem esperar', async () => {
    const { unmount } = render(<Hoje />)
    const editor = await acharEditor()
    escrever(editor, 'escrevi e fechei')
    unmount()
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('escrevi e fechei'), { timeout: 300 })
  })

  it('o último texto vence, mesmo escrevendo rápido', async () => {
    render(<Hoje />)
    const editor = await acharEditor()
    for (const parcial of ['a', 'ab', 'abc', 'abcd']) {
      escrever(editor, parcial)
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
    const editor = await acharEditor()
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('cheio')
    })
    escrever(editor, 'não pode sumir')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(textoDo(editor)).toBe('não pode sumir')
  })

  it('avisa que os dados ficam só no aparelho', () => {
    render(<Hoje />)
    expect(screen.getByText(/só neste aparelho/)).toBeInTheDocument()
  })
})
