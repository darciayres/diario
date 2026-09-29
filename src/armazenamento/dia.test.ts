import { beforeEach, describe, expect, it } from 'vitest'
import { carregarDia, dataDeHoje, horaAgora, salvarDia } from './dia.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('salvar e carregar', () => {
  it('o texto salvo continua lá ao carregar de novo', () => {
    salvarDia('2026-09-29', 'hora/14:32\nhumor/4')
    expect(carregarDia('2026-09-29')).toBe('hora/14:32\nhumor/4')
  })

  it('dia sem registro devolve texto vazio', () => {
    expect(carregarDia('2026-01-01')).toBe('')
  })

  it('guarda um registro por dia, sem misturar', () => {
    salvarDia('2026-09-28', 'ontem')
    salvarDia('2026-09-29', 'hoje')
    expect(carregarDia('2026-09-28')).toBe('ontem')
    expect(carregarDia('2026-09-29')).toBe('hoje')
  })

  it('guarda no formato { data, texto }', () => {
    salvarDia('2026-09-29', 'oi')
    expect(JSON.parse(localStorage.getItem('diario:2026-09-29')!)).toEqual({ data: '2026-09-29', texto: 'oi' })
  })

  it('registro corrompido não quebra: devolve texto vazio', () => {
    localStorage.setItem('diario:2026-09-29', '{isso não é json')
    expect(carregarDia('2026-09-29')).toBe('')
  })
})

describe('data e hora', () => {
  it('dataDeHoje usa AAAA-MM-DD com zeros', () => {
    expect(dataDeHoje(new Date(2026, 0, 5, 10, 0))).toBe('2026-01-05')
  })

  it('horaAgora usa HH:MM com zeros', () => {
    expect(horaAgora(new Date(2026, 0, 5, 9, 7))).toBe('09:07')
  })
})
