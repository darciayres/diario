// Lista de dias da barra lateral (Figma: "Lista de dias (Sidebar)" e "Module - Dias de Lista").
// Hoje no topo, em verde, separado por uma linha; depois os dias anteriores, do mais novo para o
// mais antigo. No MVP, os últimos 30 dias (a regra geral vai até o primeiro dia escrito).
//
// Tocar no nome do dia abre o dia. Tocar na setinha mostra embaixo os horários dos momentos do
// dia (animação do Figma: Smart Animate, 0,18 s, ease-out para abrir e ease-in para fechar);
// tocar num horário abre o dia já naquele momento. Dia sem horário marcado não tem setinha.
import { useEffect, useState } from 'react'
import iconeSetaHoje from '../assets/icones/arrow_forward_ios_primaria.svg'
import iconeSeta from '../assets/icones/arrow_forward_ios.svg'
import { carregarDias } from '../armazenamento/dia.ts'
import { rotuloNaListaDeDias, somarDias } from '../datas.ts'
import { parse } from '../parser/index.ts'
import './ListaDeDias.css'

/** Quantos dias a lista mostra no MVP, contando hoje. */
export const DIAS_NA_LISTA = 30

type Props = {
  hoje: string
  /** true enquanto a barra lateral está aberta: a lista lê os textos de novo a cada abertura. */
  visivel: boolean
  aoAbrirDia: (data: string, hora?: string) => void
}

/** Os horários dos momentos do dia, na ordem do texto (ex.: ["09:00", "14:30"]). */
function horariosDoTexto(texto: string): string[] {
  return parse(texto).blocos.flatMap((bloco) => (bloco.hora ? [bloco.hora] : []))
}

export function ListaDeDias({ hoje, visivel, aoAbrirDia }: Props) {
  const datas = Array.from({ length: DIAS_NA_LISTA }, (_, i) => somarDias(hoje, -i))
  const [horarios, setHorarios] = useState<Record<string, string[]>>({})
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(new Set())

  // Lê os textos de novo sempre que a barra abre, para mostrar os horários mais recentes.
  useEffect(() => {
    if (!visivel) return
    let ativo = true
    carregarDias(Array.from({ length: DIAS_NA_LISTA }, (_, i) => somarDias(hoje, -i)))
      .then((textos) => {
        if (!ativo) return
        const porDia: Record<string, string[]> = {}
        for (const [data, texto] of Object.entries(textos)) porDia[data] = horariosDoTexto(texto)
        setHorarios(porDia)
      })
      .catch(() => {
        // Sem conseguir ler, a lista continua funcionando, só sem os horários.
      })
    return () => {
      ativo = false
    }
  }, [visivel, hoje])

  function alternar(data: string) {
    setAbertos((atuais) => {
      const novos = new Set(atuais)
      if (novos.has(data)) novos.delete(data)
      else novos.add(data)
      return novos
    })
  }

  function item(data: string) {
    const rotulo = rotuloNaListaDeDias(data, hoje)
    const ehHoje = data === hoje
    const horas = horarios[data] ?? []
    const temHoras = horas.length > 0
    const aberto = temHoras && abertos.has(data)
    return (
      <li key={data} className={`lista-de-dias__dia${ehHoje ? ' lista-de-dias__dia--hoje' : ''}${aberto ? ' lista-de-dias__dia--aberto' : ''}`}>
        <div className="lista-de-dias__linha">
          {/* Sem horários marcados, não há o que mostrar: no lugar da setinha, só o espaço dela. */}
          {temHoras ? (
            <button
              type="button"
              className="lista-de-dias__seta"
              aria-label={`Horários de ${rotulo}`}
              aria-expanded={aberto}
              onClick={() => alternar(data)}
            >
              <img src={ehHoje ? iconeSetaHoje : iconeSeta} alt="" width={16} height={16} />
            </button>
          ) : (
            <span className="lista-de-dias__seta" aria-hidden="true" />
          )}
          <button type="button" className="lista-de-dias__nome" onClick={() => aoAbrirDia(data)}>
            {rotulo}
          </button>
        </div>
        <div className="lista-de-dias__horarios" inert={!aberto}>
          <ul>
            {horas.map((hora, i) => (
              <li key={`${hora}-${i}`}>
                <button type="button" className="lista-de-dias__horario" onClick={() => aoAbrirDia(data, hora)}>
                  <img src={iconeSeta} alt="" width={14} height={14} />
                  {hora}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </li>
    )
  }

  return (
    <div className="lista-de-dias">
      <ul className="lista-de-dias__hoje">{item(datas[0])}</ul>
      <hr className="lista-de-dias__divisoria" />
      <ul className="lista-de-dias__anteriores">{datas.slice(1).map(item)}</ul>
    </div>
  )
}
