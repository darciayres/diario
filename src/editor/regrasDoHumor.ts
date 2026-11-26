// Liga as regras do humor digitado ao editor: o editor guarda as linhas onde a pessoa
// digitou um humor e, quando o cursor sai da linha (Enter, toque em outro lugar ou saída do app),
// arruma o texto como manda o PRODUTO.md. Texto colado e o que os botões escrevem não entram aqui.
import { Annotation, type Extension, type Transaction } from '@codemirror/state'
import { ViewPlugin, type EditorView, type ViewUpdate } from '@codemirror/view'
import { comandosDaLinha } from '../parser/index.ts'
import { arrumarHumorDigitado } from './arrumarHumor.ts'

/** Marca as mudanças feitas por estas regras, para não serem tratadas como digitação. */
export const arrumadoPeloEditor = Annotation.define<boolean>()

/** true quando a mudança veio da pessoa digitando ou apagando (não de colar, arrastar ou de um botão). */
export function foiDigitado(tr: Transaction): boolean {
  if (tr.annotation(arrumadoPeloEditor)) return false
  if (tr.isUserEvent('input.paste') || tr.isUserEvent('input.drop') || tr.isUserEvent('input.botao')) return false
  return tr.isUserEvent('input') || tr.isUserEvent('delete')
}

type Opcoes = {
  /** Hora atual no formato HH:MM. */
  horaAtual: () => string
  /** false em dias passados: aí o editor nunca insere a hora atual. */
  hoje: boolean
}

export function regrasDoHumor({ horaAtual, hoje }: Opcoes): Extension {
  return ViewPlugin.fromClass(
    class {
      view: EditorView
      // Início das linhas onde a pessoa digitou um humor e que ainda não foram arrumadas.
      pendentes: number[] = []
      aoEsconder = () => {
        // Saindo do app: arruma na hora, antes de o texto ser salvo.
        if (document.visibilityState === 'hidden') this.arrumar(true)
      }

      constructor(view: EditorView) {
        this.view = view
        document.addEventListener('visibilitychange', this.aoEsconder)
      }

      update(u: ViewUpdate) {
        if (u.docChanged) {
          this.pendentes = this.pendentes.map((p) => u.changes.mapPos(p))
          if (u.transactions.some(foiDigitado)) {
            u.changes.iterChangedRanges((_deA, _ateA, de, ate) => {
              const doc = u.state.doc
              // Um Enter sozinho não conta como "escrever o humor" (senão um humor colado
              // seria mexido só porque a pessoa apertou Enter depois dele).
              if (de !== ate && doc.sliceString(de, ate).trim() === '') return
              for (let n = doc.lineAt(de).number; n <= doc.lineAt(ate).number; n++) {
                const linha = doc.line(n)
                // Só conta se a mudança encostou no próprio comando de humor.
                const mexeuNoHumor = comandosDaLinha(linha.text).some(
                  (c) => c.tipo === 'humor' && de <= linha.from + c.ate && ate >= linha.from + c.de,
                )
                if (mexeuNoHumor && !this.pendentes.includes(linha.from)) this.pendentes.push(linha.from)
              }
            })
          }
        }
        if (this.pendentes.length && (u.selectionSet || u.focusChanged || u.docChanged)) {
          // Não dá para mudar o texto no meio de uma atualização; arruma logo em seguida.
          queueMicrotask(() => this.arrumar(false))
        }
      }

      /** Arruma as linhas pendentes que o cursor já deixou (ou todas, ao sair do app). */
      arrumar(todas: boolean) {
        for (let voltas = 0; voltas < 50 && this.pendentes.length; voltas++) {
          const { state } = this.view
          const doc = state.doc
          this.pendentes = this.pendentes.filter((p) => p <= doc.length)
          const linhaDoCursor = !todas && this.view.hasFocus ? doc.lineAt(state.selection.main.head).number : -1
          const i = this.pendentes.findIndex((p) => doc.lineAt(p).number !== linhaDoCursor)
          if (i === -1) return
          const [pos] = this.pendentes.splice(i, 1)
          const linha = doc.lineAt(pos)
          const mudancas = arrumarHumorDigitado(doc.toString(), linha.number - 1, horaAtual(), hoje)
          if (mudancas) {
            this.view.dispatch({
              changes: mudancas.map((m) => ({ from: m.de, to: m.ate, insert: m.inserir })),
              annotations: arrumadoPeloEditor.of(true),
              userEvent: 'input.arrumar',
            })
          }
        }
      }

      destroy() {
        document.removeEventListener('visibilitychange', this.aoEsconder)
      }
    },
  )
}
