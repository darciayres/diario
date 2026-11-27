import { describe, expect, it } from 'vitest'
import { escreverHumor, escreverSoHumor, inserirHora } from './comandos.ts'

/** Mostra o resultado com uma barra | onde fica o cursor, para os testes ficarem fáceis de ler. */
const comCursor = ({ texto, cursor }: { texto: string; cursor: number }) =>
  texto.slice(0, cursor) + '|' + texto.slice(cursor)

/** Lê um texto com | marcando o cursor. */
const ler = (marcado: string) => ({ texto: marcado.replace('|', ''), cursor: marcado.indexOf('|') })

const hora = (marcado: string) => {
  const { texto, cursor } = ler(marcado)
  return comCursor(inserirHora(texto, cursor, '14:30'))
}

const humor = (marcado: string, n = 4) => {
  const { texto, cursor } = ler(marcado)
  return comCursor(escreverHumor(texto, cursor, n, '15:10'))
}

describe('botão de hora', () => {
  it('no dia vazio, escreve a hora e desce o cursor para escrever', () => {
    expect(hora('|')).toBe('hora/14:30\n|')
  })

  it('numa linha vazia depois de um texto, escreve ali', () => {
    expect(hora('acordei cedo\n|')).toBe('acordei cedo\nhora/14:30\n|')
  })

  it('no fim de uma frase, começa uma linha nova (no meio da frase o comando não valeria)', () => {
    expect(hora('acordei cedo|')).toBe('acordei cedo\nhora/14:30\n|')
  })

  it('no começo de uma linha com texto, a hora entra antes do texto, na mesma linha', () => {
    expect(hora('|almocei fora')).toBe('hora/14:30 |almocei fora')
  })

  it('no meio de uma frase, o resto da frase vai junto para a linha nova', () => {
    expect(hora('fui ao parque| e voltei')).toBe('fui ao parque\nhora/14:30| e voltei')
  })

  it('depois de um humor/, fica na mesma linha', () => {
    expect(hora('humor/4 |')).toBe('humor/4 hora/14:30\n|')
  })

  it('numa linha que já tem hora/, começa uma linha nova (só vale um por linha)', () => {
    expect(hora('hora/09:00 |')).toBe('hora/09:00 \nhora/14:30\n|')
  })
})

describe('botão de humor', () => {
  it('bloco com hora e sem humor: escreve o humor na linha do hora/', () => {
    expect(humor('hora/14:30\nalmocei fora|')).toBe('hora/14:30 humor/4\nalmocei fora|')
  })

  it('o humor entra logo depois dos comandos, antes do texto da linha', () => {
    expect(humor('hora/14:30 almocei fora|')).toBe('hora/14:30 humor/4 almocei fora|')
  })

  it('com o cursor na própria linha do hora/, também', () => {
    expect(humor('hora/14:30|')).toBe('hora/14:30 humor/4|')
  })

  it('bloco sem hora (começo do dia): abre um bloco novo abaixo da linha do cursor', () => {
    expect(humor('acordei cedo|')).toBe('acordei cedo\nhora/15:10 humor/4\n|')
  })

  it('no dia vazio, o bloco começa na própria linha', () => {
    expect(humor('|')).toBe('hora/15:10 humor/4\n|')
  })

  it('numa linha vazia, usa a própria linha', () => {
    expect(humor('acordei cedo\n|')).toBe('acordei cedo\nhora/15:10 humor/4\n|')
  })

  it('bloco que já tem humor: não troca, abre um bloco novo com a hora atual', () => {
    expect(humor('hora/14:30 humor/2\nreunião difícil|', 5)).toBe(
      'hora/14:30 humor/2\nreunião difícil\nhora/15:10 humor/5\n|',
    )
  })

  it('com o cursor no meio do bloco, o texto de baixo passa para o bloco novo', () => {
    expect(humor('hora/14:30 humor/2\nlinha um|\nlinha dois', 5)).toBe(
      'hora/14:30 humor/2\nlinha um\nhora/15:10 humor/5\n|\nlinha dois',
    )
  })

  it('não mexe no resto do texto', () => {
    const antes = 'bom dia\n\nhora/08:00 humor/3\ncafé\nhora/14:30\nalmoço|'
    expect(humor(antes)).toBe('bom dia\n\nhora/08:00 humor/3\ncafé\nhora/14:30 humor/4\nalmoço|')
  })
})

describe('botão de humor em dias passados (só humor/N, sem hora)', () => {
  const soHumor = (marcado: string, n = 3) => {
    const { texto, cursor } = ler(marcado)
    return comCursor(escreverSoHumor(texto, cursor, n))
  }

  it('no começo de uma linha vazia: escreve o humor e desce para uma linha nova', () => {
    expect(soHumor('|')).toBe('humor/3\n|')
    expect(soHumor('Acordei tarde.\n|')).toBe('Acordei tarde.\nhumor/3\n|')
  })

  it('na linha do hora/: fica logo depois dele, sem inventar hora', () => {
    expect(soHumor('hora/09:15|')).toBe('hora/09:15 humor/3\n|')
  })

  it('no começo de uma linha com texto: o texto continua depois do humor', () => {
    expect(soHumor('|Dormi mal.')).toBe('humor/3 |Dormi mal.')
  })

  it('no meio de uma frase: começa uma linha nova a partir do cursor', () => {
    expect(soHumor('Dormi mal|, mas acordei bem.')).toBe('Dormi mal\nhumor/3 |, mas acordei bem.')
    expect(soHumor('Dormi mal.|')).toBe('Dormi mal.\nhumor/3\n|')
  })

  it('num bloco que já tem humor: escreve mesmo assim (vira um momento novo, sem hora)', () => {
    expect(soHumor('humor/2\n|', 4)).toBe('humor/2\nhumor/4\n|')
  })
})
