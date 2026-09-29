import { beforeEach, describe, expect, it } from 'vitest'
import { carregarDia, dataDeHoje, dataPorExtenso, horaAgora, salvarDia, somarDias } from './dia.ts'

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

describe('somarDias', () => {
  it('avança e volta um dia', () => {
    expect(somarDias('2026-09-29', 1)).toBe('2026-09-30')
    expect(somarDias('2026-09-29', -1)).toBe('2026-09-28')
  })

  it('vira o mês e o ano', () => {
    expect(somarDias('2026-09-30', 1)).toBe('2026-10-01')
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('respeita o ano bissexto', () => {
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(somarDias('2027-02-28', 1)).toBe('2027-03-01')
  })
})

describe('dataPorExtenso', () => {
  it('escreve o dia da semana, o dia, o mês e o ano em português', () => {
    expect(dataPorExtenso('2026-09-29')).toBe('terça-feira, 29 de setembro de 2026')
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
