import { describe, expect, it } from 'vitest'
import { dataDeHoje, tituloDoDia } from './datas.ts'

describe('dataDeHoje', () => {
  it('usa AAAA-MM-DD com zeros', () => {
    expect(dataDeHoje(new Date(2026, 0, 5, 10, 0))).toBe('2026-01-05')
  })

  it('usa o dia do aparelho, mesmo perto da meia-noite', () => {
    expect(dataDeHoje(new Date(2026, 10, 26, 23, 59))).toBe('2026-11-26')
    expect(dataDeHoje(new Date(2026, 10, 27, 0, 1))).toBe('2026-11-27')
  })
})

describe('tituloDoDia', () => {
  it('escreve o dia da semana e o dia com o mês, com maiúscula', () => {
    expect(tituloDoDia('2026-10-21')).toEqual({ diaDaSemana: 'Quarta-feira', diaEMes: '21 de Outubro' })
  })

  it('não põe zero na frente do dia', () => {
    expect(tituloDoDia('2026-11-01').diaEMes).toBe('1 de Novembro')
  })

  it('funciona com sábado e domingo', () => {
    expect(tituloDoDia('2026-11-28').diaDaSemana).toBe('Sábado')
    expect(tituloDoDia('2026-11-29').diaDaSemana).toBe('Domingo')
  })
})
