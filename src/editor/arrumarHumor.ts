// Regras do PRODUTO.md para o humor que a pessoa DIGITA (texto colado nunca é mexido).
// Função pura: recebe o texto e a linha onde o humor foi digitado e devolve as mudanças a fazer.
// O editor chama isto quando o cursor sai da linha.
import { comandosDaLinha, parse } from '../parser/index.ts'

/** Uma troca no texto: tira o que vai de `de` até `ate` e põe `inserir` no lugar. */
export type Mudanca = { de: number; ate: number; inserir: string }

/**
 * - Bloco com hora e sem humor: o humor vai para a linha do `hora/`; se a linha dele ficar vazia, ela some.
 * - Bloco sem hora (o começo do dia), ou bloco que já tinha humor: ganha `hora/` com a hora atual
 *   antes do humor, na mesma linha, abrindo um bloco novo. Só no dia de hoje.
 * Devolve null quando não há nada a fazer.
 */
export function arrumarHumorDigitado(texto: string, linha: number, horaAtual: string, hoje = true): Mudanca[] | null {
  const linhas = texto.split('\n')
  if (linha < 0 || linha >= linhas.length) return null
  const inicioDa = (n: number) => linhas.slice(0, n).reduce((soma, l) => soma + l.length + 1, 0)

  // O bloco cujo humor está nesta linha.
  const bloco = parse(texto).blocos.find((b) => b.linhaHumor === linha && b.colunasHumor)
  if (!bloco || !bloco.colunasHumor) return null

  if (bloco.hora !== null) {
    // Já está na linha do hora/: nada a fazer.
    if (bloco.linhaInicial === linha) return null

    // Leva o humor para logo depois do último comando da linha do hora/.
    const comandosDaHora = comandosDaLinha(linhas[bloco.linhaInicial])
    const destino = inicioDa(bloco.linhaInicial) + comandosDaHora[comandosDaHora.length - 1].ate
    const levar: Mudanca = { de: destino, ate: destino, inserir: ` humor/${bloco.humor}` }

    // Tira o humor (e os espaços logo depois dele) da linha onde foi digitado.
    const conteudo = linhas[linha]
    let ate = bloco.colunasHumor.ate
    while (ate < conteudo.length && /\s/.test(conteudo[ate])) ate++
    const sobra = conteudo.slice(0, bloco.colunasHumor.de) + conteudo.slice(ate)
    const inicio = inicioDa(linha)
    let tirar: Mudanca
    if (sobra.trim() === '') {
      // A linha ficou vazia: some, junto com a quebra de linha.
      tirar =
        linha < linhas.length - 1
          ? { de: inicio, ate: inicio + conteudo.length + 1, inserir: '' }
          : { de: inicio - 1, ate: inicio + conteudo.length, inserir: '' }
    } else {
      tirar = { de: inicio + bloco.colunasHumor.de, ate: inicio + ate, inserir: '' }
    }
    // Humor na última linha, logo abaixo do hora/: as duas trocas começam no mesmo ponto e viram uma só.
    if (levar.de === tirar.de) return [{ de: tirar.de, ate: tirar.ate, inserir: levar.inserir }]
    return [levar, tirar].sort((a, b) => a.de - b.de)
  }

  // Bloco sem hora: no dia de hoje, o humor ganha a hora atual. Em outros dias, fica como está.
  if (!hoje) return null
  const pos = inicioDa(linha) + bloco.colunasHumor.de
  return [{ de: pos, ate: pos, inserir: `hora/${horaAtual} ` }]
}

/** Aplica as mudanças a um texto (útil para os testes e para conferir o resultado). */
export function aplicarMudancas(texto: string, mudancas: Mudanca[]): string {
  let resultado = texto
  for (const m of [...mudancas].sort((a, b) => b.de - a.de)) {
    resultado = resultado.slice(0, m.de) + m.inserir + resultado.slice(m.ate)
  }
  return resultado
}
