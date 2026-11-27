// DIAGNÓSTICO TEMPORÁRIO: registra na tela, em ordem, quem mexe na rolagem quando a pessoa toca
// no texto (o app, o Safari, o teclado). Serve para descobrir a causa do "sobe e desce" no iPhone.
// Só liga abrindo o endereço com ?diagnostico no fim. Registra só números e horários, nunca o
// texto do diário, e nada sai do aparelho: o registro fica só na tela. Sai depois da investigação.

const ativo = typeof location !== 'undefined' && new URLSearchParams(location.search).has('diagnostico')

const MAXIMO_DE_LINHAS = 30
type Linha = { tempo: number; tipo: string; detalhe: string; vezes: number; primeiro?: string }
let linhas: Linha[] = []
let inicio = 0
let painel: HTMLPreElement | null = null
// Até quando as rolagens do texto contam como vindas do app (depois de o app mandar rolar).
let appRolandoAte = 0

const agora = () => Math.round(performance.now() - inicio)

function desenhar() {
  if (!painel) {
    painel = document.createElement('pre')
    painel.setAttribute('aria-hidden', 'true')
    Object.assign(painel.style, {
      position: 'fixed',
      zIndex: '1000',
      top: 'calc(env(safe-area-inset-top) + 60px)',
      left: '6px',
      right: '6px',
      maxHeight: '48vh',
      overflow: 'hidden',
      margin: '0',
      padding: '6px 8px',
      borderRadius: '8px',
      background: 'var(--texto-principal)',
      color: 'var(--fundo-app)',
      opacity: '0.85',
      font: '10px/1.35 ui-monospace, Menlo, monospace',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none',
    })
    document.body.appendChild(painel)
  }
  const corpo = linhas
    .map((l) => {
      const repetido = l.vezes > 1 ? ` (${l.vezes}x, de ${l.primeiro})` : ''
      return `+${String(l.tempo).padStart(4)}ms  ${l.tipo.padEnd(13)} ${l.detalhe}${repetido}`
    })
    .join('\n')
  painel.textContent = `DIAGNÓSTICO (tempo desde o toque)\n${corpo || 'Toque numa linha do texto para começar.'}`
}

/**
 * Registra um acontecimento. Com `juntar`, acontecimentos seguidos do mesmo tipo viram uma linha
 * só, que mostra o primeiro valor, o último e quantas vezes aconteceu.
 */
export function diagnostico(tipo: string, detalhe: string, juntar = false) {
  if (!ativo) return
  const ultima = linhas[linhas.length - 1]
  if (juntar && ultima && ultima.tipo === tipo) {
    ultima.primeiro ??= ultima.detalhe
    ultima.detalhe = detalhe
    ultima.vezes++
  } else {
    linhas.push({ tempo: agora(), tipo, detalhe, vezes: 1 })
    if (linhas.length > MAXIMO_DE_LINHAS) linhas = linhas.slice(-MAXIMO_DE_LINHAS)
  }
  desenhar()
}

/** O app mandou rolar o texto: as rolagens dos próximos instantes são marcadas como do app. */
export function diagnosticoAppRolou(distancia: number, cursor: number, limite: number) {
  if (!ativo) return
  appRolandoAte = performance.now() + 700
  diagnostico('APP ROLA', `${Math.round(distancia)}px (cursor ${Math.round(cursor)}, limite ${Math.round(limite)})`)
}

/** Liga os registros que não dependem da tela (toques, foco, rolagens, teclado). */
export function iniciarDiagnostico() {
  if (!ativo) return
  inicio = performance.now()
  desenhar()

  // Um toque no texto no modo ler começa uma medição nova (limpa o registro).
  document.addEventListener(
    'touchstart',
    (e) => {
      const area = (e.target as Element).closest?.('.hoje__rolagem')
      if (!area) return
      if (document.querySelector('main')?.classList.contains('hoje--ler')) {
        linhas = []
        inicio = performance.now()
      }
      diagnostico('toque', `y=${Math.round(e.touches[0]?.clientY ?? 0)}`)
    },
    { capture: true, passive: true },
  )

  document.addEventListener('focusin', (e) => {
    if ((e.target as Element).classList?.contains('cm-content')) diagnostico('foco', 'texto ganhou o foco')
  })
  document.addEventListener('focusout', (e) => {
    if ((e.target as Element).classList?.contains('cm-content')) diagnostico('foco', 'texto perdeu o foco')
  })

  // Rolagem do texto (dentro da tela). Marca se veio logo depois de o app mandar rolar.
  document.addEventListener(
    'scroll',
    (e) => {
      const alvo = e.target as Element
      if (!alvo.classList?.contains('hoje__rolagem')) return
      const quem = performance.now() < appRolandoAte ? 'texto (app)' : 'texto (outro)'
      diagnostico(quem, `rolagem ${Math.round(alvo.scrollTop)}`, true)
    },
    { capture: true, passive: true },
  )

  // A página inteira sendo empurrada (pelo Safari) e a parte visível da tela (o teclado).
  window.addEventListener('scroll', () => diagnostico('PÁGINA', `empurrada ${Math.round(window.scrollY)}px`, true))
  const vv = window.visualViewport
  const registrarVisivel = () =>
    vv && diagnostico('parte visível', `altura ${Math.round(vv.height)}, deslocada ${Math.round(vv.offsetTop)}`, true)
  vv?.addEventListener('resize', registrarVisivel)
  vv?.addEventListener('scroll', registrarVisivel)
}
