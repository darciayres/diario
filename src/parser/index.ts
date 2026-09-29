// Parser do texto do dia. Função pura: só lê o texto, não mexe em tela nem em armazenamento.

export type Bloco = {
  /** "HH:MM" quando o bloco foi aberto por `hora/`; null no bloco sem horário. */
  hora: string | null
  /** Humor de 1 a 5, ou null se o bloco não tem humor. */
  humor: number | null
  /** Linha (começando em 0) onde o bloco começa. */
  linhaInicial: number
  /** Linha (começando em 0) da linha `humor/N` deste bloco, ou null. */
  linhaHumor: number | null
  /** true se o bloco foi aberto por um segundo `humor/` sem `hora/` entre eles. */
  abertoPorHumorDuplicado: boolean
}

export type Aviso = {
  /** Linha (começando em 0) a que o aviso se refere. */
  linha: number
  tipo: 'humor-invalido' | 'hora-invalida' | 'humor-duplicado'
  mensagem: string
}

export type Dia = {
  blocos: Bloco[]
  avisos: Aviso[]
}

// O comando fica no começo da linha. Maiúsculas são aceitas porque o teclado
// do celular costuma capitalizar a primeira letra da linha.
const LINHA_HUMOR = /^\s*humor\/\s*(\S*)/i
const LINHA_HORA = /^\s*hora\/\s*(\S*)/i
const HORARIO = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function parse(texto: string): Dia {
  const linhas = texto.split('\n')
  const avisos: Aviso[] = []

  // O dia sempre começa com um bloco sem horário.
  const blocos: Bloco[] = [novoBloco(0, null, false)]

  linhas.forEach((linha, i) => {
    const atual = blocos[blocos.length - 1]

    const hora = LINHA_HORA.exec(linha)
    if (hora) {
      const horario = HORARIO.exec(hora[1])
      if (horario) {
        const hh = horario[1].padStart(2, '0')
        blocos.push(novoBloco(i, `${hh}:${horario[2]}`, false))
      } else {
        avisos.push({ linha: i, tipo: 'hora-invalida', mensagem: 'Hora inválida. Use hora/HH:MM, por exemplo hora/14:32.' })
      }
      return
    }

    const humor = LINHA_HUMOR.exec(linha)
    if (humor) {
      if (!/^[1-5]$/.test(humor[1])) {
        avisos.push({ linha: i, tipo: 'humor-invalido', mensagem: 'Humor inválido. Use humor/1 até humor/5.' })
        return
      }
      const valor = Number(humor[1])
      if (atual.humor === null) {
        atual.humor = valor
        atual.linhaHumor = i
      } else {
        // Dois humores no mesmo bloco sem hora/ entre eles: o segundo abre um bloco novo sem horário.
        const novo = novoBloco(i, null, true)
        novo.humor = valor
        novo.linhaHumor = i
        blocos.push(novo)
        avisos.push({ linha: i, tipo: 'humor-duplicado', mensagem: 'Já havia um humor neste bloco. Este abriu um bloco novo, sem horário.' })
      }
    }
  })

  return { blocos, avisos }
}

/** Devolve o bloco onde está a linha (a última linha de comando que abriu bloco até ela). */
export function blocoDaLinha(blocos: Bloco[], linha: number): Bloco {
  let escolhido = blocos[0]
  for (const bloco of blocos) {
    if (bloco.linhaInicial <= linha) escolhido = bloco
  }
  return escolhido
}

function novoBloco(linhaInicial: number, hora: string | null, abertoPorHumorDuplicado: boolean): Bloco {
  return { hora, humor: null, linhaInicial, linhaHumor: null, abertoPorHumorDuplicado }
}
