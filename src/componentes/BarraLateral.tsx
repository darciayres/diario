// Barra lateral ("Sidebar" no Figma). Abre por cima da tela pelo botão no canto superior
// esquerdo e fecha pelo mesmo botão ou tocando fora dela. Animação do Figma (Smart Animate,
// ease-out, 0,3 s): o painel aparece esmaecendo e o botão desliza até a borda dele.
//
// Tudo o que está no Figma aparece. O que o MVP ainda não prevê (Central até a tarefa 5.4,
// novo lembrete até a 6.5, busca, Ver calendário e Configurações) aparece, mas não faz nada.
// A faixa da semana (tarefa 4.3) e a lista de dias (4.2) ainda são simples: só a semana de hoje
// e o dia de hoje.
import { useEffect } from 'react'
import iconeNovoLembrete from '../assets/icones/alarm_add.svg'
import iconeSetaHoje from '../assets/icones/arrow_forward_ios_primaria.svg'
import iconeCentral from '../assets/icones/dataset.svg'
import iconeEspaco from '../assets/icones/dataset_vazio.svg'
import iconeBusca from '../assets/icones/search.svg'
import iconeConfiguracoes from '../assets/icones/settings.svg'
import iconeBarraLateral from '../assets/icones/view_sidebar.svg'
import { rotuloNaListaDeDias, semanaDe } from '../datas.ts'
import './BarraLateral.css'

type Props = {
  aberta: boolean
  aoAbrir: () => void
  aoFechar: () => void
  /** Hoje, no formato AAAA-MM-DD. */
  hoje: string
}

const LETRAS_DA_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

// Botões que aparecem como no Figma, mas ainda não fazem nada no MVP.
const semAcao = { 'aria-disabled': true, onClick: () => {} } as const

export function BarraLateral({ aberta, aoAbrir, aoFechar, hoje }: Props) {
  // A tecla Esc também fecha (no computador).
  useEffect(() => {
    if (!aberta) return
    const fecharComEsc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', fecharComEsc)
    return () => document.removeEventListener('keydown', fecharComEsc)
  }, [aberta, aoFechar])

  return (
    <div className={`barra-lateral${aberta ? ' barra-lateral--aberta' : ''}`}>
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
              <div className="barra-lateral__semana">
                <div className="barra-lateral__letras" aria-hidden="true">
                  {LETRAS_DA_SEMANA.map((letra, i) => (
                    <span key={i}>{letra}</span>
                  ))}
                </div>
                <div className="barra-lateral__dias">
                  {semanaDe(hoje).map((data) => (
                    <span key={data} className={`barra-lateral__dia${data === hoje ? ' barra-lateral__dia--hoje' : ''}`}>
                      {Number(data.slice(8))}
                    </span>
                  ))}
                </div>
              </div>
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

            <div className="barra-lateral__lista">
              <button type="button" className="barra-lateral__dia-da-lista barra-lateral__dia-da-lista--hoje" onClick={aoFechar}>
                <img src={iconeSetaHoje} alt="" width={16} height={16} />
                <span>{rotuloNaListaDeDias(hoje, hoje)}</span>
              </button>
              <hr className="barra-lateral__divisoria" />
            </div>
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
