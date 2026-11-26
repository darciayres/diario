// Medidas da parte visível da tela (o "visual viewport"), que encolhe quando o teclado do celular abre.
// Só mudam quando o teclado abre ou fecha (ou o celular gira), não a cada rolagem.
import { useSyncExternalStore } from 'react'

function acompanhar(avisar: () => void) {
  const vv = window.visualViewport
  window.addEventListener('resize', avisar)
  vv?.addEventListener('resize', avisar)
  vv?.addEventListener('scroll', avisar)
  return () => {
    window.removeEventListener('resize', avisar)
    vv?.removeEventListener('resize', avisar)
    vv?.removeEventListener('scroll', avisar)
  }
}

/** Altura da parte visível da tela, em pixels (sem o teclado). */
function medirAltura(): number {
  return Math.round(window.visualViewport?.height ?? window.innerHeight)
}

// A maior altura visível já vista nesta largura de tela: é a altura "sem teclado".
// No Android, a página toda encolhe junto com o teclado, então só a página não basta para medir.
let maiorAltura = 0
let larguraMedida = 0

function medirTeclado(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  // Girou o celular (mudou a largura): mede de novo.
  if (Math.round(vv.width) !== larguraMedida) {
    larguraMedida = Math.round(vv.width)
    maiorAltura = 0
  }
  maiorAltura = Math.max(maiorAltura, vv.height)
  const alturaSemTeclado = Math.max(window.innerHeight, maiorAltura)
  return Math.max(0, Math.round(alturaSemTeclado - vv.height - vv.offsetTop))
}

/** Altura da parte visível da tela (diminui quando o teclado abre). */
export function useAlturaVisivel(): number {
  return useSyncExternalStore(acompanhar, medirAltura, () => 0)
}

/** Quanto da parte de baixo da tela o teclado ocupa (0 sem teclado ou no computador). */
export function useEspacoDoTeclado(): number {
  return useSyncExternalStore(acompanhar, medirTeclado, () => 0)
}
