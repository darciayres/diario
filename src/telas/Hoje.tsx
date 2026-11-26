// Tela Hoje, no modo escrita (quadro "V2 TELA | Diário Escritor" do Figma).
import { useRef, useState } from 'react'
import { BarraDeComandos } from '../componentes/BarraDeComandos.tsx'
import { TituloDia } from '../componentes/TituloDia.tsx'
import { dataDeHoje, horaAgora } from '../datas.ts'
import { escreverHumor, inserirHora } from '../editor/comandos.ts'
import { Editor, type ControleDoEditor } from '../editor/Editor.tsx'
import { useTextoDoDia } from '../editor/useTextoDoDia.ts'
import './Hoje.css'

export function Hoje() {
  // O dia é fixado ao abrir a tela: se passar da meia-noite com o app aberto,
  // o texto continua indo para o dia em que a pessoa começou a escrever.
  const [data] = useState(() => dataDeHoje())
  const { texto, fase, falhouSalvar, alterar } = useTextoDoDia(data)
  const editor = useRef<ControleDoEditor>(null)

  return (
    <main className="hoje">
      <TituloDia data={data} />

      {fase === 'pronto' && (
        <>
          <Editor ref={editor} texto={texto} aoMudar={alterar} />
          <BarraDeComandos
            aoInserirHora={() => editor.current?.editar((t, cursor) => inserirHora(t, cursor, horaAgora()))}
            aoEscolherHumor={(n) => editor.current?.editar((t, cursor) => escreverHumor(t, cursor, n, horaAgora()))}
          />
        </>
      )}

      {fase === 'erro-leitura' && (
        <p className="hoje__aviso" role="alert">
          Não foi possível abrir o texto de hoje. Para não apagar nada, a escrita fica bloqueada. Tente recarregar a
          página.
        </p>
      )}

      {falhouSalvar && (
        <p className="hoje__aviso" role="alert">
          Não foi possível salvar. O texto continua aqui na tela; o app tenta de novo na próxima alteração.
        </p>
      )}

      {/* Provisório até a tela Sobre (tarefa 7.2). */}
      <p className="hoje__privacidade">Seus textos ficam só neste aparelho, sem criptografia.</p>
    </main>
  )
}
