// Componente "Título Dia" do Figma: dia da semana em cima, dia e mês embaixo.
import { tituloDoDia } from '../datas.ts'
import './TituloDia.css'

export function TituloDia({ data }: { data: string }) {
  const { diaDaSemana, diaEMes } = tituloDoDia(data)
  return (
    <h1 className="titulo-dia">
      <span className="titulo-dia__semana">{diaDaSemana}</span>
      <span className="titulo-dia__data">{diaEMes}</span>
    </h1>
  )
}
