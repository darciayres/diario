// Botão de alternar entre ler e escrever ("toggle ler,escrever V3" no Figma).
// Animação do Figma (Smart Animate, ease-out, 0,3 s): o fundo verde desliza para o lado
// escolhido e os ícones trocam de cor (claro sobre o verde, verde sobre o fundo claro).
import iconeLerAtivo from '../assets/icones/menu_book_ativo.svg'
import iconeLer from '../assets/icones/menu_book.svg'
import iconeEscreverAtivo from '../assets/icones/mode_edit_ativo.svg'
import iconeEscrever from '../assets/icones/mode_edit.svg'
import './AlternarModo.css'

export type Modo = 'ler' | 'escrever'

type Props = {
  modo: Modo
  aoEscolher: (modo: Modo) => void
}

export function AlternarModo({ modo, aoEscolher }: Props) {
  return (
    <div className={`alternar-modo alternar-modo--${modo}`} role="group" aria-label="Modo do dia">
      <span className="alternar-modo__fundo" aria-hidden="true" />
      <button
        type="button"
        className="alternar-modo__botao alternar-modo__botao--ler"
        aria-label="Ler"
        aria-pressed={modo === 'ler'}
        onClick={() => aoEscolher('ler')}
      >
        <img className="alternar-modo__icone" src={iconeLer} alt="" width={28} height={28} />
        <img className="alternar-modo__icone alternar-modo__icone--ativo" src={iconeLerAtivo} alt="" width={28} height={28} />
      </button>
      <button
        type="button"
        className="alternar-modo__botao alternar-modo__botao--escrever"
        aria-label="Escrever"
        aria-pressed={modo === 'escrever'}
        // Não tira o foco do editor (no celular, isso fecharia o teclado).
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => aoEscolher('escrever')}
      >
        <img className="alternar-modo__icone" src={iconeEscrever} alt="" width={20} height={20} />
        <img
          className="alternar-modo__icone alternar-modo__icone--ativo"
          src={iconeEscreverAtivo}
          alt=""
          width={20}
          height={20}
        />
      </button>
    </div>
  )
}
