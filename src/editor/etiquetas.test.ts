import { describe, expect, it } from 'vitest'
import { calcularTrechos, posicaoAoTocar } from './etiquetas.ts'

const semCursor: { from: number; to: number }[] = []
const cursorEm = (pos: number) => [{ from: pos, to: pos }]

describe('etiquetas: o que vira etiqueta', () => {
  it('texto sem comandos não tem etiqueta', () => {
    expect(calcularTrechos('acordei cedo', semCursor)).toEqual([])
  })

  it('hora/ numa linha e humor/ na de baixo viram uma fileira só', () => {
    const texto = 'hora/08:30\nhumor/5\nO dia foi ótimo'
    expect(calcularTrechos(texto, semCursor)).toEqual([
      { tipo: 'etiqueta', de: 0, ate: 18, hora: '08:30', humor: 5, linhaInteira: true, fimHora: 10, fimHumor: 18 },
    ])
  })

  it('hora/ sem humor vira só a etiqueta de hora', () => {
    expect(calcularTrechos('hora/09:40', semCursor)).toEqual([
      { tipo: 'etiqueta', de: 0, ate: 10, hora: '09:40', humor: null, linhaInteira: true, fimHora: 10, fimHumor: null },
    ])
  })

  it('humor/ sem hora (no bloco inicial) vira só a etiqueta de humor', () => {
    expect(calcularTrechos('humor/ 2', semCursor)).toEqual([
      { tipo: 'etiqueta', de: 0, ate: 8, hora: null, humor: 2, linhaInteira: true, fimHora: null, fimHumor: 8 },
    ])
  })

  it('comando seguido de texto na mesma linha: só o comando vira etiqueta', () => {
    expect(calcularTrechos('hora/14:32 fui almoçar', semCursor)).toEqual([
      { tipo: 'etiqueta', de: 0, ate: 10, hora: '14:32', humor: null, linhaInteira: false, fimHora: 10, fimHumor: null },
    ])
  })

  it('hora/ e humor/ separados por uma linha de texto viram duas etiquetas', () => {
    const trechos = calcularTrechos('hora/10:15\nfui ao médico\nhumor/2', semCursor)
    expect(trechos.map((t) => t.tipo === 'etiqueta' && [t.hora, t.humor])).toEqual([
      ['10:15', null],
      [null, 2],
    ])
  })

  it('a hora aparece com o zero: hora/9:05 vira 09:05', () => {
    expect(calcularTrechos('hora/9:05', semCursor)).toEqual([expect.objectContaining({ hora: '09:05' })])
  })

  it('comando inválido não vira etiqueta', () => {
    expect(calcularTrechos('humor/7\nhora/25:00', semCursor)).toEqual([])
  })

  it('espaços antes do comando ficam de fora da etiqueta', () => {
    expect(calcularTrechos('  humor/4', semCursor)).toEqual([expect.objectContaining({ de: 2, ate: 9 })])
  })

  it('vários blocos, cada um com a sua fileira', () => {
    const texto = 'bom dia\nhora/08:30\nhumor/5\ncafé\nhora/09:40\nhumor/4\nressaca'
    const trechos = calcularTrechos(texto, semCursor)
    expect(trechos.map((t) => t.tipo === 'etiqueta' && [t.hora, t.humor])).toEqual([
      ['08:30', 5],
      ['09:40', 4],
    ])
  })
})

describe('etiquetas: vários comandos na mesma linha', () => {
  it('hora/14:30 humor/5 sozinhos na linha viram uma fileira só', () => {
    expect(calcularTrechos('hora/14:30 humor/5\nalmocei', semCursor)).toEqual([
      { tipo: 'etiqueta', de: 0, ate: 18, hora: '14:30', humor: 5, linhaInteira: true, fimHora: 10, fimHumor: 18 },
    ])
  })

  it('com texto depois, a fileira fica no começo da linha e o texto segue ao lado', () => {
    expect(calcularTrechos('hora/14:30 humor/5 almocei fora', semCursor)).toEqual([
      expect.objectContaining({ de: 0, ate: 18, hora: '14:30', humor: 5, linhaInteira: false }),
    ])
  })

  it('na ordem invertida, a fileira mostra a hora primeiro do mesmo jeito', () => {
    expect(calcularTrechos('humor/5 hora/14:30', semCursor)).toEqual([
      expect.objectContaining({ de: 0, ate: 18, hora: '14:30', humor: 5, fimHora: 18, fimHumor: 7 }),
    ])
  })

  it('um comando inválido no meio separa as etiquetas e continua visível como texto', () => {
    const trechos = calcularTrechos('hora/14:30 humor/7 humor/4', semCursor)
    expect(trechos.map((t) => [t.de, t.ate])).toEqual([
      [0, 10],
      [19, 26],
    ])
  })
})

describe('etiquetas: cursor em cima do comando', () => {
  const texto = 'hora/08:30\nhumor/5\nO dia' // a fileira vai de 0 a 18

  it('com o cursor dentro, o comando volta a ser texto, com destaque', () => {
    expect(calcularTrechos(texto, cursorEm(3))).toEqual([
      { tipo: 'ativo', de: 0, ate: 10 },
      { tipo: 'ativo', de: 11, ate: 18 },
    ])
  })

  it('com o cursor logo no fim do comando também (a pessoa está escrevendo nele)', () => {
    expect(calcularTrechos(texto, cursorEm(18))[0].tipo).toBe('ativo')
  })

  it('com o cursor na linha do texto, a etiqueta continua', () => {
    expect(calcularTrechos(texto, cursorEm(20))[0].tipo).toBe('etiqueta')
  })

  it('uma seleção que passa por cima do comando também mostra o texto', () => {
    expect(calcularTrechos(texto, [{ from: 15, to: 22 }])[0].tipo).toBe('ativo')
  })
})

describe('etiquetas: tocar põe o cursor no fim do comando', () => {
  const texto = 'café\nhora/08:30\nhumor/4\nO dia' // a fileira começa na posição 5

  it('tocar na hora põe o cursor logo depois da hora', () => {
    expect(posicaoAoTocar(texto, 5, 'hora')).toBe(15) // depois de "hora/08:30"
  })

  it('tocar no humor põe o cursor logo depois do número', () => {
    expect(posicaoAoTocar(texto, 5, 'humor')).toBe(23) // depois de "humor/4"
  })

  it('tocar no espaço entre as etiquetas põe o cursor no fim da fileira', () => {
    expect(posicaoAoTocar(texto, 5, null)).toBe(23)
  })

  it('posição que não é de etiqueta não muda nada', () => {
    expect(posicaoAoTocar(texto, 0, 'hora')).toBeNull()
  })
})
