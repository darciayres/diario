import 'fake-indexeddb/auto'
import { EditorView } from '@codemirror/view'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { abrirBanco, carregarDia, salvarDia } from './armazenamento/dia.ts'

// Hoje nos testes: quarta-feira, 21/10/2026, às 9h30.
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 9, 30))
  window.history.replaceState(null, '', '/')
  const banco = await abrirBanco()
  await banco.clear('dias')
  banco.close()
})

afterEach(() => {
  vi.useRealTimers()
})

const acharEditor = () => screen.findByRole('textbox', { name: 'Texto do dia' })
const titulo = () => screen.getByRole('heading', { level: 1 }).textContent
const botaoDaBarra = () => screen.getByRole('button', { name: /barra lateral/ })
const barraEstaAberta = () => botaoDaBarra().getAttribute('aria-expanded') === 'true'
const barra = () => within(screen.getByRole('navigation', { name: 'Barra lateral' }))

async function abrirBarra() {
  render(<App />)
  await acharEditor()
  fireEvent.click(botaoDaBarra())
}

describe('App', () => {
  it('abre direto no dia de hoje', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(await acharEditor()).toBeInTheDocument()
    expect(titulo()).toContain('21 de Outubro')
  })
})

describe('barra lateral', () => {
  it('abre e fecha pelo botão do canto superior esquerdo', async () => {
    render(<App />)
    await acharEditor()
    expect(barraEstaAberta()).toBe(false)
    expect(botaoDaBarra()).toHaveAccessibleName('Abrir barra lateral')
    fireEvent.click(botaoDaBarra())
    expect(barraEstaAberta()).toBe(true)
    expect(botaoDaBarra()).toHaveAccessibleName('Fechar barra lateral')
    fireEvent.click(botaoDaBarra())
    expect(barraEstaAberta()).toBe(false)
  })

  it('fecha tocando fora dela ou com a tecla Esc', async () => {
    await abrirBarra()
    fireEvent.click(document.querySelector('.barra-lateral__fora')!)
    expect(barraEstaAberta()).toBe(false)
    fireEvent.click(botaoDaBarra())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(barraEstaAberta()).toBe(false)
  })

  it('mostra o que está no Figma; o que o MVP ainda não prevê não faz nada', async () => {
    await abrirBarra()
    for (const nome of ['Central', 'Ver calendário', 'Novo lembrete', 'Configurações']) {
      const item = barra().getByRole('button', { name: nome })
      expect(item).toHaveAttribute('aria-disabled', 'true')
      fireEvent.click(item)
      expect(barraEstaAberta()).toBe(true)
    }
    expect(barra().getByText('Pesquise aqui....')).toBeInTheDocument()
  })
})

describe('lista de dias', () => {
  const nomesDosDias = () =>
    barra()
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((t) => /\(\d\d\/\d\d\/\d\d\)$/.test(t))

  it('mostra os últimos 30 dias, de hoje para trás, com hoje e ontem marcados', async () => {
    await abrirBarra()
    const nomes = nomesDosDias()
    expect(nomes).toHaveLength(30)
    expect(nomes[0]).toBe('Hoje, Quarta-Feira (21/10/26)')
    expect(nomes[1]).toBe('Ontem, Terça-Feira (20/10/26)')
    expect(nomes[2]).toBe('Segunda-Feira (19/10/26)')
    expect(nomes[29]).toBe('Terça-Feira (22/09/26)')
  })

  it('tocar no nome de um dia abre esse dia, com o próprio endereço, e fecha a barra', async () => {
    await salvarDia('2026-10-19', 'Texto da segunda.')
    await abrirBarra()
    fireEvent.click(barra().getByRole('button', { name: 'Segunda-Feira (19/10/26)' }))
    expect(barraEstaAberta()).toBe(false)
    await waitFor(() => expect(titulo()).toContain('19 de Outubro'))
    expect(window.location.hash).toBe('#2026-10-19')
    const editor = await acharEditor()
    await waitFor(() => expect(EditorView.findFromDOM(editor)!.state.doc.toString()).toBe('Texto da segunda.'))
  })

  it('o gesto de voltar do navegador volta ao dia aberto antes', async () => {
    await abrirBarra()
    fireEvent.click(barra().getByRole('button', { name: 'Segunda-Feira (19/10/26)' }))
    await waitFor(() => expect(titulo()).toContain('19 de Outubro'))
    act(() => {
      window.history.back()
    })
    await waitFor(() => expect(titulo()).toContain('21 de Outubro'))
    expect(window.location.hash).toBe('')
  })

  it('a setinha mostra os horários do dia; tocar num horário abre o dia', async () => {
    await salvarDia('2026-10-20', 'hora/08:30 humor/4\nCafé.\nhora/14:00\nAula.')
    await abrirBarra()
    const seta = await barra().findByRole('button', { name: 'Horários de Ontem, Terça-Feira (20/10/26)' })
    expect(seta).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(seta)
    expect(seta).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(await barra().findByRole('button', { name: '14:00' }))
    expect(barraEstaAberta()).toBe(false)
    await waitFor(() => expect(titulo()).toContain('20 de Outubro'))
  })

  it('dia sem horário marcado não tem setinha', async () => {
    await salvarDia('2026-10-20', 'hora/08:30\nCafé.')
    await salvarDia('2026-10-19', 'Só texto, sem hora.')
    await abrirBarra()
    await barra().findByRole('button', { name: 'Horários de Ontem, Terça-Feira (20/10/26)' })
    expect(barra().queryByRole('button', { name: /Horários de Segunda-Feira/ })).not.toBeInTheDocument()
    expect(barra().queryByRole('button', { name: /Horários de Domingo/ })).not.toBeInTheDocument()
    expect(barra().getByRole('button', { name: 'Segunda-Feira (19/10/26)' })).toBeInTheDocument()
  })
})

describe('dia passado', () => {
  async function abrirOntem() {
    window.history.replaceState(null, '', '/#2026-10-20')
    render(<App />)
    const editor = await acharEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Escrever' }))
    return editor
  }

  it('abre pelo endereço', async () => {
    await abrirOntem()
    expect(titulo()).toContain('20 de Outubro')
  })

  it('a barra de comandos não aparece (ainda não há botões para dias passados)', async () => {
    await abrirOntem()
    expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
  })

  it('o humor digitado não ganha a hora de agora', async () => {
    const editor = await abrirOntem()
    const vista = EditorView.findFromDOM(editor)!
    act(() => {
      vista.dispatch({ changes: { from: 0, insert: 'humor/3' }, userEvent: 'input.type' })
    })
    act(() => {
      vista.dispatch({ changes: { from: vista.state.doc.length, insert: '\nDormi mal.' }, selection: { anchor: vista.state.doc.length + 11 }, userEvent: 'input.type' })
    })
    expect(vista.state.doc.toString()).toBe('humor/3\nDormi mal.')
    await waitFor(async () => expect(await carregarDia('2026-10-20')).toBe('humor/3\nDormi mal.'))
  })
})
