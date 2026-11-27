// Campo onde a pessoa escreve o dia, feito com o CodeMirror.
// O texto continua sendo texto puro; o editor só desenha as etiquetas por cima dos comandos.
// No modo ler, o mesmo editor mostra o texto "polido" e não deixa escrever;
// tocar no texto passa para o modo escrever, com o cursor onde a pessoa tocou.
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Annotation, Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { Modo } from '../componentes/AlternarModo.tsx'
import { espacoDoTecladoAgora } from '../componentes/useEspacoDoTeclado.ts'
import { horaAgora } from '../datas.ts'
import { avisos } from './avisos.ts'
import type { Edicao } from './comandos.ts'
import { etiquetas, posicaoDoToqueNaEtiqueta } from './etiquetas.ts'
import { MARGEM_DO_CURSOR_EM_CIMA, MARGEM_DO_CURSOR_EMBAIXO } from './margens.ts'
import { modoLeitura } from './modo.ts'
import { regrasDoHumor } from './regrasDoHumor.ts'
import './Editor.css'

/** O que a tela pode pedir ao editor. */
export type ControleDoEditor = {
  /** Aplica uma edição a partir do texto e do cursor atuais, como se a pessoa tivesse escrito. */
  editar: (calcular: (texto: string, cursor: number) => Edicao) => void
  /**
   * Passa para o modo escrever, com o cursor no fim da última coisa escrita.
   * Precisa ser chamado dentro do toque da pessoa: só assim o celular deixa o teclado subir.
   */
  escrever: () => void
  /** Passa para o modo ler (o teclado desce). */
  ler: () => void
  /** Devolve o foco ao texto, se estiver no modo escrever (o teclado continua aberto). */
  focar: () => void
  /** Onde o cursor está na tela agora (topo e base, em pixels), ou null se não der para saber. */
  posicaoDoCursor: () => { top: number; bottom: number } | null
}

type Props = {
  texto: string
  aoMudar: (texto: string) => void
  modo: Modo
  /** Avisa a tela quando o próprio editor muda de modo (ex.: a pessoa tocou no texto no modo ler). */
  aoMudarModo: (modo: Modo) => void
  ref?: Ref<ControleDoEditor>
}

// Marca as mudanças que vieram de fora do editor, para não avisar de volta como se a pessoa tivesse digitado.
const vindoDeFora = Annotation.define<boolean>()

// Aparência do CodeMirror ligada às variáveis do Figma.
const tema = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--texto-principal)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { font: 'var(--tipo-diario)' },
  '.cm-content': { padding: '0', minHeight: '50vh', caretColor: 'var(--texto-principal)' },
  '.cm-line': { padding: '0 4px' },
  '.cm-placeholder': { color: 'var(--texto-secundario)' },
})

/** true em telas de toque (celular, tablet), onde o teclado aparece na tela. */
const ehTelaDeToque = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

// Depois que o texto perde o foco, quanto esperar (em milissegundos) antes de voltar para o modo ler.
const ESPERA_SEM_FOCO = 300

/**
 * Onde termina a última coisa escrita: o fim do texto, sem contar linhas vazias e espaços
 * do final. É ali que o cursor vai ao entrar no modo escrever.
 */
const fimDoEscrito = (texto: string) => texto.trimEnd().length

/** A parte da configuração que muda entre ler e escrever. */
const configuracaoDoModo = (modo: Modo) => [EditorView.editable.of(modo === 'escrever'), modoLeitura.of(modo === 'ler')]

