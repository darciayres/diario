// Campo onde a pessoa escreve o dia, feito com o CodeMirror.
// O texto continua sendo texto puro; o editor só desenha as etiquetas por cima dos comandos.
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Annotation, EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { Edicao } from './comandos.ts'
import { horaAgora } from '../datas.ts'
import { avisos } from './avisos.ts'
import { etiquetas } from './etiquetas.ts'
import { regrasDoHumor } from './regrasDoHumor.ts'
import './Editor.css'

/** O que a tela pode pedir ao editor (ex.: os botões da barra de comandos). */
export type ControleDoEditor = {
  /** Aplica uma edição a partir do texto e do cursor atuais, como se a pessoa tivesse escrito. */
  editar: (calcular: (texto: string, cursor: number) => Edicao) => void
}

type Props = {
  texto: string
  aoMudar: (texto: string) => void
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

export function Editor({ texto, aoMudar, ref }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const vista = useRef<EditorView | null>(null)
  const [textoInicial] = useState(texto)
  const aoMudarAtual = useRef(aoMudar)

  useEffect(() => {
    aoMudarAtual.current = aoMudar
  })

  // Cria o editor uma vez só.
  useEffect(() => {
    const view = new EditorView({
      parent: caixa.current!,
      state: EditorState.create({
        doc: textoInicial,
        // Ao abrir, o cursor fica no fim do texto, pronto para continuar o dia.
        selection: { anchor: textoInicial.length },
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
          // Dia vazio: dica em cinza, que some assim que a pessoa começa a escrever.
          placeholder('Escreva aqui...'),
          etiquetas(),
          avisos(),
          // Por enquanto só existe o dia de hoje; os outros dias chegam na Fase 4.
          regrasDoHumor({ horaAtual: () => horaAgora(), hoje: true }),
          EditorView.updateListener.of((u) => {
            const deFora = u.transactions.some((tr) => tr.annotation(vindoDeFora))
            if (u.docChanged && !deFora) aoMudarAtual.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    vista.current = view
    // Ao abrir o app, o cursor já está no dia de hoje, no fim do texto.
    view.focus()
    view.dispatch({ effects: EditorView.scrollIntoView(textoInicial.length) })
    return () => {
      view.destroy()
      vista.current = null
    }
  }, [textoInicial])

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

  return <div ref={caixa} className="editor" />
}
