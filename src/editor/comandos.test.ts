import { describe, expect, it } from 'vitest'
import { parse } from '../parser/index.ts'
import { aplicarHumor, inserirHoraAutomatica, linhaDoCursor } from './comandos.ts'

describe('linhaDoCursor', () => {
  it('conta as quebras de linha antes do cursor', () => {
    expect(linhaDoCursor('ab\ncd\nef', 0)).toBe(0)
    expect(linhaDoCursor('ab\ncd\nef', 3)).toBe(1)
    expect(linhaDoCursor('ab\ncd\nef', 8)).toBe(2)
  })
})

describe('aplicarHumor (botão de humor)', () => {
  it('bloco sem humor: insere humor/N', () => {
    const r = aplicarHumor('oi', 2, 4)
    expect(r.texto).toBe('humor/4\noi')
  })

  it('dia vazio: insere humor/N', () => {
    expect(aplicarHumor('', 0, 3).texto).toBe('humor/3\n')
  })

  it('bloco com hora: insere logo abaixo do hora/', () => {
    const texto = 'hora/14:32 almoço\nfui comer'
    const r = aplicarHumor(texto, texto.length, 5)
    expect(r.texto).toBe('hora/14:32 almoço\nhumor/5\nfui comer')
  })

  it('bloco com humor: troca o valor', () => {
    const texto = 'hora/14:32\nhumor/4\nfui comer'
    const r = aplicarHumor(texto, texto.length, 2)
    expect(r.texto).toBe('hora/14:32\nhumor/2\nfui comer')
  })

  it('troca também a forma "humor/ 1" e preserva o texto que vem depois', () => {
    expect(aplicarHumor('humor/ 1 cansada', 0, 3).texto).toBe('humor/3 cansada')
  })

  it('nunca abre bloco novo: o número de blocos não muda ao inserir nem ao trocar', () => {
    const inicial = 'hora/14:32\nhumor/4\n\nhora/16:05'
    const antes = parse(inicial).blocos.length
    // Cursor no bloco das 16:05 (sem humor): insere.
    const inserido = aplicarHumor(inicial, inicial.length, 3)
    expect(parse(inserido.texto).blocos).toHaveLength(antes)
    expect(parse(inserido.texto).avisos).toEqual([])
    // Cursor no bloco das 14:32 (com humor): troca.
    const trocado = aplicarHumor(inicial, 5, 1)
    expect(parse(trocado.texto).blocos).toHaveLength(antes)
    expect(trocado.texto).toBe('hora/14:32\nhumor/1\n\nhora/16:05')
  })

  it('age só no bloco do cursor, sem tocar nos outros', () => {
    const inicial = 'hora/14:32\nhumor/4\n\nhora/16:05\nhumor/3'
    const r = aplicarHumor(inicial, inicial.length, 5)
    expect(r.texto).toBe('hora/14:32\nhumor/4\n\nhora/16:05\nhumor/5')
  })

  it('o cursor acompanha o texto depois da inserção', () => {
    const texto = 'oi'
    const r = aplicarHumor(texto, 2, 4)
    expect(r.texto.slice(0, r.cursor)).toBe('humor/4\noi')
  })
})

describe('inserirHoraAutomatica (segundo humor digitado)', () => {
  // Texto logo depois de a pessoa digitar o "3" do segundo humor; cursor no fim.
  const digitado = 'hora/14:32\nhumor/4\n\nhumor/3'

  it('insere hora/ com a hora atual antes do novo humor', () => {
    const r = inserirHoraAutomatica(digitado, digitado.length, '16:05')
    expect(r?.texto).toBe('hora/14:32\nhumor/4\n\nhora/16:05\nhumor/3')
  })

  it('o resultado tem dois blocos, cada um com seu humor, e nenhum aviso', () => {
    const r = inserirHoraAutomatica(digitado, digitado.length, '16:05')!
    const { blocos, avisos } = parse(r.texto)
    expect(blocos.filter((b) => b.humor !== null).map((b) => [b.hora, b.humor])).toEqual([
      ['14:32', 4],
      ['16:05', 3],
    ])
    expect(avisos).toEqual([])
  })

  it('mantém o cursor no fim do humor digitado', () => {
    const r = inserirHoraAutomatica(digitado, digitado.length, '16:05')!
    expect(r.cursor).toBe(r.texto.length)
  })

  it('funciona no bloco inicial sem horário', () => {
    const r = inserirHoraAutomatica('humor/2\nhumor/5', 15, '09:00')
    expect(r?.texto).toBe('humor/2\nhora/09:00\nhumor/5')
  })

  it('não faz nada quando o bloco ainda não tem humor', () => {
    expect(inserirHoraAutomatica('hora/14:32\nhumor/4', 18, '16:05')).toBeNull()
  })

  it('não faz nada com humor inválido', () => {
    expect(inserirHoraAutomatica('humor/4\nhumor/7', 15, '16:05')).toBeNull()
  })

  it('não mexe em duplicidade que está em outra linha que não a do cursor (texto colado antes)', () => {
    const colado = 'humor/4\nhumor/3\nescrevendo aqui'
    expect(inserirHoraAutomatica(colado, colado.length, '16:05')).toBeNull()
  })
})
