// Funções de data. Todas usam o fuso do aparelho e o formato AAAA-MM-DD dos registros.

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

const comMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** Converte AAAA-MM-DD num Date ao meio-dia (longe da meia-noite, para o horário de verão não atrapalhar). */
function paraDate(data: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia, 12)
}

/** A data `dias` dias depois (ou antes, se negativo) de `data`, no formato AAAA-MM-DD. */
export function somarDias(data: string, dias: number): string {
  const d = paraDate(data)
  d.setDate(d.getDate() + dias)
  return dataDeHoje(d)
}

/** Os 7 dias da semana de `data`, de segunda a domingo, no formato AAAA-MM-DD. */
export function semanaDe(data: string): string[] {
  const diaDaSemana = paraDate(data).getDay() // 0 = domingo
  const segunda = somarDias(data, -((diaDaSemana + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i))
}

/**
 * Como o dia aparece na lista de dias da barra lateral (Figma: "Lista de dias (Sidebar)"):
 * "Hoje, Quarta-Feira (20/10/26)", "Ontem, Terça-Feira (19/10/26)" ou "Segunda-Feira (16/10/26)".
 */
export function rotuloNaListaDeDias(data: string, hoje: string): string {
  const d = paraDate(data)
  const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-').map(comMaiuscula).join('-')
  const [ano, mes, dia] = data.split('-')
  const prefixo = data === hoje ? 'Hoje, ' : data === somarDias(hoje, -1) ? 'Ontem, ' : ''
  return `${prefixo}${diaDaSemana} (${dia}/${mes}/${ano.slice(2)})`
}

/** As duas linhas do título do dia, como no Figma. Ex.: { diaDaSemana: "Quarta-feira", diaEMes: "20 de Outubro" }. */
export function tituloDoDia(data: string): { diaDaSemana: string; diaEMes: string } {
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const nomeDoMes = d.toLocaleDateString('pt-BR', { month: 'long' })
  return { diaDaSemana: comMaiuscula(diaDaSemana), diaEMes: `${dia} de ${comMaiuscula(nomeDoMes)}` }
}
