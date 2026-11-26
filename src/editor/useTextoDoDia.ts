// Cuida do texto de um dia: lê do aparelho ao abrir e salva enquanto a pessoa escreve.
import { useCallback, useEffect, useRef, useState } from 'react'
import { carregarDia, salvarDia } from '../armazenamento/dia.ts'

/** Quanto tempo esperar depois da última tecla antes de salvar (em milissegundos). */
export const ESPERA_PARA_SALVAR = 500

export type FaseDoTexto = 'carregando' | 'pronto' | 'erro-leitura'

export function useTextoDoDia(data: string) {
  const [texto, setTexto] = useState('')
  // Qual dia já terminou de ser lido, e se a leitura deu certo.
  const [leitura, setLeitura] = useState<{ data: string; ok: boolean } | null>(null)
  const [falhouSalvar, setFalhouSalvar] = useState(false)

  const fase: FaseDoTexto = leitura?.data !== data ? 'carregando' : leitura.ok ? 'pronto' : 'erro-leitura'

  // Texto que ainda não foi salvo (null quando não há nada pendente).
  const pendente = useRef<string | null>(null)
  const temporizador = useRef<number | undefined>(undefined)
  // Os salvamentos entram numa fila, para um texto antigo nunca terminar de salvar depois de um novo.
  const fila = useRef<Promise<void>>(Promise.resolve())

  // Lê o dia. Enquanto não terminar, a tela não deixa escrever:
  // assim nunca se salva um texto vazio por cima de um dia que já tinha texto.
  useEffect(() => {
    let cancelado = false
    carregarDia(data).then(
      (salvo) => {
        if (cancelado) return
        setTexto(salvo)
        setLeitura({ data, ok: true })
      },
      () => {
        if (!cancelado) setLeitura({ data, ok: false })
      },
    )
    return () => {
      cancelado = true
    }
  }, [data])

  const salvarAgora = useCallback(() => {
    window.clearTimeout(temporizador.current)
    const aSalvar = pendente.current
    if (aSalvar === null) return
    pendente.current = null
    fila.current = fila.current
      .then(() => salvarDia(data, aSalvar))
      .then((ok) => setFalhouSalvar(!ok))
  }, [data])

  // Salva na hora se a pessoa trocar de aba, fechar o app ou sair da tela.
  useEffect(() => {
    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') salvarAgora()
    }
    document.addEventListener('visibilitychange', aoEsconder)
    window.addEventListener('pagehide', salvarAgora)
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder)
      window.removeEventListener('pagehide', salvarAgora)
      salvarAgora()
    }
  }, [salvarAgora])

  const alterar = useCallback(
    (novoTexto: string) => {
      setTexto(novoTexto)
      pendente.current = novoTexto
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(salvarAgora, ESPERA_PARA_SALVAR)
    },
    [salvarAgora],
  )

  return { texto, fase, falhouSalvar, alterar }
}
