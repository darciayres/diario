// Campo onde a pessoa escreve o dia, feito com o CodeMirror.
// O texto continua sendo texto puro; o editor só desenha as etiquetas por cima dos comandos.
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Annotation, EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { useEffect, useRef, useState } from 'react'
import { etiquetas } from './etiquetas.ts'
import './Editor.css'

type Props = {
  texto: string
  aoMudar: (texto: string) => void
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
})

export function Editor({ texto, aoMudar }: Props) {
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
          etiquetas(),
          EditorView.updateListener.of((u) => {
            const deFora = u.transactions.some((tr) => tr.annotation(vindoDeFora))
            if (u.docChanged && !deFora) aoMudarAtual.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    vista.current = view
    // Ao abrir o app, o cursor já está no dia de hoje.
    view.focus()
    return () => {
      view.destroy()
      vista.current = null
    }
  }, [textoInicial])

  // Se o texto mudar por fora (ex.: um botão), o editor acompanha.
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
