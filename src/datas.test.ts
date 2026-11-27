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

describe('título do dia perto de hoje (regra do PRODUTO.md)', () => {
  const hoje = '2026-10-21' // quarta-feira
  const linha = (data: string) => tituloDoDia(data, hoje).diaDaSemana

  it('hoje: só o dia da semana, como no Figma', () => {
    expect(linha('2026-10-21')).toBe('Quarta-feira')
  })

  it('ontem e amanhã', () => {
    expect(linha('2026-10-20')).toBe('Ontem, terça-feira')
    expect(linha('2026-10-22')).toBe('Amanhã, quinta-feira')
  })

  it('até 6 dias, em dias', () => {
    expect(linha('2026-10-17')).toBe('Sábado, há 4 dias')
    expect(linha('2026-10-24')).toBe('Sábado, daqui a 3 dias')
    expect(linha('2026-10-27')).toBe('Terça-feira, daqui a 6 dias')
  })

  it('de 7 dias até um mês, em semanas e dias', () => {
    expect(linha('2026-10-28')).toBe('Quarta-feira, daqui a uma semana')
    expect(linha('2026-10-31')).toBe('Sábado, daqui a uma semana e 3 dias')
    expect(linha('2026-10-06')).toBe('Terça-feira, há 2 semanas e um dia')
    expect(linha('2026-11-20')).toBe('Sexta-feira, daqui a 4 semanas e 2 dias')
  })

  it('a partir de um mês, só em meses', () => {
    expect(linha('2026-11-21')).toBe('Sábado, daqui a um mês')
    expect(linha('2026-09-21')).toBe('Segunda-feira, há um mês')
    expect(linha('2027-01-25')).toBe('Segunda-feira, daqui a 3 meses')
    expect(linha('2026-06-22')).toBe('Segunda-feira, há 3 meses')
  })

  it('a partir de um ano, só em anos', () => {
    expect(linha('2025-10-21')).toBe('Terça-feira, há um ano')
    expect(linha('2024-03-01')).toBe('Sexta-feira, há 2 anos')
    expect(linha('2027-10-21')).toBe('Quinta-feira, daqui a um ano')
  })
})
