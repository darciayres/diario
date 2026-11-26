// Barra de comandos do Escritor ("command bar" no Figma), fixa logo acima do teclado.
// No MVP ficam só os botões de hora e de humor; sentimento e apelido ficam escondidos,
// e terapia e lembrete entram nas fases 5 e 6.
import { useState, type CSSProperties, type PointerEvent } from 'react'
import iconeHora from '../assets/icones/alarm.svg'
import iconeHumor from '../assets/icones/sentiment_satisfied_alt.svg'
import { NOMES_DO_HUMOR } from '../humor.ts'
import './BarraDeComandos.css'
import { useEspacoDoTeclado } from './useEspacoDoTeclado.ts'

type Props = {
  aoInserirHora: () => void
  aoEscolherHumor: (humor: number) => void
}

// Tocar num botão não pode tirar o foco do editor: no celular, isso fecharia o teclado.
const manterFocoNoEditor = (e: PointerEvent) => e.preventDefault()

export function BarraDeComandos({ aoInserirHora, aoEscolherHumor }: Props) {
  const [humorAberto, setHumorAberto] = useState(false)
  const espacoDoTeclado = useEspacoDoTeclado()

  return (
    <div
      className="barra-comandos"
      style={{ '--espaco-do-teclado': `${espacoDoTeclado}px` } as CSSProperties}
      onKeyDown={(e) => e.key === 'Escape' && setHumorAberto(false)}
    >
      {humorAberto && (
        <div className="humor-popup" role="group" aria-label="Escolha o humor">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="humor-popup__celula"
              aria-label={`${n} · ${NOMES_DO_HUMOR[n]}`}
              onPointerDown={manterFocoNoEditor}
              onClick={() => {
                setHumorAberto(false)
                aoEscolherHumor(n)
              }}
            >
              <span className="humor-popup__ponto" style={{ background: `var(--humor-${n})` }} aria-hidden="true" />
              <span aria-hidden="true">{n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="barra-comandos__botoes" role="toolbar" aria-label="Comandos">
        <button
          type="button"
          className="barra-comandos__botao"
          aria-label="Inserir a hora atual"
          onPointerDown={manterFocoNoEditor}
          onClick={() => {
            setHumorAberto(false)
            aoInserirHora()
          }}
        >
          <img src={iconeHora} alt="" width={24} height={24} />
        </button>
        <button
          type="button"
          className="barra-comandos__botao"
          aria-label="Escolher o humor"
          aria-expanded={humorAberto}
          onPointerDown={manterFocoNoEditor}
          onClick={() => setHumorAberto((aberto) => !aberto)}
        >
          <img src={iconeHumor} alt="" width={24} height={24} />
        </button>
      </div>
    </div>
  )
}
