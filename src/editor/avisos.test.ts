import { describe, expect, it } from 'vitest'
import { calcularAvisos } from './avisos.ts'

const longe = 999 // cursor longe dos comandos

describe('aviso de comando inválido', () => {
  it('texto sem erro não tem aviso', () => {
    expect(calcularAvisos('hora/14:30 humor/4\nalmocei', longe, null).marcas).toEqual([])
  })

  it('humor/7 ganha aviso, com a mensagem de como corrigir', () => {
    expect(calcularAvisos('acordei\nhumor/7', longe, null).marcas).toEqual([
      { de: 8, ate: 15, mensagem: 'O humor vai de 1 a 5. Ex.: humor/4' },
    ])
  })

  it('hora inválida ganha aviso', () => {
    expect(calcularAvisos('hora/25:00', longe, null).marcas).toEqual([
      { de: 0, ate: 10, mensagem: 'Use a hora assim: hora/14:30' },
    ])
  })

  it('só o comando inválido é marcado, os válidos da linha não', () => {
    expect(calcularAvisos('hora/14:30 humor/7 almocei', longe, null).marcas).toEqual([
      expect.objectContaining({ de: 11, ate: 18 }),
    ])
  })

  it('humor em dia futuro ganha o mesmo aviso, com outra mensagem', () => {
    expect(calcularAvisos('humor/4', longe, null, true).marcas).toEqual([
      expect.objectContaining({ mensagem: 'Não dá para registrar humor num dia que ainda não chegou' }),
    ])
  })

  it('dois humores no mesmo bloco não são erro', () => {
    expect(calcularAvisos('humor/2\nhumor/4', longe, null).marcas).toEqual([])
  })
})

describe('enquanto a pessoa ainda escreve na linha', () => {
  it('a linha em edição não mostra aviso (não pisca erro a cada letra)', () => {
    expect(calcularAvisos('acordei\nhumor/', 14, 1).marcas).toEqual([])
  })

  it('as outras linhas continuam mostrando', () => {
    expect(calcularAvisos('humor/9\nhumor/', 14, 1).marcas).toHaveLength(1)
  })
})

describe('balão com o motivo', () => {
  it('aparece quando o cursor está no comando com erro', () => {
    expect(calcularAvisos('acordei\nhumor/7', 12, null).balao).toEqual(
      expect.objectContaining({ mensagem: 'O humor vai de 1 a 5. Ex.: humor/4' }),
    )
  })

  it('também com o cursor logo no fim do comando', () => {
    expect(calcularAvisos('humor/7', 7, null).balao).not.toBeNull()
  })

  it('não aparece com o cursor longe', () => {
    expect(calcularAvisos('humor/7\nacordei', 12, null).balao).toBeNull()
  })

  it('não aparece enquanto a pessoa ainda escreve na linha', () => {
    expect(calcularAvisos('humor/7', 7, 0).balao).toBeNull()
  })
})
