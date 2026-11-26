// Etiquetas de hora e humor dentro do editor (componentes "Hora" e "Humor" do Figma).
// O texto nunca muda: as etiquetas só são desenhadas por cima dos comandos.
// Quando o cursor toca um comando, ele volta a aparecer como texto, com destaque.

import { StateField, type EditorState, type Extension } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view'
import { NOMES_DO_HUMOR } from '../humor.ts'
import { parse } from '../parser/index.ts'
import { modoLeitura } from './modo.ts'

/** Um pedaço do texto que vira etiqueta, ou que aparece como texto destacado (cursor em cima). */
export type Trecho =
  | {
      tipo: 'etiqueta'
      de: number
      ate: number
      hora: string | null
      humor: number | null
      linhaInteira: boolean
      /** Onde termina cada comando: é ali que o cursor vai ao tocar na etiqueta. */
      fimHora: number | null
      fimHumor: number | null
    }
  | { tipo: 'ativo'; de: number; ate: number }

type Selecao = { from: number; to: number }

/** Um comando válido, com a posição no texto inteiro. */
type Comando = { de: number; ate: number; linha: number; tipo: 'hora' | 'humor'; valor: string | number }

/** Função pura: diz quais trechos do texto viram etiqueta e quais ficam destacados. */
export function calcularTrechos(texto: string, selecoes: readonly Selecao[]): Trecho[] {
  const linhas = texto.split('\n')
  const inicioDaLinha: number[] = []
  let pos = 0
  for (const linha of linhas) {
    inicioDaLinha.push(pos)
    pos += linha.length + 1
  }

  /** true se, na linha, fora do trecho [de, ate) só há espaços (posições no texto inteiro). */
  function soIssoNaLinha(linha: number, de: number, ate: number): boolean {
    const texto = linhas[linha]
    const ini = inicioDaLinha[linha]
    return texto.slice(0, de - ini).trim() === '' && texto.slice(ate - ini).trim() === ''
  }

  // Só os comandos válidos viram etiqueta; o parser já decidiu quais são e onde estão.
  const grupos: Comando[][] = []
  for (const bloco of parse(texto).blocos) {
    const hora: Comando | null =
      bloco.hora !== null && bloco.colunasHora
        ? {
            tipo: 'hora',
            valor: bloco.hora,
            linha: bloco.linhaInicial,
            de: inicioDaLinha[bloco.linhaInicial] + bloco.colunasHora.de,
            ate: inicioDaLinha[bloco.linhaInicial] + bloco.colunasHora.ate,
          }
        : null
    const humor: Comando | null =
      bloco.humor !== null && bloco.linhaHumor !== null && bloco.colunasHumor
        ? {
            tipo: 'humor',
            valor: bloco.humor,
            linha: bloco.linhaHumor,
            de: inicioDaLinha[bloco.linhaHumor] + bloco.colunasHumor.de,
            ate: inicioDaLinha[bloco.linhaHumor] + bloco.colunasHumor.ate,
          }
        : null

    if (hora && humor) {
      const [primeiro, segundo] = hora.de < humor.de ? [hora, humor] : [humor, hora]
      // Na mesma linha, lado a lado (só espaço entre eles): uma fileira só.
      const ladoALado = hora.linha === humor.linha && texto.slice(primeiro.ate, segundo.de).trim() === ''
      // hora/ numa linha e humor/ logo na de baixo, os dois sozinhos: também uma fileira só, como no Figma.
      const empilhados =
        humor.linha === hora.linha + 1 &&
        soIssoNaLinha(hora.linha, hora.de, hora.ate) &&
        soIssoNaLinha(humor.linha, humor.de, humor.ate)
      if (ladoALado || empilhados) {
        grupos.push([primeiro, segundo])
        continue
      }
    }
    if (hora) grupos.push([hora])
    if (humor) grupos.push([humor])
  }

  const trechos: Trecho[] = []
  for (const grupo of grupos) {
    const de = grupo[0].de
    const ate = grupo[grupo.length - 1].ate
    const tocado = selecoes.some((s) => s.from <= ate && s.to >= de)
    if (tocado) {
      for (const c of grupo) trechos.push({ tipo: 'ativo', de: c.de, ate: c.ate })
    } else {
      const hora = grupo.find((c) => c.tipo === 'hora')
      const humor = grupo.find((c) => c.tipo === 'humor')
      trechos.push({
        tipo: 'etiqueta',
        de,
        ate,
        hora: hora ? (hora.valor as string) : null,
        humor: humor ? (humor.valor as number) : null,
        // Empilhados em duas linhas já são, por definição, sozinhos nas linhas deles.
        linhaInteira: grupo[0].linha !== grupo[grupo.length - 1].linha || soIssoNaLinha(grupo[0].linha, de, ate),
        fimHora: hora ? hora.ate : null,
        fimHumor: humor ? humor.ate : null,
      })
    }
  }
  return trechos.sort((a, b) => a.de - b.de)
}

