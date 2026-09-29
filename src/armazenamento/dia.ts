// Guarda e lê o texto de um dia no localStorage, só neste aparelho.
// Um registro por dia: { data: "AAAA-MM-DD", texto: string }.

export type RegistroDia = { data: string; texto: string }

const PREFIXO = 'diario:'

const chave = (data: string) => `${PREFIXO}${data}`

/** Data de hoje no fuso do aparelho, no formato AAAA-MM-DD. */
export function dataDeHoje(agora: Date = new Date()): string {
  const mm = String(agora.getMonth() + 1).padStart(2, '0')
  const dd = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mm}-${dd}`
}

/** Hora atual do aparelho, no formato HH:MM. */
export function horaAgora(agora: Date = new Date()): string {
  const hh = String(agora.getHours()).padStart(2, '0')
  const mm = String(agora.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Lê o texto salvo do dia. Sem registro (ou registro ilegível), devolve texto vazio. */
export function carregarDia(data: string): string {
  try {
    const bruto = localStorage.getItem(chave(data))
    if (bruto === null) return ''
    const registro = JSON.parse(bruto) as Partial<RegistroDia>
    return typeof registro.texto === 'string' ? registro.texto : ''
  } catch {
    return ''
  }
}

/** Salva o texto do dia. Devolve false se o navegador recusar (ex.: armazenamento cheio ou bloqueado). */
export function salvarDia(data: string, texto: string): boolean {
  try {
    const registro: RegistroDia = { data, texto }
    localStorage.setItem(chave(data), JSON.stringify(registro))
    return true
  } catch {
    return false
  }
}
