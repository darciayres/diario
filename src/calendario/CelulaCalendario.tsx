import { EMOJI_HUMOR, fundoDaCelula } from './celula.ts'

type Props = {
  /** Número do dia no mês, só para exibir. */
  dia: number
  /** Humores do dia, na ordem dos blocos. */
  humores: number[]
  /** true na célula do dia que está aberto: recebe um contorno. */
  atual?: boolean
}

export function CelulaCalendario({ dia, humores, atual = false }: Props) {
  const descricao =
    humores.length === 0 ? 'sem humor' : `humor ${humores.join(', ')}`

  return (
    <div
      className={atual ? 'celula celula-atual' : 'celula'}
      style={{ background: fundoDaCelula(humores) }}
      aria-current={atual ? 'date' : undefined}
      role="img"
      aria-label={`Dia ${dia}, ${descricao}`}
    >
      <span className="celula-dia">{dia}</span>
      {/* Emoji e número acompanham a cor, para não depender só dela. */}
      <span className="celula-humores" aria-hidden="true">
        {humores.map((h, i) => (
          <span key={i}>{EMOJI_HUMOR[h]}</span>
        ))}
      </span>
    </div>
  )
}