class EtiquetasWidget extends WidgetType {
  readonly hora: string | null
  readonly humor: number | null

  constructor(hora: string | null, humor: number | null) {
    super()
    this.hora = hora
    this.humor = humor
  }

  eq(outro: EtiquetasWidget) {
    return outro.hora === this.hora && outro.humor === this.humor
  }

  toDOM() {
    const fileira = document.createElement('span')
    fileira.className = 'etiquetas'
    if (this.hora !== null) {
      const hora = document.createElement('span')
      hora.className = 'etiqueta etiqueta--hora'
      hora.textContent = this.hora
      fileira.append(hora)
    }
    if (this.humor !== null) {
      const humor = document.createElement('span')
      humor.className = 'etiqueta etiqueta--humor'
      const ponto = document.createElement('span')
      ponto.className = 'etiqueta__ponto'
      ponto.style.background = `var(--humor-${this.humor})`
      ponto.setAttribute('aria-hidden', 'true')
      const numero = document.createElement('span')
      numero.textContent = String(this.humor)
      const separador = document.createElement('span')
      separador.className = 'etiqueta__separador'
      separador.setAttribute('aria-hidden', 'true')
      const nome = document.createElement('span')
      nome.textContent = NOMES_DO_HUMOR[this.humor]
      humor.append(ponto, numero, separador, nome)
      fileira.append(humor)
    }
    return fileira
  }

  // Deixa o toque chegar ao editor: tocar na etiqueta põe o cursor ali e mostra o comando.
  ignoreEvent() {
    return false
  }
}

const destaque = Decoration.mark({ class: 'comando-ativo' })
const linhaDeEtiquetas = Decoration.line({ class: 'linha-etiquetas' })

function decorar(state: EditorState): DecorationSet {
  // No modo ler, todos os comandos aparecem como etiqueta, esteja o cursor onde estiver.
  const selecoes = state.facet(modoLeitura) ? [] : state.selection.ranges
  const trechos = calcularTrechos(state.doc.toString(), selecoes)
  const decoracoes = []
  for (const t of trechos) {
    if (t.tipo === 'ativo') {
      decoracoes.push(destaque.range(t.de, t.ate))
    } else {
      const linha = state.doc.lineAt(t.de)
      if (t.linhaInteira) decoracoes.push(linhaDeEtiquetas.range(linha.from))
      decoracoes.push(Decoration.replace({ widget: new EtiquetasWidget(t.hora, t.humor) }).range(t.de, t.ate))
    }
  }
  return Decoration.set(decoracoes, true)
}

/**
 * Onde pôr o cursor ao tocar numa etiqueta: logo depois do comando tocado
 * (ex.: depois do 4 em `humor/4`), para a pessoa já poder trocar o valor.
 */
export function posicaoAoTocar(texto: string, inicioDaEtiqueta: number, tocou: 'hora' | 'humor' | null): number | null {
  const trecho = calcularTrechos(texto, []).find((t) => t.tipo === 'etiqueta' && t.de === inicioDaEtiqueta)
  if (!trecho || trecho.tipo !== 'etiqueta') return null
  if (tocou === 'hora' && trecho.fimHora !== null) return trecho.fimHora
  if (tocou === 'humor' && trecho.fimHumor !== null) return trecho.fimHumor
  return trecho.ate
}

/** Se o toque foi numa etiqueta, a posição do cursor para ela; senão, null. */
export function posicaoDoToqueNaEtiqueta(evento: MouseEvent, view: EditorView): number | null {
  const alvo = evento.target instanceof Element ? evento.target : null
  const fileira = alvo?.closest('.etiquetas')
  if (!fileira) return null
  const tocou = alvo?.closest('.etiqueta--hora') ? 'hora' : alvo?.closest('.etiqueta--humor') ? 'humor' : null
  return posicaoAoTocar(view.state.doc.toString(), view.posAtDOM(fileira), tocou)
}

const aoTocarNaEtiqueta = EditorView.domEventHandlers({
  mousedown(evento, view) {
    // No modo ler, quem cuida do toque é o editor (ele passa para o modo escrever).
    if (view.state.facet(modoLeitura)) return false
    const pos = posicaoDoToqueNaEtiqueta(evento, view)
    if (pos === null) return false
    evento.preventDefault()
    view.focus()
    view.dispatch({ selection: { anchor: pos } })
    return true
  },
})

/** Extensão do CodeMirror que liga as etiquetas. */
export function etiquetas(): Extension {
  return [
    StateField.define<DecorationSet>({
      create: decorar,
      update: (atual, tr) => (tr.docChanged || tr.selection || tr.reconfigured ? decorar(tr.state) : atual),
      provide: (campo) => EditorView.decorations.from(campo),
    }),
    aoTocarNaEtiqueta,
  ]
}
