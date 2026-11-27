// Barra lateral ("Sidebar" no Figma). Abre por cima da tela pelo botão no canto superior
// esquerdo e fecha pelo mesmo botão ou tocando fora dela. Animação do Figma (Smart Animate,
// ease-out, 0,3 s): o painel aparece esmaecendo e o botão desliza até a borda dele.
//
// Tudo o que está no Figma aparece. O que o MVP ainda não prevê (Central até a tarefa 5.4,
// novo lembrete até a 6.5, busca, Ver calendário e Configurações) aparece, mas não faz nada.
// A faixa da semana fica em FaixaDaSemana, e a lista de dias em ListaDeDias.
import { useEffect } from 'react'
import iconeNovoLembrete from '../assets/icones/alarm_add.svg'
import iconeCentral from '../assets/icones/dataset.svg'
import iconeEspaco from '../assets/icones/dataset_vazio.svg'
import iconeBusca from '../assets/icones/search.svg'
import iconeConfiguracoes from '../assets/icones/settings.svg'
import iconeBarraLateral from '../assets/icones/view_sidebar.svg'
import './BarraLateral.css'
import { FaixaDaSemana } from './FaixaDaSemana.tsx'
import { ListaDeDias } from './ListaDeDias.tsx'
import { useAlturaSemTeclado } from './useEspacoDoTeclado.ts'

type Props = {
  aberta: boolean
  aoAbrir: () => void
  aoFechar: () => void
  /** Hoje, no formato AAAA-MM-DD. */
  hoje: string
  /** O dia aberto agora, no formato AAAA-MM-DD. */
  diaAberto: string
  /** Abre um dia (AAAA-MM-DD); com `hora`, já no momento desse horário. */
  aoAbrirDia: (data: string, hora?: string) => void
}

// Botões que aparecem como no Figma, mas ainda não fazem nada no MVP.
const semAcao = { 'aria-disabled': true, onClick: () => {} } as const

export function BarraLateral({ aberta, aoAbrir, aoFechar, hoje, diaAberto, aoAbrirDia }: Props) {
  // A mesma altura da tela do dia: a tela inteira, sem contar o teclado.
  const alturaSemTeclado = useAlturaSemTeclado()

  // A tecla Esc também fecha (no computador).
  useEffect(() => {
    if (!aberta) return
    const fecharComEsc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', fecharComEsc)
    return () => document.removeEventListener('keydown', fecharComEsc)
  }, [aberta, aoFechar])

  return (
    <div
      className={`barra-lateral${aberta ? ' barra-lateral--aberta' : ''}`}
      style={alturaSemTeclado ? { height: alturaSemTeclado } : undefined}
    >
      {/* A área fora do painel: tocar nela fecha a barra. */}
      <div className="barra-lateral__fora" aria-hidden="true" onClick={aoFechar} />

      <nav className="barra-lateral__painel" aria-label="Barra lateral" inert={!aberta}>
        <div className="barra-lateral__conteudo">
          <div className="barra-lateral__topo">
            <button type="button" className="barra-lateral__botao-grande" {...semAcao}>
              <img src={iconeCentral} alt="" width={24} height={24} />
              <span>Central</span>
              <img src={iconeEspaco} alt="" width={24} height={24} />
            </button>

            <div className="barra-lateral__calendario">
              <FaixaDaSemana hoje={hoje} diaAberto={diaAberto} visivel={aberta} aoAbrirDia={(data) => aoAbrirDia(data)} />
              <div className="barra-lateral__acoes">
                <button type="button" className="barra-lateral__ver-calendario" {...semAcao}>
                  Ver calendário
                </button>
                <button type="button" className="barra-lateral__novo-lembrete" aria-label="Novo lembrete" {...semAcao}>
                  <img src={iconeNovoLembrete} alt="" width={22} height={22} />
                </button>
              </div>
            </div>
          </div>

          <div className="barra-lateral__busca-e-lista">
            <div className="barra-lateral__busca" aria-disabled="true">
              <span>Pesquise aqui....</span>
              <img src={iconeBusca} alt="" width={24} height={24} />
            </div>

            <ListaDeDias hoje={hoje} visivel={aberta} aoAbrirDia={aoAbrirDia} />
          </div>

          <hr className="barra-lateral__divisoria" />
          <button type="button" className="barra-lateral__botao-grande" {...semAcao}>
            <img src={iconeConfiguracoes} alt="" width={24} height={24} />
            <span>Configurações</span>
            <img src={iconeEspaco} alt="" width={24} height={24} />
          </button>
        </div>
      </nav>

      <button
        type="button"
        className="barra-lateral__botao"
        aria-label={aberta ? 'Fechar barra lateral' : 'Abrir barra lateral'}
        aria-expanded={aberta}
        onClick={aberta ? aoFechar : aoAbrir}
      >
        <img src={iconeBarraLateral} alt="" width={32} height={32} />
      </button>
    </div>
  )
}
