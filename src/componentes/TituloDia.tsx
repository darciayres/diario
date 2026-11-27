// Componente "Título Dia" do Figma: dia da semana em cima (com "Ontem", "daqui a 3 dias" etc.,
// pela regra do PRODUTO.md), dia e mês embaixo.
import { tituloDoDia } from '../datas.ts'
import './TituloDia.css'

export function TituloDia({ data, hoje }: { data: string; hoje: string }) {
  const { diaDaSemana, diaEMes } = tituloDoDia(data, hoje)
  return (
    <h1 className="titulo-dia">
      <span className="titulo-dia__semana">{diaDaSemana}</span>
      <span className="titulo-dia__data">{diaEMes}</span>
    </h1>
  )
}
