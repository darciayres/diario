// Funções de data. Todas usam o fuso do aparelho e o formato AAAA-MM-DD dos registros.

/** Data de hoje no fuso do aparelho, no formato AAAA-MM-DD. */
export function dataDeHoje(agora: Date = new Date()): string {
  const mm = String(agora.getMonth() + 1).padStart(2, '0')
  const dd = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mm}-${dd}`
}

const comMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** As duas linhas do título do dia, como no Figma. Ex.: { diaDaSemana: "Quarta-feira", diaEMes: "20 de Outubro" }. */
export function tituloDoDia(data: string): { diaDaSemana: string; diaEMes: string } {
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const nomeDoMes = d.toLocaleDateString('pt-BR', { month: 'long' })
  return { diaDaSemana: comMaiuscula(diaDaSemana), diaEMes: `${dia} de ${comMaiuscula(nomeDoMes)}` }
}
