// Medidas da parte visível da tela no celular (o "visual viewport").
// No computador, as duas medidas são sempre 0.
import { useSyncExternalStore } from 'react'

function acompanhar(avisar: () => void) {
  const vv = window.visualViewport
  if (!vv) return () => {}
  vv.addEventListener('resize', avisar)
  vv.addEventListener('scroll', avisar)
  return () => {
    vv.removeEventListener('resize', avisar)
    vv.removeEventListener('scroll', avisar)
  }
}

function medirTeclado(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

function medirDeslocamento(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(vv.offsetTop))
}

/**
 * Quanto da parte de baixo da tela está coberto pelo teclado (em pixels).
 * Usado para a barra de comandos ficar logo acima do teclado.
 */
export function useEspacoDoTeclado(): number {
  return useSyncExternalStore(acompanhar, medirTeclado, () => 0)
}

/**
 * Quanto a parte visível da tela desceu em relação à página (em pixels).
 * No iPhone, com o teclado aberto, o Safari desliza a tela visível para acompanhar o cursor
 * em vez de rolar a página; o topo fixo precisa descer junto para não sumir.
 */
export function useDeslocamentoDaTela(): number {
  return useSyncExternalStore(acompanhar, medirDeslocamento, () => 0)
}
