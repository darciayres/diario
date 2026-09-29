import { EMOJI_HUMOR, fundoDaCelula } from './celula.ts'

type Props = {
  /** Número do dia no mês, só para exibir. */
  dia: number
  /** Humores do dia, na ordem dos blocos. */
  humores: number[]
}

export function CelulaCalendario({ dia, humores }: Props) {
  const descricao =
    humores.length === 0 ? 'sem humor' : `humor ${humores.join(', ')}`

  return (
    <div
      className="celula"
      style={{ background: fundoDaCelula(humores) }}
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
