// Diz às partes do editor como está o dia: no modo ler ou escrever, e se ainda não chegou.
import { Facet } from '@codemirror/state'

export const modoLeitura = Facet.define<boolean, boolean>({
  combine: (valores) => valores.some(Boolean),
})

/** Diz às partes do editor se o dia ainda não chegou (aí humor/ é erro, veja o PRODUTO.md). */
export const diaFuturo = Facet.define<boolean, boolean>({
  combine: (valores) => valores.some(Boolean),
})
