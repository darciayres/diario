// O que os botões da barra de comandos escrevem no texto. Funções puras:
// recebem o texto e a posição do cursor e devolvem o texto novo e onde o cursor fica.
import { blocoDaLinha, comandosDaLinha, parse } from '../parser/index.ts'

export type Edicao = { texto: string; cursor: number }

/** A linha onde está o cursor: número, onde começa e o texto dela. */
function linhaDoCursor(texto: string, cursor: number) {
  const inicio = texto.lastIndexOf('\n', cursor - 1) + 1
  const quebra = texto.indexOf('\n', cursor)
  const fim = quebra === -1 ? texto.length : quebra
  const numero = texto.slice(0, inicio).split('\n').length - 1
  return { numero, inicio, fim, conteudo: texto.slice(inicio, fim) }
}

/** true se o trecho é vazio ou só tem comandos (e espaços). */
function soComandos(trecho: string): boolean {
  const comandos = comandosDaLinha(trecho)
  const fim = comandos.length ? comandos[comandos.length - 1].ate : 0
  return trecho.slice(fim).trim() === ''
}

/**
 * Botão de hora: escreve `hora/HH:MM` onde está o cursor.
 * Se ali o comando não valeria (no meio de uma frase), ele começa uma linha nova a partir do cursor.
 * Quando não há nada depois, o cursor desce para uma linha nova, pronta para escrever.
 */
export function inserirHora(texto: string, cursor: number, hora: string): Edicao {
  const linha = linhaDoCursor(texto, cursor)
  const antes = texto.slice(linha.inicio, cursor)
  const depois = texto.slice(cursor, linha.fim)
  const comando = `hora/${hora}`

  // Pode ficar na mesma linha se antes do cursor só há espaços ou outros comandos (que não sejam hora/).
  const jaTemHora = comandosDaLinha(antes).some((c) => c.tipo === 'hora')
  const mesmaLinha = soComandos(antes) && !jaTemHora
  const prefixo = !mesmaLinha ? '\n' : antes !== '' && !/\s$/.test(antes) ? ' ' : ''
  const sufixo = depois.trim() === '' ? '\n' : /^\s/.test(depois) ? '' : ' '

  const inserido = prefixo + comando + sufixo
  return {
    texto: texto.slice(0, cursor) + inserido + texto.slice(cursor),
    cursor: cursor + inserido.length,
  }
}

/**
 * Botão de humor, como manda o PRODUTO.md:
 * - bloco com hora e sem humor: escreve `humor/N` na linha do `hora/`;
 * - bloco sem hora, ou que já tem humor: abre um bloco novo logo abaixo da linha do cursor,
 *   com a hora atual e o humor (`hora/15:10 humor/3`). Se a linha do cursor estiver vazia, usa ela.
 * Nunca troca um humor que já existe.
 */
export function escreverHumor(texto: string, cursor: number, humor: number, horaAtual: string): Edicao {
  const linha = linhaDoCursor(texto, cursor)
  const bloco = blocoDaLinha(parse(texto).blocos, linha.numero)

  if (bloco.hora !== null && bloco.humor === null) {
    // Logo depois do último comando da linha do hora/.
    const linhas = texto.split('\n')
    const inicioDaLinhaDaHora = linhas.slice(0, bloco.linhaInicial).reduce((soma, l) => soma + l.length + 1, 0)
    const comandos = comandosDaLinha(linhas[bloco.linhaInicial])
    const pos = inicioDaLinhaDaHora + comandos[comandos.length - 1].ate
    const inserido = ` humor/${humor}`
    return {
      texto: texto.slice(0, pos) + inserido + texto.slice(pos),
      cursor: cursor >= pos ? cursor + inserido.length : cursor,
    }
  }

  const novoBloco = `hora/${horaAtual} humor/${humor}`
  if (linha.conteudo.trim() === '') {
    // Linha vazia: o bloco começa nela, e o cursor desce para uma linha nova.
    const inserido = `${novoBloco}\n`
    return {
      texto: texto.slice(0, linha.inicio) + inserido + texto.slice(linha.fim),
      cursor: linha.inicio + inserido.length,
    }
  }
  // Linha com texto: o bloco entra logo abaixo dela, com uma linha nova para escrever.
  const inserido = `\n${novoBloco}\n`
  return {
    texto: texto.slice(0, linha.fim) + inserido + texto.slice(linha.fim),
    cursor: linha.fim + inserido.length,
  }
}

/**
 * Botão de humor em dias passados (regra do PRODUTO.md): escreve só `humor/N` onde está o cursor,
 * sem hora e sem mexer em nada mais. Se ali o comando não valeria (no meio de uma frase), ele
 * começa uma linha nova a partir do cursor. Quando não há nada depois, o cursor desce para uma
 * linha nova, pronta para escrever. Se o bloco já tem humor, o novo abre um momento novo, sem hora.
 */
export function escreverSoHumor(texto: string, cursor: number, humor: number): Edicao {
  const linha = linhaDoCursor(texto, cursor)
  const antes = texto.slice(linha.inicio, cursor)
  const depois = texto.slice(cursor, linha.fim)
  const comando = `humor/${humor}`

  // Pode ficar na mesma linha se antes do cursor só há espaços ou outros comandos.
  const mesmaLinha = soComandos(antes)
  const prefixo = !mesmaLinha ? '\n' : antes !== '' && !/\s$/.test(antes) ? ' ' : ''
  const sufixo = depois.trim() === '' ? '\n' : /^\s/.test(depois) ? '' : ' '

  const inserido = prefixo + comando + sufixo
  return {
    texto: texto.slice(0, cursor) + inserido + texto.slice(cursor),
    cursor: cursor + inserido.length,
  }
}
