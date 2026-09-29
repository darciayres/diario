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

/** Soma (ou subtrai, com número negativo) dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  // O JavaScript acerta sozinho a virada de mês e de ano (e os anos bissextos).
  return dataDeHoje(new Date(ano, mes - 1, dia + dias))
}

/** Data por extenso, para exibir. Ex.: "terça-feira, 29 de setembro de 2026". */
export function dataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Data curta, para legendas. Ex.: "29/09". */
export function dataCurta(data: string): string {
  return `${data.slice(8)}/${data.slice(5, 7)}`
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
