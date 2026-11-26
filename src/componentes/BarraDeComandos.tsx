// Barra de comandos do Escritor ("command bar" no Figma), fixa logo acima do teclado.
// No MVP ficam só os botões de hora e de humor; sentimento e apelido ficam escondidos,
// e terapia e lembrete entram nas fases 5 e 6.
import { useState, type CSSProperties } from 'react'
import iconeRecolher from '../assets/icones/chevron_right.svg'
import iconeHora from '../assets/icones/alarm.svg'
import iconeHumor from '../assets/icones/sentiment_satisfied_alt.svg'
import { NOMES_DO_HUMOR } from '../humor.ts'
import './BarraDeComandos.css'
import { naoTirarFoco } from './naoTirarFoco.ts'
import { useEspacoDoTeclado } from './useEspacoDoTeclado.ts'

type Props = {
  aoInserirHora: () => void
  aoEscolherHumor: (humor: number) => void
  /** Devolve o foco ao texto depois de um toque (garantia extra para o teclado não descer). */
  aoTocar?: () => void
}


export function BarraDeComandos({ aoInserirHora, aoEscolherHumor, aoTocar }: Props) {
  const [humorAberto, setHumorAberto] = useState(false)
  // A setinha recolhe os botões e mostra de novo (animação do Figma: 0,3 s).
  const [recolhida, setRecolhida] = useState(false)
  const espacoDoTeclado = useEspacoDoTeclado()

  return (
    <div
      className="barra-comandos"
      style={{ '--espaco-do-teclado': `${espacoDoTeclado}px` } as CSSProperties}
      onKeyDown={(e) => e.key === 'Escape' && setHumorAberto(false)}
    >
      {/* Fica sempre na página para poder aparecer e sumir com animação; fechado, não recebe toques. */}
      <div
        className={`humor-popup${humorAberto ? ' humor-popup--aberto' : ''}`}
        role="group"
        aria-label="Escolha o humor"
        aria-hidden={!humorAberto}
        inert={!humorAberto}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="humor-popup__celula"
            aria-label={`${n} · ${NOMES_DO_HUMOR[n]}`}
            {...naoTirarFoco}
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

      <div className="barra-comandos__linha">
        <div
          className={`barra-comandos__botoes${recolhida ? ' barra-comandos__botoes--recolhida' : ''}`}
          role="toolbar"
          aria-label="Comandos"
          aria-hidden={recolhida}
          inert={recolhida}
        >
          <button
            type="button"
            className="barra-comandos__botao"
            aria-label="Inserir a hora atual"
            {...naoTirarFoco}
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
            {...naoTirarFoco}
            onClick={() => {
              setHumorAberto((aberto) => !aberto)
              aoTocar?.()
            }}
          >
            <img src={iconeHumor} alt="" width={24} height={24} />
          </button>
        </div>
        <button
          type="button"
          className={`barra-comandos__recolher${recolhida ? ' barra-comandos__recolher--recolhida' : ''}`}
          aria-label={recolhida ? 'Mostrar a barra de comandos' : 'Recolher a barra de comandos'}
          aria-expanded={!recolhida}
          {...naoTirarFoco}
          onClick={() => {
            setHumorAberto(false)
            setRecolhida((r) => !r)
          }}
        >
          <img src={iconeRecolher} alt="" width={28} height={28} />
        </button>
      </div>
    </div>
  )
}
