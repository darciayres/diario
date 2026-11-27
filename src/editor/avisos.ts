// Aviso de comando inválido (sugestão provisória da página claude (CL) do Figma, a rever):
// o comando continua como texto, com fundo de aviso e um ícone de alerta; quando o cursor está
// nele, um balão explica o motivo e como corrigir. Enquanto a pessoa ainda está escrevendo
// na linha, o aviso espera, para não piscar erro a cada letra.
import { StateField, type EditorState, type Extension } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, showTooltip, type Tooltip } from '@codemirror/view'
import iconeAviso from '../assets/icones/warning_amber.svg'
import { parse } from '../parser/index.ts'
import { diaFuturo as ehDiaFuturo, modoLeitura } from './modo.ts'
import { foiDigitado } from './regrasDoHumor.ts'

export type Marca = { de: number; ate: number; mensagem: string }

/**
 * Função pura: quais comandos ganham aviso e qual balão aparece.
 * `linhaEmEdicao` é a linha (a partir de 0) onde a pessoa está digitando agora; ali ainda não há aviso.
 */
export function calcularAvisos(
  texto: string,
  cursor: number,
  linhaEmEdicao: number | null,
  diaFuturo = false,
): { marcas: Marca[]; balao: Marca | null } {
  const linhas = texto.split('\n')
  const inicioDaLinha: number[] = []
  let pos = 0
  for (const linha of linhas) {
    inicioDaLinha.push(pos)
    pos += linha.length + 1
  }

  const marcas = parse(texto, { diaFuturo })
    // O caso limite (dois humores sem hora entre eles) não é erro: o segundo humor vale.
    .avisos.filter((a) => a.tipo !== 'humor-duplicado' && a.linha !== linhaEmEdicao)
    .map((a) => ({ de: inicioDaLinha[a.linha] + a.de, ate: inicioDaLinha[a.linha] + a.ate, mensagem: a.mensagem }))

  const balao = marcas.find((m) => m.de <= cursor && cursor <= m.ate) ?? null
  return { marcas, balao }
}

class IconeDeAviso extends WidgetType {
  eq() {
    return true
  }

  toDOM() {
    const icone = document.createElement('img')
    icone.src = iconeAviso
    icone.alt = ''
    icone.width = 16
    icone.height = 16
    icone.className = 'comando-erro__icone'
    return icone
  }

  ignoreEvent() {
    return false
  }
}

const marcaDeErro = Decoration.mark({ class: 'comando-erro' })
const icone = Decoration.widget({ widget: new IconeDeAviso(), side: 1 })

/** Início da linha onde a pessoa está digitando agora (enquanto o cursor não sai dela), ou null. */
const linhaEmEdicao = StateField.define<number | null>({
  create: () => null,
  update(atual, tr) {
    const linhaDoCursor = tr.state.doc.lineAt(tr.state.selection.main.head).from
    if (foiDigitado(tr)) return linhaDoCursor
    if (atual === null) return null
    const mapeada = tr.docChanged ? tr.changes.mapPos(atual) : atual
    return mapeada === linhaDoCursor ? mapeada : null
  },
})

function avisosDoEstado(state: EditorState) {
  // No modo ler, o texto aparece limpo, sem avisos.
  if (state.facet(modoLeitura)) return { marcas: [], balao: null }
  const emEdicao = state.field(linhaEmEdicao)
  const linha = emEdicao === null ? null : state.doc.lineAt(emEdicao).number - 1
  return calcularAvisos(state.doc.toString(), state.selection.main.head, linha, state.facet(ehDiaFuturo))
}

const decoracoes = EditorView.decorations.compute(['doc', 'selection', linhaEmEdicao, modoLeitura], (state) =>
  Decoration.set(
    avisosDoEstado(state).marcas.flatMap((m) => [marcaDeErro.range(m.de, m.ate), icone.range(m.ate)]),
    true,
  ),
)

const balao = showTooltip.compute(['doc', 'selection', linhaEmEdicao, modoLeitura], (state): Tooltip | null => {
  const { balao } = avisosDoEstado(state)
  if (!balao) return null
  return {
    pos: balao.de,
    above: true,
    arrow: true,
    create: () => {
      const dom = document.createElement('div')
      dom.className = 'balao-erro'
      dom.setAttribute('role', 'status')
      dom.textContent = balao.mensagem
      return { dom }
    },
  }
})

// Aparência do balão ligada às variáveis do Figma.
// (O CodeMirror põe a classe cm-tooltip no próprio balão.)
const tema = EditorView.theme({
  '.cm-tooltip.balao-erro': {
    maxWidth: '300px',
    padding: '4px 12px',
    border: 'none',
    borderRadius: '11px',
    background: 'var(--aviso-fundo)',
    color: 'var(--aviso-texto)',
    font: 'var(--tipo-corpo-pequeno)',
    boxShadow: 'var(--sombra-sutil)',
  },
  '.cm-tooltip.balao-erro .cm-tooltip-arrow:before': { borderTopColor: 'var(--aviso-fundo)' },
  '.cm-tooltip.balao-erro .cm-tooltip-arrow:after': { borderTopColor: 'var(--aviso-fundo)' },
})

/** Extensão do CodeMirror que liga os avisos. */
export function avisos(): Extension {
  return [linhaEmEdicao, decoracoes, balao, tema]
}
