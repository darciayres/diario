import { describe, expect, it } from 'vitest'
import { aplicarMudancas, arrumarHumorDigitado } from './arrumarHumor.ts'

/** Arruma o humor digitado na linha indicada e devolve o texto resultante (ou o mesmo texto, se nada mudar). */
const arrumar = (texto: string, linha: number, hoje = true) => {
  const mudancas = arrumarHumorDigitado(texto, linha, '09:12', hoje)
  return mudancas ? aplicarMudancas(texto, mudancas) : texto
}

describe('humor digitado num bloco com hora', () => {
  it('vai para a linha do hora/, e a linha de onde saiu some', () => {
    expect(arrumar('hora/14:30\nalmocei fora\nhumor/4', 2)).toBe('hora/14:30 humor/4\nalmocei fora')
  })

  it('a linha vazia some também no meio do texto', () => {
    expect(arrumar('hora/14:30\nhumor/4\nalmocei fora', 1)).toBe('hora/14:30 humor/4\nalmocei fora')
  })

  it('se a linha tem texto depois do humor, só o comando sai e o texto fica', () => {
    expect(arrumar('hora/14:30\nalmocei\nhumor/4 me sentindo bem', 2)).toBe(
      'hora/14:30 humor/4\nalmocei\nme sentindo bem',
    )
  })

  it('entra logo depois dos comandos da linha do hora/, antes do texto', () => {
    expect(arrumar('hora/14:30 almocei fora\nhumor/4', 1)).toBe('hora/14:30 humor/4 almocei fora')
  })

  it('o número do humor é mantido, com ou sem espaço depois da barra', () => {
    expect(arrumar('hora/14:30\nhumor/ 2', 1)).toBe('hora/14:30 humor/2')
  })

  it('já na linha do hora/: nada muda', () => {
    expect(arrumarHumorDigitado('hora/14:30 humor/4\nalmocei', 0, '09:12')).toBeNull()
  })

  it('em dias passados, fica onde foi escrito (o app não mexe no humor)', () => {
    expect(arrumarHumorDigitado('hora/14:30\nalmocei\nhumor/4', 2, '09:12', false)).toBeNull()
  })
})

describe('humor digitado num bloco sem hora (começo do dia)', () => {
  it('ganha hora/ com a hora atual antes dele, na mesma linha', () => {
    expect(arrumar('acordei cedo\nhumor/4', 1)).toBe('acordei cedo\nhora/09:12 humor/4')
  })

  it('no dia vazio também', () => {
    expect(arrumar('humor/3', 0)).toBe('hora/09:12 humor/3')
  })

  it('com texto depois do humor, o texto continua na linha', () => {
    expect(arrumar('humor/3 acordei bem', 0)).toBe('hora/09:12 humor/3 acordei bem')
  })

  it('em dias passados, fica onde foi escrito (sem hora inventada)', () => {
    expect(arrumarHumorDigitado('acordei cedo\nhumor/4', 1, '09:12', false)).toBeNull()
  })
})

describe('humor digitado num bloco que já tem humor', () => {
  it('ganha hora/ com a hora atual, abrindo um bloco novo', () => {
    expect(arrumar('hora/14:30 humor/2\nreunião difícil\nhumor/3', 2)).toBe(
      'hora/14:30 humor/2\nreunião difícil\nhora/09:12 humor/3',
    )
  })

  it('em dias passados, fica onde foi escrito (o bloco novo fica sem hora)', () => {
    expect(arrumarHumorDigitado('hora/14:30 humor/2\nhumor/3', 1, '09:12', false)).toBeNull()
  })
})

describe('o que não é humor válido não é mexido', () => {
  it('humor inválido', () => {
    expect(arrumarHumorDigitado('hora/14:30\nhumor/7', 1, '09:12')).toBeNull()
  })

  it('linha sem humor', () => {
    expect(arrumarHumorDigitado('hora/14:30\nalmocei', 1, '09:12')).toBeNull()
  })

  it('linha que não existe', () => {
    expect(arrumarHumorDigitado('oi', 5, '09:12')).toBeNull()
  })
})
