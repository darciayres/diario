// Nos testes não existe navegador de verdade; este pacote simula o IndexedDB.
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { abrirBanco, carregarDia, carregarDias, salvarDia } from './dia.ts'

beforeEach(async () => {
  const banco = await abrirBanco()
  await banco.clear('dias')
  banco.close()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('salvar e carregar', () => {
  it('o texto salvo continua lá ao carregar de novo', async () => {
    expect(await salvarDia('2026-11-26', 'hora/14:32\nhumor/4')).toBe(true)
    expect(await carregarDia('2026-11-26')).toBe('hora/14:32\nhumor/4')
  })

  it('dia sem registro devolve texto vazio', async () => {
    expect(await carregarDia('2026-01-01')).toBe('')
  })

  it('guarda um registro por dia, sem misturar', async () => {
    await salvarDia('2026-11-25', 'ontem')
    await salvarDia('2026-11-26', 'hoje')
    expect(await carregarDia('2026-11-25')).toBe('ontem')
    expect(await carregarDia('2026-11-26')).toBe('hoje')
  })

  it('salvar de novo o mesmo dia troca o texto, sem criar outro registro', async () => {
    await salvarDia('2026-11-26', 'primeira versão')
    await salvarDia('2026-11-26', 'segunda versão')
    expect(await carregarDia('2026-11-26')).toBe('segunda versão')
    const banco = await abrirBanco()
    expect(await banco.count('dias')).toBe(1)
    banco.close()
  })

  it('guarda no formato { data, texto }', async () => {
    await salvarDia('2026-11-26', 'oi')
    const banco = await abrirBanco()
    expect(await banco.get('dias', '2026-11-26')).toEqual({ data: '2026-11-26', texto: 'oi' })
    banco.close()
  })

  it('guarda acentos, emojis e linhas em branco sem mudar nada', async () => {
    const texto = 'Café às 7h ☕\n\n\nhumor/ 5\n  recuo'
    await salvarDia('2026-11-26', texto)
    expect(await carregarDia('2026-11-26')).toBe(texto)
  })
})

describe('proteção dos dados', () => {
  it('recusa uma data mal formada', async () => {
    expect(await salvarDia('26/11/2026', 'oi')).toBe(false)
    expect(await salvarDia('', 'oi')).toBe(false)
  })

  it('se o navegador não deixar salvar, devolve false', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('armazenamento bloqueado')
    })
    expect(await salvarDia('2026-11-26', 'oi')).toBe(false)
  })

  it('se o navegador não deixar ler, dá erro em vez de fingir que o dia está vazio', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('armazenamento bloqueado')
    })
    await expect(carregarDia('2026-11-26')).rejects.toThrow()
  })
})

describe('carregar vários dias', () => {
  it('devolve o texto de cada dia pedido que tem registro', async () => {
    await salvarDia('2026-10-19', 'ontem')
    await salvarDia('2026-10-20', 'hoje')
    await salvarDia('2026-10-10', 'fora da lista')
    expect(await carregarDias(['2026-10-20', '2026-10-19', '2026-10-18'])).toEqual({
      '2026-10-20': 'hoje',
      '2026-10-19': 'ontem',
    })
  })
})
