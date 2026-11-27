// Parser do texto do dia. Função pura: só lê o texto, não mexe em tela nem em armazenamento.

/** Onde um comando está dentro da linha: da coluna `de` até a coluna `ate` (sem incluir). */
export type Colunas = { de: number; ate: number }

export type Bloco = {
  /** "HH:MM" quando o bloco foi aberto por `hora/`; null no bloco sem horário. */
  hora: string | null
  /** Humor de 1 a 5, ou null se o bloco não tem humor. */
  humor: number | null
  /** Linha (começando em 0) onde o bloco começa. Num bloco com hora, é a linha do `hora/`. */
  linhaInicial: number
  /** Linha (começando em 0) do `humor/N` deste bloco, ou null. */
  linhaHumor: number | null
  /** Posição do `hora/` dentro da linha inicial, ou null. */
  colunasHora: Colunas | null
  /** Posição do `humor/` dentro da linha do humor, ou null. */
  colunasHumor: Colunas | null
  /** true se o bloco foi aberto por um segundo `humor/` sem `hora/` entre eles. */
  abertoPorHumorDuplicado: boolean
}

export type Aviso = Colunas & {
  /** Linha (começando em 0) a que o aviso se refere. */
  linha: number
  tipo: 'humor-invalido' | 'hora-invalida' | 'hora-repetida' | 'humor-no-futuro'
  mensagem: string
}

export type Dia = {
  blocos: Bloco[]
  avisos: Aviso[]
}

export type Comando = Colunas & { tipo: 'hora' | 'humor'; valor: string }

// Um comando no começo do que sobrou da linha. Maiúsculas valem, porque o teclado
// do celular costuma começar a linha com maiúscula. O valor nunca é outro comando:
// em "hora/ humor/4", o hora/ fica vazio e o humor/4 continua sendo um comando.
const COMANDO = /^(\s*)(hora|humor)\/\s*(?!(?:hora|humor)\/)(\S*)/i
const HORARIO = /^([01]?\d|2[0-3]):([0-5]\d)$/

/**
 * Os comandos de uma linha: o primeiro precisa começar a linha, e cada um dos outros
 * precisa vir logo depois do anterior. O que vem depois disso é texto comum.
 */
export function comandosDaLinha(linha: string): Comando[] {
  const comandos: Comando[] = []
  let pos = 0
  for (;;) {
    const achado = COMANDO.exec(linha.slice(pos))
    if (!achado) break
    const de = pos + achado[1].length
    const ate = pos + achado[0].length
    comandos.push({ tipo: achado[2].toLowerCase() as Comando['tipo'], valor: achado[3], de, ate })
    pos = ate
  }
  return comandos
}

export type OpcoesParse = {
  /** true quando o texto é de um dia que ainda não chegou. Nesses dias, `humor/` é sempre erro. */
  diaFuturo?: boolean
}

export function parse(texto: string, { diaFuturo = false }: OpcoesParse = {}): Dia {
  const linhas = texto.split('\n')
  const avisos: Aviso[] = []

  // O dia sempre começa com um bloco sem horário.
  const blocos: Bloco[] = [novoBloco(0, null, null, false)]

  linhas.forEach((linha, i) => {
    const comandos = comandosDaLinha(linha)
    const avisar = (c: Comando, tipo: Aviso['tipo'], mensagem: string) =>
      avisos.push({ linha: i, de: c.de, ate: c.ate, tipo, mensagem })

    // Primeiro o hora/: os comandos de uma linha valem juntos, então o humor da
    // mesma linha entra no bloco que o hora/ abre, esteja antes ou depois dele.
    let abriuBloco = false
    for (const c of comandos.filter((c) => c.tipo === 'hora')) {
      const horario = HORARIO.exec(c.valor)
      if (!horario) {
        avisar(c, 'hora-invalida', 'Use a hora assim: hora/14:30')
      } else if (abriuBloco) {
        avisar(c, 'hora-repetida', 'Só vale um hora/ por linha')
      } else {
        const hh = horario[1].padStart(2, '0')
        blocos.push(novoBloco(i, `${hh}:${horario[2]}`, { de: c.de, ate: c.ate }, false))
        abriuBloco = true
      }
    }

    for (const c of comandos.filter((c) => c.tipo === 'humor')) {
      if (diaFuturo) {
        // Ninguém registra como se sente num dia que ainda não chegou: o comando não conta como humor.
        avisar(c, 'humor-no-futuro', 'Não dá para registrar humor num dia que ainda não chegou')
        continue
      }
      if (!/^[1-5]$/.test(c.valor)) {
        avisar(c, 'humor-invalido', 'O humor vai de 1 a 5. Ex.: humor/4')
        continue
      }
      const valor = Number(c.valor)
      const atual = blocos[blocos.length - 1]
      if (atual.humor === null) {
        atual.humor = valor
        atual.linhaHumor = i
        atual.colunasHumor = { de: c.de, ate: c.ate }
      } else {
        // Cada bloco tem no máximo um humor: o segundo abre um momento novo, sem hora.
        // Não é erro e não ganha aviso (regra do PRODUTO.md).
        const novo = novoBloco(i, null, null, true)
        novo.humor = valor
        novo.linhaHumor = i
        novo.colunasHumor = { de: c.de, ate: c.ate }
        blocos.push(novo)
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

function novoBloco(
  linhaInicial: number,
  hora: string | null,
  colunasHora: Colunas | null,
  abertoPorHumorDuplicado: boolean,
): Bloco {
  return { hora, humor: null, linhaInicial, linhaHumor: null, colunasHora, colunasHumor: null, abertoPorHumorDuplicado }
}
