// Faixa da semana da barra lateral (Figma: "carrosel calendário" com os dias "Data S").
// Os 7 dias, de segunda a domingo. Embaixo de cada dia, um pontinho para cada humor do dia, na cor
// do humor e na ordem do texto: até 3 e, se houver mais, um "+". Hoje tem o fundo verde.
// Arrastando para o lado, vai para a semana de antes ou a de depois (animação do Figma: Smart
// Animate, 0,4 s, ease-in-out). Tocar num dia abre esse dia, passado ou futuro.
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import iconeMais from '../assets/icones/add.svg'
import { carregarDias } from '../armazenamento/dia.ts'
import { semanaDe, somarDias } from '../datas.ts'
import { NOMES_DO_HUMOR } from '../humor.ts'
import { parse } from '../parser/index.ts'
import './FaixaDaSemana.css'

const LETRAS_DA_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const NOMES_DA_SEMANA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
// Largura de uma semana na faixa (7 dias de 32 px, 6 espaços de 2 px e 2 px de cada lado).
const LARGURA_DA_SEMANA = 240
// Quanto é preciso arrastar (em pixels) para trocar de semana.
const ARRASTE_PARA_TROCAR = 50
// Até quanto o dedo pode andar e ainda contar como toque (e não arraste).
const FOLGA_DO_TOQUE = 8
// Duração do deslize entre semanas, igual ao Figma (0,4 s); o mesmo valor está no CSS.
const DURACAO_DO_DESLIZE = 400
// Quantos pontinhos aparecem antes do "+".
const MAXIMO_DE_PONTINHOS = 3

type Props = {
  hoje: string
  /** O dia aberto agora: a faixa começa na semana dele. */
  diaAberto: string
  /** true enquanto a barra lateral está aberta: a faixa lê os humores de novo a cada abertura. */
  visivel: boolean
  aoAbrirDia: (data: string) => void
}

/** Os humores do texto de um dia, na ordem em que aparecem (dia futuro não tem humor). */
function humoresDoTexto(texto: string, diaFuturo: boolean): number[] {
  return parse(texto, { diaFuturo }).blocos.flatMap((bloco) => (bloco.humor !== null ? [bloco.humor] : []))
}

