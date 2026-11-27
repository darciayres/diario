import 'fake-indexeddb/auto'
import { EditorView } from '@codemirror/view'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { abrirBanco, carregarDia, salvarDia } from '../armazenamento/dia.ts'
import { Hoje } from './Hoje.tsx'

const HOJE = '2026-10-21' // uma quarta-feira

/** Acha o editor na tela (espera o dia terminar de ser lido). */
const acharEditor = () => screen.findByRole('textbox', { name: 'Texto do dia' })
const vistaDe = (editor: HTMLElement) => EditorView.findFromDOM(editor)!
const textoDo = (editor: HTMLElement) => vistaDe(editor).state.doc.toString()

/** Abre a tela e passa para o modo escrever pelo botão do topo. */
async function abrirEscrevendo() {
  render(<Hoje />)
  const editor = await acharEditor()
  fireEvent.click(screen.getByRole('button', { name: 'Escrever' }))
  return editor
}

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

  it('abre no modo ler: sem cursor e sem barra de comandos', async () => {
    render(<Hoje />)
    const editor = await acharEditor()
    expect(editor).not.toHaveFocus()
    expect(editor).toHaveAttribute('contenteditable', 'false')
    expect(screen.getByRole('button', { name: 'Ler' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
  })

  it('o botão Escrever passa para o modo escrever, com o cursor no fim do texto', async () => {
    await salvarDia(HOJE, 'acordei cedo')
    const editor = await abrirEscrevendo()
    expect(editor).toHaveFocus()
    expect(editor).toHaveAttribute('contenteditable', 'true')
    expect(vistaDe(editor).state.selection.main.head).toBe('acordei cedo'.length)
    expect(screen.getByRole('button', { name: 'Escrever' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('toolbar', { name: 'Comandos' })).toBeInTheDocument()
  })

  it('o botão Ler volta para o modo ler e esconde a barra', async () => {
    const editor = await abrirEscrevendo()
    fireEvent.click(screen.getByRole('button', { name: 'Ler' }))
    expect(editor).toHaveAttribute('contenteditable', 'false')
    expect(editor).not.toHaveFocus()
    expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
  })

  it('tocar no texto, no modo ler, passa para o modo escrever', async () => {
    await salvarDia(HOJE, 'acordei cedo')
    render(<Hoje />)
    const editor = await acharEditor()
    fireEvent.click(editor)
    expect(editor).toHaveAttribute('contenteditable', 'true')
    expect(editor).toHaveFocus()
    expect(screen.getByRole('toolbar', { name: 'Comandos' })).toBeInTheDocument()
  })

  it('no celular, fechar o teclado volta para o modo ler', async () => {
    // Simula a área visível da tela de um celular, que encolhe quando o teclado sobe.
    const areaVisivel = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0 })
    Object.defineProperty(window, 'visualViewport', { value: areaVisivel, configurable: true })
    const mudarTeclado = (altura: number) =>
      act(() => {
        areaVisivel.height = window.innerHeight - altura
        areaVisivel.dispatchEvent(new Event('resize'))
      })
    try {
      const editor = await abrirEscrevendo()
      mudarTeclado(300) // o teclado sobe
      expect(editor).toHaveAttribute('contenteditable', 'true')
      // Se o teclado só piscar (desce e sobe logo), continua no modo escrever.
      mudarTeclado(0)
      mudarTeclado(300)
      await act(() => new Promise((r) => setTimeout(r, 500)))
      expect(editor).toHaveAttribute('contenteditable', 'true')
      expect(screen.getByRole('toolbar', { name: 'Comandos' })).toBeInTheDocument()
      // Se o teclado descer de vez, a barra some na hora e o dia volta para o modo ler.
      mudarTeclado(0)
      expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
      await waitFor(() => expect(editor).toHaveAttribute('contenteditable', 'false'))
      expect(screen.getByRole('button', { name: 'Ler' })).toHaveAttribute('aria-pressed', 'true')
    } finally {
      Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true })
    }
  })

  it('no celular, tocar fora do texto (que tira o foco) volta para o modo ler', async () => {
    const original = window.matchMedia
    const nada = () => {}
    window.matchMedia = ((consulta: string) => ({
      matches: consulta === '(pointer: coarse)',
      addListener: nada,
      removeListener: nada,
      addEventListener: nada,
      removeEventListener: nada,
    })) as unknown as typeof window.matchMedia
    try {
      const editor = await abrirEscrevendo()
      act(() => editor.blur())
      await waitFor(() => expect(editor).toHaveAttribute('contenteditable', 'false'))
      expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
    } finally {
      window.matchMedia = original
    }
  })

  it('no computador, perder o foco não muda o modo', async () => {
    const editor = await abrirEscrevendo()
    act(() => editor.blur())
    await act(() => new Promise((r) => setTimeout(r, 400)))
    expect(editor).toHaveAttribute('contenteditable', 'true')
  })

  it('no modo ler, os comandos aparecem como etiquetas, mesmo com o cursor em cima', async () => {
    await salvarDia(HOJE, 'hora/08:30 humor/4')
    render(<Hoje />)
    const editor = await acharEditor()
    expect(editor.querySelector('.etiqueta--hora')).toHaveTextContent('08:30')
  })

  it('mostra o texto que já estava salvo', async () => {
    await salvarDia(HOJE, 'acordei cedo\nhumor/4')
    render(<Hoje />)
    expect(textoDo(await acharEditor())).toBe('acordei cedo\nhumor/4')
  })

  it('ao passar para o modo escrever, o cursor vai para o fim da última coisa escrita (não para as linhas vazias)', async () => {
    await salvarDia(HOJE, 'acordei cedo\nfui ao parque\n\n\n')
    const editor = await abrirEscrevendo()
    expect(vistaDe(editor).state.selection.main.head).toBe('acordei cedo\nfui ao parque'.length)
  })

  it('tocar no espaço vazio depois do texto também leva ao fim da última coisa escrita', async () => {
    await salvarDia(HOJE, 'acordei cedo\n\n\n')
    render(<Hoje />)
    const editor = await acharEditor()
    fireEvent.click(editor)
    expect(vistaDe(editor).state.selection.main.head).toBe('acordei cedo'.length)
  })

  it('abre com o cursor no fim do texto (assim as etiquetas aparecem)', async () => {
    await salvarDia(HOJE, 'hora/08:30 humor/4\nacordei cedo')
    render(<Hoje />)
    const vista = vistaDe(await acharEditor())
    expect(vista.state.selection.main.head).toBe('hora/08:30 humor/4\nacordei cedo'.length)
  })

  it('dia vazio mostra a dica "Escreva aqui...", que some ao escrever', async () => {
    render(<Hoje />)
    const editor = await acharEditor()
    expect(editor.parentElement).toHaveTextContent('Escreva aqui...')
    escrever(editor, 'oi')
    expect(editor.parentElement).not.toHaveTextContent('Escreva aqui...')
  })

  it('a dica não entra no texto salvo', async () => {
    render(<Hoje />)
    expect(textoDo(await acharEditor())).toBe('')
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

  it('a barra de comandos mostra só os botões de hora e humor', async () => {
    await abrirEscrevendo()
    const barra = screen.getByRole('toolbar', { name: 'Comandos' })
    expect(within(barra).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Inserir a hora atual',
      'Escolher o humor',
    ])
  })

  it('o botão de hora escreve a hora atual no texto', async () => {
    const editor = await abrirEscrevendo()
    fireEvent.click(screen.getByRole('button', { name: 'Inserir a hora atual' }))
    expect(textoDo(editor)).toBe('hora/09:30\n')
    await waitFor(async () => expect(await carregarDia(HOJE)).toBe('hora/09:30\n'))
  })

  it('o botão de humor abre o pop-up de 1 a 5, e escolher escreve o humor', async () => {
    const editor = await abrirEscrevendo()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher o humor' }))
    const popup = screen.getByRole('group', { name: 'Escolha o humor' })
    expect(within(popup).getAllByRole('button')).toHaveLength(5)
    fireEvent.click(within(popup).getByRole('button', { name: '4 · Bem' }))
    expect(textoDo(editor)).toBe('hora/09:30 humor/4\n')
    expect(screen.queryByRole('group', { name: 'Escolha o humor' })).not.toBeInTheDocument()
  })

  it('o humor vai para a linha do hora/ quando o bloco ainda não tem humor', async () => {
    await salvarDia(HOJE, 'hora/08:00\nacordei cedo')
    const editor = await abrirEscrevendo()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher o humor' }))
    fireEvent.click(screen.getByRole('button', { name: '5 · Muito bem' }))
    expect(textoDo(editor)).toBe('hora/08:00 humor/5\nacordei cedo')
  })

  it('tocar nos botões da barra não tira o foco do texto (no celular, o teclado não desce)', async () => {
    await abrirEscrevendo()
    const barra = screen.getByRole('toolbar', { name: 'Comandos' })
    for (const botao of within(barra).getAllByRole('button')) {
      // fireEvent devolve false quando o app cancelou o evento que mudaria o foco.
      expect(fireEvent.mouseDown(botao)).toBe(false)
      expect(fireEvent.pointerDown(botao)).toBe(false)
    }
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'Recolher a barra de comandos' }))).toBe(false)
  })

  it('a setinha recolhe os botões e mostra de novo', async () => {
    await abrirEscrevendo()
    const setinha = screen.getByRole('button', { name: 'Recolher a barra de comandos' })
    fireEvent.click(setinha)
    expect(screen.queryByRole('toolbar', { name: 'Comandos' })).not.toBeInTheDocument()
    expect(setinha).toHaveAccessibleName('Mostrar a barra de comandos')
    fireEvent.click(setinha)
    expect(screen.getByRole('toolbar', { name: 'Comandos' })).toBeInTheDocument()
  })

  it('recolher a barra fecha o pop-up de humor', async () => {
    await abrirEscrevendo()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher o humor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Recolher a barra de comandos' }))
    expect(screen.queryByRole('group', { name: 'Escolha o humor' })).not.toBeInTheDocument()
  })

  describe('humor digitado (regras do editor)', () => {
    /** Digita no lugar do cursor, como o teclado faz. */
    function digitar(editor: HTMLElement, texto: string, evento = 'input.type') {
      const vista = vistaDe(editor)
      const pos = vista.state.selection.main.head
      act(() => {
        vista.dispatch({
          changes: { from: pos, insert: texto },
          selection: { anchor: pos + texto.length },
          userEvent: evento,
        })
      })
    }
    const esperarArrumar = () => act(async () => {})

    it('no começo do dia, ganha a hora atual quando o cursor sai da linha', async () => {
      const editor = await abrirEscrevendo()
      digitar(editor, 'acordei cedo\nhumor/4')
      await esperarArrumar()
      expect(textoDo(editor)).toBe('acordei cedo\nhumor/4') // ainda escrevendo nessa linha
      digitar(editor, '\n')
      await esperarArrumar()
      expect(textoDo(editor)).toBe('acordei cedo\nhora/09:30 humor/4\n')
    })

    it('num bloco com hora, vai para a linha do hora/', async () => {
      await salvarDia(HOJE, 'hora/08:00\nalmocei')
      render(<Hoje />)
      const editor = await acharEditor()
      digitar(editor, '\nhumor/5')
      digitar(editor, '\n')
      await esperarArrumar()
      expect(textoDo(editor)).toBe('hora/08:00 humor/5\nalmocei\n')
    })

    it('texto colado não é mexido', async () => {
      render(<Hoje />)
      const editor = await acharEditor()
      digitar(editor, 'acordei cedo\nhumor/4', 'input.paste')
      digitar(editor, '\n')
      await esperarArrumar()
      expect(textoDo(editor)).toBe('acordei cedo\nhumor/4\n')
    })

    it('ao sair do app, arruma na hora e salva o texto já arrumado', async () => {
      render(<Hoje />)
      const editor = await acharEditor()
      digitar(editor, 'humor/3')
      const visibilidade = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      Object.defineProperty(document, 'visibilityState', visibilidade!)
      expect(textoDo(editor)).toBe('hora/09:30 humor/3')
      await waitFor(async () => expect(await carregarDia(HOJE)).toBe('hora/09:30 humor/3'))
    })
  })

  it('avisa que os dados ficam só no aparelho', () => {
    render(<Hoje />)
    expect(screen.getByText(/só neste aparelho/)).toBeInTheDocument()
  })

  describe('transições sem tranco', () => {
    /** Simula a área visível de um celular, que encolhe quando o teclado sobe. */
    function simularCelular() {
      const areaVisivel = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0, width: window.innerWidth })
      Object.defineProperty(window, 'visualViewport', { value: areaVisivel, configurable: true })
      return {
        mudarTeclado: (altura: number) =>
          act(() => {
            areaVisivel.height = window.innerHeight - altura
            areaVisivel.dispatchEvent(new Event('resize'))
          }),
        desfazer: () => Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true }),
      }
    }
    const barra = () => screen.queryByRole('toolbar', { name: 'Comandos' })
    const areaQueRola = () => document.querySelector('.hoje__rolagem') as HTMLElement

    it('o aviso fica preso no pé da tela, fora da área que rola, nos dois modos', async () => {
      await abrirEscrevendo()
      const aviso = screen.getByText(/só neste aparelho/)
      expect(areaQueRola()).not.toContainElement(aviso)
      fireEvent.click(screen.getByRole('button', { name: 'Ler' }))
      expect(screen.getByText(/só neste aparelho/)).toBe(aviso)
    })

    it('voltar para o modo ler não mexe na rolagem', async () => {
      await abrirEscrevendo()
      areaQueRola().scrollTop = 250
      fireEvent.click(screen.getByRole('button', { name: 'Ler' }))
      expect(areaQueRola().scrollTop).toBe(250)
    })

    it('trocar de modo várias vezes seguidas termina no modo do último toque', async () => {
      const editor = await abrirEscrevendo()
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole('button', { name: 'Ler' }))
        fireEvent.click(screen.getByRole('button', { name: 'Escrever' }))
      }
      fireEvent.click(screen.getByRole('button', { name: 'Ler' }))
      expect(editor).toHaveAttribute('contenteditable', 'false')
      expect(barra()).not.toBeInTheDocument()
    })

    it('se o teclado só piscar, a barra some e volta, e o dia continua no modo escrever', async () => {
      const celular = simularCelular()
      try {
        const editor = await abrirEscrevendo()
        celular.mudarTeclado(300)
        expect(barra()).toBeInTheDocument()
        celular.mudarTeclado(0)
        expect(barra()).not.toBeInTheDocument()
        celular.mudarTeclado(300)
        expect(barra()).toBeInTheDocument()
        await act(() => new Promise((r) => setTimeout(r, 500)))
        expect(editor).toHaveAttribute('contenteditable', 'true')
      } finally {
        celular.desfazer()
      }
    })

    it('o teclado fica por cima: a tela não encolhe e a barra fica logo acima dele', async () => {
      const celular = simularCelular()
      try {
        await abrirEscrevendo()
        const tela = screen.getByRole('main')
        const alturaSemTeclado = tela.style.getPropertyValue('--altura-sem-teclado')
        celular.mudarTeclado(300)
        expect(tela.style.getPropertyValue('--altura-sem-teclado')).toBe(alturaSemTeclado)
        const caixaDaBarra = barra()!.closest('.barra-comandos') as HTMLElement
        expect(caixaDaBarra.style.getPropertyValue('--folga-inferior')).toBe('300px')
      } finally {
        celular.desfazer()
      }
    })

    it('o aviso fica fora da área que rola mesmo com o teclado aberto', async () => {
      const celular = simularCelular()
      try {
        await abrirEscrevendo()
        celular.mudarTeclado(300)
        const aviso = screen.getByText(/só neste aparelho/)
        expect(areaQueRola()).not.toContainElement(aviso)
        expect(screen.getByRole('main')).toContainElement(aviso)
      } finally {
        celular.desfazer()
      }
    })

    it('antes de o teclado subir, a barra já aparece (no computador não há teclado na tela)', async () => {
      const celular = simularCelular()
      try {
        await abrirEscrevendo()
        expect(barra()).toBeInTheDocument()
      } finally {
        celular.desfazer()
      }
    })

    it('ao entrar de novo no modo escrever, a barra volta mesmo que o teclado tenha descido antes', async () => {
      const celular = simularCelular()
      try {
        const editor = await abrirEscrevendo()
        celular.mudarTeclado(300)
        celular.mudarTeclado(0)
        await waitFor(() => expect(editor).toHaveAttribute('contenteditable', 'false'))
        fireEvent.click(screen.getByRole('button', { name: 'Escrever' }))
        expect(barra()).toBeInTheDocument()
      } finally {
        celular.desfazer()
      }
    })
  })
})
