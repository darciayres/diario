import { describe, expect, it } from 'vitest'
import { fundoDaCelula } from './celula.ts'

describe('fundoDaCelula', () => {
  it('sem humor: fundo neutro', () => {
    expect(fundoDaCelula([])).toBe('var(--cell-empty)')
  })

  it('um humor: cor sólida', () => {
    expect(fundoDaCelula([4])).toBe('var(--mood-4)')
  })

  it('dois humores: degradê em oklch, na ordem dos blocos', () => {
    expect(fundoDaCelula([4, 2])).toBe('linear-gradient(in oklch to right, var(--mood-4), var(--mood-2))')
  })

  it('três ou mais humores: degradê com todas as cores', () => {
    expect(fundoDaCelula([1, 3, 5])).toBe(
      'linear-gradient(in oklch to right, var(--mood-1), var(--mood-3), var(--mood-5))',
    )
  })

  it('o mesmo humor repetido também gera degradê (dois blocos, dois registros)', () => {
    expect(fundoDaCelula([3, 3])).toContain('linear-gradient(in oklch')
  })
})