export function Editor({ texto, aoMudar, modo, aoMudarModo, ref }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const vista = useRef<EditorView | null>(null)
  const compartimentoDoModo = useRef(new Compartment())
  const [textoInicial] = useState(texto)
  const [modoInicial] = useState(modo)
  const aoMudarAtual = useRef(aoMudar)
  const aoMudarModoAtual = useRef(aoMudarModo)

  useEffect(() => {
    aoMudarAtual.current = aoMudar
    aoMudarModoAtual.current = aoMudarModo
  })

  /** Liga o modo escrever e põe o cursor em `pos`, tudo de uma vez (o celular exige isso para mostrar o teclado). */
  function entrarNaEscrita(view: EditorView, pos: number) {
    view.dispatch({
      effects: compartimentoDoModo.current.reconfigure(configuracaoDoModo('escrever')),
      selection: { anchor: pos },
    })
    // A tela (Hoje) cuida de deslizar o texto até o cursor, sem pulo.
    view.focus()
    aoMudarModoAtual.current('escrever')
  }

  /** Volta para o modo ler: o texto deixa de ser editável e o teclado desce. */
  function sairDaEscrita(view: EditorView) {
    view.dispatch({ effects: compartimentoDoModo.current.reconfigure(configuracaoDoModo('ler')) })
    view.contentDOM.blur()
    aoMudarModoAtual.current('ler')
  }

  // Cria o editor uma vez só.
  useEffect(() => {
    const view = new EditorView({
      parent: caixa.current!,
      state: EditorState.create({
        doc: textoInicial,
        // Ao abrir, o cursor fica no fim do texto, pronto para continuar o dia.
        selection: { anchor: fimDoEscrito(textoInicial) },
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            'aria-label': 'Texto do dia',
            spellcheck: 'true',
            autocapitalize: 'sentences',
          }),
          tema,
          // Ao digitar, o texto rola antes de o cursor chegar atrás do teclado (que cobre a parte de
          // baixo da tela), da barra de comandos ou do botão do topo.
          EditorView.scrollMargins.of(() => ({
            top: MARGEM_DO_CURSOR_EM_CIMA,
            bottom: espacoDoTecladoAgora() + MARGEM_DO_CURSOR_EMBAIXO,
          })),
          compartimentoDoModo.current.of(configuracaoDoModo(modoInicial)),
          // Dia vazio: dica em cinza, que some assim que a pessoa começa a escrever.
          placeholder('Escreva aqui...'),
          etiquetas(),
          avisos(),
          // Por enquanto só existe o dia de hoje; os outros dias chegam na Fase 4.
          regrasDoHumor({ horaAtual: () => horaAgora(), hoje: true }),
          // No modo ler, tocar no texto passa para o modo escrever, com o cursor onde a pessoa tocou.
          EditorView.domEventHandlers({
            click(evento, view) {
              if (!view.state.facet(modoLeitura)) return false
              const tocado =
                posicaoDoToqueNaEtiqueta(evento, view) ??
                view.posAtCoords({ x: evento.clientX, y: evento.clientY }) ??
                view.state.doc.length
              // Tocou no espaço vazio depois do texto: o cursor vai para o fim da última coisa escrita.
              const pos = Math.min(tocado, fimDoEscrito(view.state.doc.toString()))
              evento.preventDefault()
              entrarNaEscrita(view, pos)
              return true
            },
            // No celular, tocar fora do texto fecha o teclado (no iPhone, o texto perde o foco):
            // o dia volta para o modo ler. Os botões da barra não tiram o foco, então não contam.
            blur(_evento, view) {
              if (view.state.facet(modoLeitura) || !ehTelaDeToque()) return false
              window.setTimeout(() => {
                if (vista.current === view && !view.hasFocus && !view.state.facet(modoLeitura)) sairDaEscrita(view)
              }, ESPERA_SEM_FOCO)
              return false
            },
          }),
          EditorView.updateListener.of((u) => {
            const deFora = u.transactions.some((tr) => tr.annotation(vindoDeFora))
            if (u.docChanged && !deFora) aoMudarAtual.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    vista.current = view
    if (modoInicial === 'escrever') view.focus()
    view.dispatch({ effects: EditorView.scrollIntoView(textoInicial.length) })
    return () => {
      view.destroy()
      vista.current = null
    }
  }, [textoInicial, modoInicial])

  // Se o modo mudar por fora (ex.: o teclado desceu), o editor acompanha.
  useEffect(() => {
    const view = vista.current
    if (!view || view.state.facet(modoLeitura) === (modo === 'ler')) return
    view.dispatch({ effects: compartimentoDoModo.current.reconfigure(configuracaoDoModo(modo)) })
    if (modo === 'ler') view.contentDOM.blur()
  }, [modo])

  useImperativeHandle(ref, () => ({
    editar(calcular) {
      const view = vista.current
      if (!view) return
      const atual = view.state.doc.toString()
      const { texto: novo, cursor } = calcular(atual, view.state.selection.main.head)
      // Troca só o pedaço que mudou, para o desfazer (Ctrl+Z) funcionar direitinho.
      let inicio = 0
      while (inicio < atual.length && inicio < novo.length && atual[inicio] === novo[inicio]) inicio++
      let fimAtual = atual.length
      let fimNovo = novo.length
      while (fimAtual > inicio && fimNovo > inicio && atual[fimAtual - 1] === novo[fimNovo - 1]) {
        fimAtual--
        fimNovo--
      }
      view.dispatch({
        changes: { from: inicio, to: fimAtual, insert: novo.slice(inicio, fimNovo) },
        selection: { anchor: cursor },
        scrollIntoView: true,
        userEvent: 'input.botao',
      })
      view.focus()
    },
    escrever() {
      const view = vista.current
      if (view) entrarNaEscrita(view, fimDoEscrito(view.state.doc.toString()))
    },
    posicaoDoCursor() {
      const view = vista.current
      if (!view) return null
      return view.coordsAtPos(view.state.selection.main.head)
    },
    focar() {
      const view = vista.current
      if (view && !view.state.facet(modoLeitura) && !view.hasFocus) view.focus()
    },
    ler() {
      if (vista.current) sairDaEscrita(vista.current)
    },
  }))

  // Se o texto mudar por fora, o editor acompanha.
  useEffect(() => {
    const view = vista.current
    if (view && view.state.doc.toString() !== texto) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: texto },
        annotations: vindoDeFora.of(true),
      })
    }
  }, [texto])

  return <div ref={caixa} className={`editor editor--${modo}`} />
}
