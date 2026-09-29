import { describe, expect, it } from 'vitest'
import { blocoDaLinha, parse } from './index.ts'

describe('parse: blocos', () => {
  it('o dia sempre começa com um bloco sem horário, mesmo vazio', () => {
    const { blocos, avisos } = parse('')
    expect(blocos).toHaveLength(1)
    expect(blocos[0].hora).toBeNull()
    expect(blocos[0].humor).toBeNull()
    expect(avisos).toEqual([])
  })

  it('texto comum fica no bloco sem horário', () => {
    const { blocos } = parse('acordei cedo\nfiz café')
    expect(blocos).toHaveLength(1)
    expect(blocos[0].hora).toBeNull()
  })

  it('hora/ abre um bloco com horário', () => {
    const { blocos } = parse('bom dia\nhora/14:32 fui almoçar')
    expect(blocos).toHaveLength(2)
    expect(blocos[0].hora).toBeNull()
    expect(blocos[1].hora).toBe('14:32')
    expect(blocos[1].linhaInicial).toBe(1)
  })

  it('completa o zero da hora: hora/9:05 vira 09:05', () => {
    expect(parse('hora/9:05').blocos[1].hora).toBe('09:05')
  })

  it('só hora/ abre bloco com horário: humor/ sozinho não abre', () => {
    const { blocos } = parse('humor/3')
    expect(blocos).toHaveLength(1)
    expect(blocos[0].hora).toBeNull()
  })

  it('aceita o comando com letra maiúscula (teclado do celular)', () => {
    const { blocos } = parse('Hora/10:00\nHumor/2')
    expect(blocos[1].hora).toBe('10:00')
    expect(blocos[1].humor).toBe(2)
  })
})

describe('parse: humor', () => {
  it.each([1, 2, 3, 4, 5])('humor/%i vale', (n) => {
    expect(parse(`humor/${n}`).blocos[0].humor).toBe(n)
  })

  it('humor/1 e humor/ 1 valem ambos', () => {
    expect(parse('humor/1').blocos[0].humor).toBe(1)
    expect(parse('humor/ 1').blocos[0].humor).toBe(1)
  })

  it('hora/14:32 seguido de humor/4 é um bloco só', () => {
    const { blocos, avisos } = parse('hora/14:32\nhumor/4')
    expect(blocos).toHaveLength(2) // o bloco inicial (vazio) e o das 14:32
    expect(blocos[1].hora).toBe('14:32')
    expect(blocos[1].humor).toBe(4)
    expect(blocos[1].linhaHumor).toBe(1)
    expect(avisos).toEqual([])
  })

  it('cada bloco tem no máximo um humor: hora/ entre dois humores gera dois blocos', () => {
    const { blocos, avisos } = parse('hora/14:32\nhumor/4\n\nhora/16:05\nhumor/3')
    expect(blocos.map((b) => [b.hora, b.humor])).toEqual([
      [null, null],
      ['14:32', 4],
      ['16:05', 3],
    ])
    expect(avisos).toEqual([])
  })
})

describe('parse: caso limite (dois humor/ no mesmo bloco sem hora/)', () => {
  it('o segundo abre um bloco novo sem horário, com aviso', () => {
    const { blocos, avisos } = parse('hora/14:32\nhumor/4\nhumor/3')
    expect(blocos).toHaveLength(3)
    expect(blocos[1]).toMatchObject({ hora: '14:32', humor: 4 })
    expect(blocos[2]).toMatchObject({ hora: null, humor: 3, abertoPorHumorDuplicado: true, linhaInicial: 2 })
    expect(avisos).toEqual([expect.objectContaining({ linha: 2, tipo: 'humor-duplicado' })])
  })

  it('funciona também no bloco inicial sem horário', () => {
    const { blocos, avisos } = parse('humor/2\nhumor/5')
    expect(blocos.map((b) => b.humor)).toEqual([2, 5])
    expect(avisos).toHaveLength(1)
  })
})

describe('parse: comandos inválidos', () => {
  it.each(['humor/7', 'humor/abc', 'humor/0', 'humor/12', 'humor/'])('%s vira texto comum, com aviso', (linha) => {
    const { blocos, avisos } = parse(linha)
    expect(blocos[0].humor).toBeNull()
    expect(avisos).toEqual([expect.objectContaining({ linha: 0, tipo: 'humor-invalido' })])
  })

  it.each(['hora/25:00', 'hora/12:60', 'hora/abc', 'hora/'])('%s vira texto comum, com aviso', (linha) => {
    const { blocos, avisos } = parse(linha)
    expect(blocos).toHaveLength(1)
    expect(avisos).toEqual([expect.objectContaining({ linha: 0, tipo: 'hora-invalida' })])
  })

  it('humor inválido não conta como humor do bloco', () => {
    const { blocos, avisos } = parse('humor/7\nhumor/3')
    expect(blocos).toHaveLength(1)
    expect(blocos[0].humor).toBe(3)
    expect(avisos).toHaveLength(1)
  })

  it('a palavra humor no meio de uma frase não é comando', () => {
    const { blocos, avisos } = parse('meu humor/hoje foi bom')
    expect(blocos[0].humor).toBeNull()
    expect(avisos).toEqual([])
  })
})

describe('blocoDaLinha', () => {
  const { blocos } = parse('oi\nhora/14:32\nhumor/4\ntexto\nhora/16:05')

  it('linhas antes do primeiro hora/ estão no bloco sem horário', () => {
    expect(blocoDaLinha(blocos, 0).hora).toBeNull()
  })

  it('a própria linha hora/ pertence ao bloco que ela abre', () => {
    expect(blocoDaLinha(blocos, 1).hora).toBe('14:32')
  })

  it('linhas seguintes pertencem ao último bloco aberto', () => {
    expect(blocoDaLinha(blocos, 3).hora).toBe('14:32')
    expect(blocoDaLinha(blocos, 4).hora).toBe('16:05')
  })

  it('hora/ na primeira linha: o bloco dessa linha é o com horário', () => {
    expect(blocoDaLinha(parse('hora/08:00\nx').blocos, 0).hora).toBe('08:00')
  })
})
