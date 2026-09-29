// Funções que alteram o texto do dia a partir de ações do editor.
// Também são puras: recebem texto e posição do cursor e devolvem o novo texto.
import { blocoDaLinha, parse } from '../parser/index.ts'

export type Edicao = {
  texto: string
  /** Nova posição do cursor (índice de caractere no texto). */
  cursor: number
}

/** Número da linha (a partir de 0) em que está o cursor. */
export function linhaDoCursor(texto: string, cursor: number): number {
  return texto.slice(0, cursor).split('\n').length - 1
}

/** Índice do primeiro caractere da linha dada. */
function inicioDaLinha(linhas: string[], linha: number): number {
  let indice = 0
  for (let i = 0; i < linha; i++) indice += linhas[i].length + 1
  return indice
}

/**
 * Botão de humor: age no bloco do cursor e nunca abre bloco novo.
 * Bloco sem humor: insere `humor/N`. Bloco com humor: troca o valor.
 */
export function aplicarHumor(texto: string, cursor: number, humor: number): Edicao {
  const linhas = texto.split('\n')
  const linhaCursor = linhaDoCursor(texto, cursor)
  const bloco = blocoDaLinha(parse(texto).blocos, linhaCursor)
  const novaLinha = `humor/${humor}`

  if (bloco.linhaHumor !== null) {
    const inicio = inicioDaLinha(linhas, bloco.linhaHumor)
    const antiga = linhas[bloco.linhaHumor]
    // Troca só o comando e preserva o que vier depois dele na mesma linha.
    const nova = antiga.replace(/^(\s*)humor\/\s*\S*/i, `$1${novaLinha}`)
    linhas[bloco.linhaHumor] = nova
    const fimAntigo = inicio + antiga.length
    // Cursor depois da linha: acompanha a mudança de tamanho. Dentro dela: fica dentro dela.
    const cursorNovo = cursor > fimAntigo ? cursor + (nova.length - antiga.length) : Math.min(cursor, inicio + nova.length)
    return { texto: linhas.join('\n'), cursor: cursorNovo }
  }

  // Insere logo abaixo do `hora/` do bloco; no bloco sem horário, no começo do dia.
  const linhaInsercao = bloco.hora !== null ? bloco.linhaInicial + 1 : 0
  const inicio = inicioDaLinha(linhas, linhaInsercao)
  linhas.splice(linhaInsercao, 0, novaLinha)
  const inserido = novaLinha.length + 1
  return { texto: linhas.join('\n'), cursor: cursor >= inicio ? cursor + inserido : cursor }
}

/**
 * Regra do editor (não do parser): quando a pessoa digita um `humor/` e o bloco
 * já tem humor, insere `hora/` com a hora atual antes do novo humor, abrindo
 * um bloco novo. Devolve null quando não há nada a fazer.
 *
 * Deve ser chamada só para texto digitado, nunca para texto colado: no colado,
 * a hora seria falsa, e o parser trata o caso sozinho.
 */
export function inserirHoraAutomatica(texto: string, cursor: number, agora: string): Edicao | null {
  const linhaCursor = linhaDoCursor(texto, cursor)
  const { blocos } = parse(texto)
  const duplicado = blocos.find((b) => b.abertoPorHumorDuplicado && b.linhaInicial === linhaCursor)
  if (!duplicado) return null

  const linhas = texto.split('\n')
  const inicio = inicioDaLinha(linhas, linhaCursor)
  const horaLinha = `hora/${agora}\n`
  return {
    texto: texto.slice(0, inicio) + horaLinha + texto.slice(inicio),
    cursor: cursor + horaLinha.length,
  }
}
