// Diz às partes do editor se o dia está no modo ler (true) ou escrever (false).
import { Facet } from '@codemirror/state'

export const modoLeitura = Facet.define<boolean, boolean>({
  combine: (valores) => valores.some(Boolean),
})