export function FaixaDaSemana({ hoje, diaAberto, visivel, aoAbrirDia }: Props) {
  // A segunda-feira da semana à mostra.
  const [segunda, setSegunda] = useState(() => semanaDe(diaAberto)[0])
  const [humores, setHumores] = useState<Record<string, number[]>>({})
  // Arraste em andamento: quanto o dedo já andou, e se a faixa está deslizando sozinha até uma semana.
  const [deslocamento, setDeslocamento] = useState(0)
  const [deslizando, setDeslizando] = useState(false)
  const arraste = useRef<{ x: number; id: number; arrastou: boolean } | null>(null)
  // Para que lado a faixa está deslizando sozinha (1: semana seguinte, -1: anterior, 0: volta), ou null.
  const deslizeEmAndamento = useRef<number | null>(null)
  const ignorarClique = useRef(false)

  // Ao abrir a barra, a faixa volta para a semana do dia aberto.
  const [estavaVisivel, setEstavaVisivel] = useState(visivel)
  if (visivel !== estavaVisivel) {
    setEstavaVisivel(visivel)
    if (visivel) setSegunda(semanaDe(diaAberto)[0])
  }

  // As três semanas na faixa: a de antes, a à mostra e a de depois (para o arraste mostrar as vizinhas).
  const semanas = [-7, 0, 7].map((dias) => semanaDe(somarDias(segunda, dias)))

  // Lê os humores das três semanas sempre que a barra abre ou a semana muda.
  useEffect(() => {
    if (!visivel) return
    let ativo = true
    const datas = [-7, 0, 7].flatMap((dias) => semanaDe(somarDias(segunda, dias)))
    carregarDias(datas)
      .then((textos) => {
        if (!ativo) return
        const porDia: Record<string, number[]> = {}
        for (const [data, texto] of Object.entries(textos)) porDia[data] = humoresDoTexto(texto, data > hoje)
        setHumores((antes) => ({ ...antes, ...porDia }))
      })
      .catch(() => {
        // Sem conseguir ler, a faixa continua funcionando, só sem os pontinhos.
      })
    return () => {
      ativo = false
    }
  }, [visivel, segunda, hoje])

  function comecarArraste(e: PointerEvent<HTMLDivElement>) {
    if (deslizeEmAndamento.current !== null) return
    arraste.current = { x: e.clientX, id: e.pointerId, arrastou: false }
  }

  function moverArraste(e: PointerEvent<HTMLDivElement>) {
    const atual = arraste.current
    if (!atual || atual.id !== e.pointerId) return
    const dx = e.clientX - atual.x
    if (!atual.arrastou && Math.abs(dx) > FOLGA_DO_TOQUE) {
      atual.arrastou = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    if (atual.arrastou) setDeslocamento(Math.max(-LARGURA_DA_SEMANA, Math.min(LARGURA_DA_SEMANA, dx)))
  }

  function soltarArraste(e: PointerEvent<HTMLDivElement>) {
    const atual = arraste.current
    if (!atual || atual.id !== e.pointerId) return
    arraste.current = null
    if (!atual.arrastou) return
    // O clique que vem logo depois do arraste não abre um dia.
    ignorarClique.current = true
    window.setTimeout(() => (ignorarClique.current = false), 0)
    // Desliza até a semana vizinha (ou volta para a mesma, se arrastou pouco).
    const direcao = deslocamento <= -ARRASTE_PARA_TROCAR ? 1 : deslocamento >= ARRASTE_PARA_TROCAR ? -1 : 0
    deslizeEmAndamento.current = direcao
    setDeslizando(true)
    setDeslocamento(-direcao * LARGURA_DA_SEMANA)
    // Garantia: termina mesmo se não houver animação (ex.: "reduzir movimento" ligado).
    window.setTimeout(terminarDeslize, DURACAO_DO_DESLIZE + 50)
  }

  // Terminado o deslize, a semana nova passa a ser a do meio, sem animação.
  function terminarDeslize() {
    const direcao = deslizeEmAndamento.current
    if (direcao === null) return
    deslizeEmAndamento.current = null
    if (direcao) setSegunda((s) => somarDias(s, direcao * 7))
    setDeslizando(false)
    setDeslocamento(0)
  }

  function dia(data: string, indice: number) {
    const lista = humores[data] ?? []
    const ehHoje = data === hoje
    const [, , dd] = data.split('-')
    const nomeDosHumores = lista.map((h) => NOMES_DO_HUMOR[h]).join(', ')
    return (
      <button
        key={data}
        type="button"
        className={`faixa-da-semana__dia${ehHoje ? ' faixa-da-semana__dia--hoje' : ''}`}
        aria-label={`${ehHoje ? 'Hoje, ' : ''}${NOMES_DA_SEMANA[indice]}, ${Number(dd)}${nomeDosHumores ? `: ${nomeDosHumores}` : ''}`}
        aria-current={ehHoje ? 'date' : undefined}
        onClick={() => {
          if (!ignorarClique.current) aoAbrirDia(data)
        }}
      >
        <span className="faixa-da-semana__numero">{Number(dd)}</span>
        <span className="faixa-da-semana__pontinhos" aria-hidden="true">
          {lista.slice(0, MAXIMO_DE_PONTINHOS).map((humor, i) => (
            <span key={i} className={`faixa-da-semana__pontinho faixa-da-semana__pontinho--${humor}`} />
          ))}
          {lista.length > MAXIMO_DE_PONTINHOS && (
            <span className="faixa-da-semana__mais">
              <img src={iconeMais} alt="" width={6} height={6} />
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="faixa-da-semana">
      <div className="faixa-da-semana__letras" aria-hidden="true">
        {LETRAS_DA_SEMANA.map((letra, i) => (
          <span key={i}>{letra}</span>
        ))}
      </div>
      <div
        className="faixa-da-semana__janela"
        onPointerDown={comecarArraste}
        onPointerMove={moverArraste}
        onPointerUp={soltarArraste}
        onPointerCancel={soltarArraste}
      >
        <div
          className={`faixa-da-semana__trilho${deslizando ? ' faixa-da-semana__trilho--deslizando' : ''}`}
          style={{ transform: `translateX(${-LARGURA_DA_SEMANA + deslocamento}px)` }}
          onTransitionEnd={terminarDeslize}
        >
          {semanas.map((semana, i) => (
            <div key={semana[0]} className="faixa-da-semana__semana" inert={i !== 1}>
              {semana.map(dia)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
