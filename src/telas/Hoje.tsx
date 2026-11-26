// Tela Hoje (quadros "V2 TELA | Diário Leitor" e "V2 TELA | Diário Escritor" do Figma).
// Abre no modo ler. Tocar no texto ou no botão de escrever passa para o modo escrever;
// no celular, fechar o teclado volta para o modo ler.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AlternarModo, type Modo } from '../componentes/AlternarModo.tsx'
import { BarraDeComandos } from '../componentes/BarraDeComandos.tsx'
import { TituloDia } from '../componentes/TituloDia.tsx'
import { useDeslocamentoDaTela, useEspacoDoTeclado } from '../componentes/useEspacoDoTeclado.ts'
import { dataDeHoje, horaAgora } from '../datas.ts'
import { escreverHumor, inserirHora } from '../editor/comandos.ts'
import { Editor, type ControleDoEditor } from '../editor/Editor.tsx'
import { useTextoDoDia } from '../editor/useTextoDoDia.ts'
import './Hoje.css'

// Abaixo disso (em pixels) o teclado conta como fechado; acima, como aberto.
// A folga evita confundir com a barra de endereço do navegador aparecendo e sumindo.
const TECLADO_FECHADO = 80
const TECLADO_ABERTO = 150
// Quanto tempo (em milissegundos) o teclado precisa ficar fechado para o dia voltar ao modo ler.
const ESPERA_TECLADO_FECHADO = 400

export function Hoje() {
  // O dia é fixado ao abrir a tela: se passar da meia-noite com o app aberto,
  // o texto continua indo para o dia em que a pessoa começou a escrever.
  const [data] = useState(() => dataDeHoje())
  const { texto, fase, falhouSalvar, alterar } = useTextoDoDia(data)
  const [modo, setModo] = useState<Modo>('ler')
  const editor = useRef<ControleDoEditor>(null)

  // No celular, quando o teclado desce, o dia volta para o modo ler.
  const espacoDoTeclado = useEspacoDoTeclado()
  const deslocamentoDaTela = useDeslocamentoDaTela()
  const tecladoEstavaAberto = useRef(false)
  useEffect(() => {
    if (espacoDoTeclado > TECLADO_ABERTO) {
      tecladoEstavaAberto.current = true
      return
    }
    if (espacoDoTeclado >= TECLADO_FECHADO || !tecladoEstavaAberto.current) return
    // Espera um pouco antes de trocar: se o teclado só piscou (ex.: um toque num botão), ele volta
    // antes disso, e este efeito é cancelado sem mudar de modo.
    const espera = window.setTimeout(() => {
      tecladoEstavaAberto.current = false
      editor.current?.ler()
    }, ESPERA_TECLADO_FECHADO)
    return () => window.clearTimeout(espera)
  }, [espacoDoTeclado])

  function escolherModo(novo: Modo) {
    if (novo === 'escrever') editor.current?.escrever()
    else editor.current?.ler()
  }

  return (
    <main className={`hoje hoje--${modo}`}>
      <header
        className="hoje__topo"
        style={{ '--deslocamento-da-tela': `${deslocamentoDaTela}px` } as CSSProperties}
      >
        {fase === 'pronto' && <AlternarModo modo={modo} aoEscolher={escolherModo} />}
      </header>

      <TituloDia data={data} />

      {fase === 'pronto' && (
        <>
          <Editor ref={editor} texto={texto} aoMudar={alterar} modo={modo} aoMudarModo={setModo} />
          {modo === 'escrever' && (
            <BarraDeComandos
              aoInserirHora={() => editor.current?.editar((t, cursor) => inserirHora(t, cursor, horaAgora()))}
              aoEscolherHumor={(n) => editor.current?.editar((t, cursor) => escreverHumor(t, cursor, n, horaAgora()))}
              aoTocar={() => editor.current?.focar()}
            />
          )}
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
