// O app: a tela do dia aberto e, por cima, a barra lateral, que troca de dia.
import { useState } from 'react'
import { BarraLateral } from './componentes/BarraLateral.tsx'
import { dataDeHoje } from './datas.ts'
import { useDiaAberto } from './navegacao.ts'
import { Dia } from './telas/Dia.tsx'

function App() {
  // Hoje é fixado ao abrir o app: se passar da meia-noite com o app aberto,
  // o texto continua indo para o dia em que a pessoa começou a escrever.
  const [hoje] = useState(() => dataDeHoje())
  const { dia, irParaHora, abrirDia } = useDiaAberto(hoje)
  const [barraLateralAberta, setBarraLateralAberta] = useState(false)

  return (
    <>
      {/* Uma tela nova para cada dia (a de antes salva o texto ao sair). */}
      <Dia key={dia} data={dia} hoje={hoje} irParaHora={irParaHora} />
      <BarraLateral
        aberta={barraLateralAberta}
        aoAbrir={() => setBarraLateralAberta(true)}
        aoFechar={() => setBarraLateralAberta(false)}
        hoje={hoje}
        diaAberto={dia}
        aoAbrirDia={(data, hora) => {
          setBarraLateralAberta(false)
          abrirDia(data, hora)
        }}
      />
    </>
  )
}

export default App
