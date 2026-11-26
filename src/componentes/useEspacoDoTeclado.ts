// Quanto da parte de baixo da tela está coberto pelo teclado do celular (em pixels).
// Usado para a barra de comandos ficar logo acima do teclado. No computador é sempre 0.
import { useSyncExternalStore } from 'react'

function medir(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

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

export function useEspacoDoTeclado(): number {
  return useSyncExternalStore(acompanhar, medir, () => 0)
}
