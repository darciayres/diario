import { describe, expect, it } from 'vitest'
import { dataDeHoje, horaAgora, rotuloNaListaDeDias, semanaDe, somarDias, tituloDoDia } from './datas.ts'

describe('horaAgora', () => {
  it('usa HH:MM com zeros', () => {
    expect(horaAgora(new Date(2026, 0, 5, 9, 7))).toBe('09:07')
    expect(horaAgora(new Date(2026, 0, 5, 23, 59))).toBe('23:59')
  })
})

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

describe('somarDias', () => {
  it('anda para a frente e para trás, virando o mês e o ano', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31')
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('rotuloNaListaDeDias', () => {
  const hoje = '2026-10-20' // uma terça-feira

  it('marca hoje e ontem, como no Figma', () => {
    expect(rotuloNaListaDeDias('2026-10-20', hoje)).toBe('Hoje, Terça-Feira (20/10/26)')
    expect(rotuloNaListaDeDias('2026-10-19', hoje)).toBe('Ontem, Segunda-Feira (19/10/26)')
  })

  it('nos outros dias, só o dia da semana e a data', () => {
    expect(rotuloNaListaDeDias('2026-10-18', hoje)).toBe('Domingo (18/10/26)')
    expect(rotuloNaListaDeDias('2026-10-17', hoje)).toBe('Sábado (17/10/26)')
    expect(rotuloNaListaDeDias('2026-10-15', hoje)).toBe('Quinta-Feira (15/10/26)')
  })
})

describe('semanaDe', () => {
  it('vai de segunda a domingo', () => {
    const semana = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']
    expect(semanaDe('2026-10-21')).toEqual(semana) // quarta
    expect(semanaDe('2026-10-19')).toEqual(semana) // segunda
    expect(semanaDe('2026-10-25')).toEqual(semana) // domingo
  })
})
