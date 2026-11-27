// Qual dia está aberto. Cada dia tem o próprio endereço (ex.: …/#2026-10-19; hoje fica sem nada
// depois do #), então o gesto de voltar do navegador volta ao dia aberto antes.
import { useEffect, useState } from 'react'

const DIA_NO_ENDERECO = /^#(\d{4}-\d{2}-\d{2})$/

/** O dia do endereço atual, ou hoje se o endereço não tiver um dia. */
export function diaDoEndereco(hoje: string): string {
  return DIA_NO_ENDERECO.exec(window.location.hash)?.[1] ?? hoje
}

/** Pedido para a tela do dia ir até um horário (cada pedido é um objeto novo, mesmo repetindo a hora). */
export type IrParaHora = { hora: string }

export function useDiaAberto(hoje: string) {
  const [dia, setDia] = useState(() => diaDoEndereco(hoje))
  const [irParaHora, setIrParaHora] = useState<IrParaHora | undefined>()

  // Voltar e avançar do navegador.
  useEffect(() => {
    const acompanharEndereco = () => {
      setDia(diaDoEndereco(hoje))
      setIrParaHora(undefined)
    }
    window.addEventListener('popstate', acompanharEndereco)
    window.addEventListener('hashchange', acompanharEndereco)
    return () => {
      window.removeEventListener('popstate', acompanharEndereco)
      window.removeEventListener('hashchange', acompanharEndereco)
    }
  }, [hoje])

  /** Abre o dia `data` (AAAA-MM-DD); com `hora`, já no momento desse horário. */
  function abrirDia(data: string, hora?: string) {
    setIrParaHora(hora ? { hora } : undefined)
    if (data === dia) return
    const { pathname, search } = window.location
    window.history.pushState(null, '', data === hoje ? `${pathname}${search}` : `${pathname}${search}#${data}`)
    setDia(data)
  }

  return { dia, irParaHora, abrirDia }
}
