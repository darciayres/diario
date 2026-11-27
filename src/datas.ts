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

/** Quantos dias vão de `de` até `ate` (negativo se `ate` vem antes). */
function diasEntre(de: string, ate: string): number {
  const utc = (data: string) => {
    const [ano, mes, dia] = data.split('-').map(Number)
    return Date.UTC(ano, mes - 1, dia)
  }
  return Math.round((utc(ate) - utc(de)) / 86_400_000)
}

/** Quantos meses inteiros vão de `antes` até `depois` (ex.: de 27/10 a 27/11 é um mês; a 26/11, ainda não). */
function mesesInteiros(antes: string, depois: string): number {
  const [a1, m1, d1] = antes.split('-').map(Number)
  const [a2, m2, d2] = depois.split('-').map(Number)
  return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

/** "um dia", "uma semana", "3 dias", "2 meses": o 1 por extenso, os outros em algarismos. */
function quantos(n: number, singular: string, plural: string, feminino = false): string {
  return n === 1 ? `${feminino ? 'uma' : 'um'} ${singular}` : `${n} ${plural}`
}

/**
 * Quão longe de hoje está o dia, como no título (regra do PRODUTO.md): até 6 dias, em dias;
 * de 7 dias até um mês, em semanas e dias; a partir de um mês, só em meses; a partir de um ano,
 * só em anos. Ex.: "há 4 dias", "daqui a uma semana e 3 dias", "há 2 meses".
 * Hoje, ontem e amanhã ficam de fora (devolve null): eles têm um jeito próprio no título.
 */
export function distanciaDeHoje(data: string, hoje: string): string | null {
  const dias = diasEntre(hoje, data)
  if (Math.abs(dias) <= 1) return null
  const distancia = Math.abs(dias)
  let quanto: string
  if (distancia <= 6) {
    quanto = quantos(distancia, 'dia', 'dias')
  } else {
    const meses = dias < 0 ? mesesInteiros(data, hoje) : mesesInteiros(hoje, data)
    if (meses >= 12) {
      quanto = quantos(Math.floor(meses / 12), 'ano', 'anos')
    } else if (meses >= 1) {
      quanto = quantos(meses, 'mês', 'meses')
    } else {
      const semanas = Math.floor(distancia / 7)
      const resto = distancia % 7
      quanto = quantos(semanas, 'semana', 'semanas', true) + (resto ? ` e ${quantos(resto, 'dia', 'dias')}` : '')
    }
  }
  return dias < 0 ? `há ${quanto}` : `daqui a ${quanto}`
}

/**
 * As duas linhas do título do dia, como no Figma. Em cima, o dia da semana, junto de quão perto ele
 * está de hoje (regra do PRODUTO.md): "Quarta-feira" (hoje), "Ontem, terça-feira", "Amanhã,
 * quinta-feira", "Sábado, daqui a 3 dias". Embaixo, o dia e o mês: "20 de Outubro".
 */
export function tituloDoDia(data: string, hoje: string = data): { diaDaSemana: string; diaEMes: string } {
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  const nomeDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const nomeDoMes = d.toLocaleDateString('pt-BR', { month: 'long' })
  const dias = diasEntre(hoje, data)
  const distancia = distanciaDeHoje(data, hoje)
  const diaDaSemana =
    dias === -1
      ? `Ontem, ${nomeDaSemana}`
      : dias === 1
        ? `Amanhã, ${nomeDaSemana}`
        : distancia
          ? `${comMaiuscula(nomeDaSemana)}, ${distancia}`
          : comMaiuscula(nomeDaSemana)
  return { diaDaSemana, diaEMes: `${dia} de ${comMaiuscula(nomeDoMes)}` }
}
