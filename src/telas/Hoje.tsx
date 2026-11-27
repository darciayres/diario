// Tela Hoje (quadros "V2 TELA | Diário Leitor" e "V2 TELA | Diário Escritor" do Figma).
// Abre no modo ler. Tocar no texto ou no botão de escrever passa para o modo escrever;
// no celular, fechar o teclado volta para o modo ler.
//
// A tela funciona como um app: a página fica parada e só a área do texto rola por dentro.
// A altura da tela acompanha a parte visível (que encolhe quando o teclado abre), então o
// botão do topo e a barra de comandos ficam presos no lugar pelo próprio navegador.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AlternarModo, type Modo } from '../componentes/AlternarModo.tsx'
import { BarraDeComandos } from '../componentes/BarraDeComandos.tsx'
import { TituloDia } from '../componentes/TituloDia.tsx'
import { useAlturaSemTeclado, useAlturaVisivel, useEspacoDoTeclado } from '../componentes/useEspacoDoTeclado.ts'
import { dataDeHoje, horaAgora } from '../datas.ts'
import { escreverHumor, inserirHora } from '../editor/comandos.ts'
import { Editor, type ControleDoEditor } from '../editor/Editor.tsx'
import { MARGEM_DO_CURSOR_EM_CIMA, MARGEM_DO_CURSOR_EMBAIXO } from '../editor/margens.ts'
import { useTextoDoDia } from '../editor/useTextoDoDia.ts'
import './Hoje.css'

// Abaixo disso (em pixels) o teclado conta como fechado; acima, como aberto.
// A folga evita confundir com a barra de endereço do navegador aparecendo e sumindo.
const TECLADO_FECHADO = 80
const TECLADO_ABERTO = 150
// Quanto tempo (em milissegundos) o teclado precisa ficar fechado para o dia voltar ao modo ler.
const ESPERA_TECLADO_FECHADO = 400

// Antes de o teclado subir, o cursor fica nesta fração de cima da tela (o teclado cobre o resto).
const PARTE_LIVRE_DO_TECLADO = 0.4
// Duração do deslizar do texto, igual às animações do Figma (0,3 s).
const DURACAO_DESLIZAR = 300

/** true em telas de toque (celular, tablet), onde o teclado aparece na tela. */
const ehTelaDeToque = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

// O deslizar mexe na posição (top) e não em "transform": no iPhone, uma animação de transform
// leva um ou dois quadros para começar, e nesse intervalo o texto aparecia já no lugar final (um "pisca").

/** Para o deslizar em andamento e devolve quanto o texto estava deslocado naquele instante. */
function pararDeslizar(elemento: HTMLElement): number {
  const animacoes = elemento.getAnimations?.() ?? []
  if (animacoes.length === 0) return 0
  const deslocamento = parseFloat(getComputedStyle(elemento).top) || 0
  animacoes.forEach((animacao) => animacao.cancel())
  return deslocamento
}

/** Faz o texto sair de `distancia` pixels abaixo (ou acima) e deslizar até o lugar certo. */
function deslizar(elemento: HTMLElement, distancia: number) {
  if (Math.abs(distancia) < 1 || typeof elemento.animate !== 'function') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  elemento.animate([{ top: `${distancia}px` }, { top: '0px' }], {
    duration: DURACAO_DESLIZAR,
    easing: 'ease-out',
  })
}

export function Hoje() {
  // O dia é fixado ao abrir a tela: se passar da meia-noite com o app aberto,
  // o texto continua indo para o dia em que a pessoa começou a escrever.
  const [data] = useState(() => dataDeHoje())
  const { texto, fase, falhouSalvar, alterar } = useTextoDoDia(data)
  const [modo, setModo] = useState<Modo>('ler')
  const editor = useRef<ControleDoEditor>(null)

  const alturaVisivel = useAlturaVisivel()
  const alturaSemTeclado = useAlturaSemTeclado()
  const espacoDoTeclado = useEspacoDoTeclado()
  const tecladoAberto = espacoDoTeclado > TECLADO_ABERTO

  // Se o teclado abriu no modo escrever e depois desceu, a barra de comandos some na hora,
  // sem esperar o modo ler (senão ela fica parada no meio da tela por um instante).
  const [tecladoAbriuNaEscrita, setTecladoAbriuNaEscrita] = useState(false)
  if (modo === 'escrever' && tecladoAberto && !tecladoAbriuNaEscrita) setTecladoAbriuNaEscrita(true)
  if (modo === 'ler' && tecladoAbriuNaEscrita) setTecladoAbriuNaEscrita(false)
  const mostrarBarra = modo === 'escrever' && !(tecladoAbriuNaEscrita && espacoDoTeclado < TECLADO_FECHADO)

  // No celular, quando o teclado desce, o dia volta para o modo ler.
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

  // Quando a tela muda de tamanho (o teclado abriu ou fechou) ou de modo, o texto muda de lugar:
  // no modo escrever, rola até o cursor ficar à vista; ao crescer, a rolagem pode voltar para cima.
  // Em vez de pular de uma vez, o texto desliza da posição antiga até a nova.
  const rolagem = useRef<HTMLDivElement>(null)
  const coluna = useRef<HTMLDivElement>(null)
  const rolagemAnterior = useRef(0)
  useEffect(() => {
    const area = rolagem.current
    if (!area) return
    const anotar = () => {
      rolagemAnterior.current = area.scrollTop
    }
    area.addEventListener('scroll', anotar, { passive: true })
    return () => area.removeEventListener('scroll', anotar)
  }, [])

  useLayoutEffect(() => {
    const area = rolagem.current
    const conteudo = coluna.current
    if (!area || !conteudo) return
    const antes = rolagemAnterior.current
    const deslocamento = pararDeslizar(conteudo)

    if (modo === 'escrever') {
      const cursor = editor.current?.posicaoDoCursor()
      if (cursor) {
        const caixa = area.getBoundingClientRect()
        // Com o teclado ainda fechado, o cursor fica na parte de cima, onde o teclado não vai cobrir;
        // assim o Safari não precisa empurrar a página quando o teclado subir.
        const limiteDeBaixo =
          ehTelaDeToque() && !tecladoAberto
            ? caixa.top + caixa.height * PARTE_LIVRE_DO_TECLADO
            : caixa.bottom - MARGEM_DO_CURSOR_EMBAIXO
        const limiteDeCima = caixa.top + MARGEM_DO_CURSOR_EM_CIMA
        if (cursor.bottom > limiteDeBaixo) area.scrollTop += cursor.bottom - limiteDeBaixo
        else if (cursor.top < limiteDeCima) area.scrollTop -= limiteDeCima - cursor.top
      }
    }

    const depois = area.scrollTop
    rolagemAnterior.current = depois
    deslizar(conteudo, depois - antes + deslocamento)
  }, [alturaVisivel, modo, tecladoAberto])

  // O Safari às vezes ainda tenta deslizar a página parada para mostrar o cursor; aqui ela volta ao lugar.
  useEffect(() => {
    const vv = window.visualViewport
    const voltarAoLugar = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    vv?.addEventListener('scroll', voltarAoLugar)
    window.addEventListener('scroll', voltarAoLugar)
    return () => {
      vv?.removeEventListener('scroll', voltarAoLugar)
      window.removeEventListener('scroll', voltarAoLugar)
    }
  }, [])

  function escolherModo(novo: Modo) {
    if (novo === 'escrever') editor.current?.escrever()
    else editor.current?.ler()
  }

  return (
    <main
      className={`hoje hoje--${modo}`}
      style={
        {
          '--altura-visivel': alturaVisivel ? `${alturaVisivel}px` : undefined,
          '--altura-sem-teclado': alturaSemTeclado ? `${alturaSemTeclado}px` : undefined,
        } as CSSProperties
      }
    >
      <div className="hoje__rolagem" ref={rolagem}>
        <div className="hoje__coluna" ref={coluna}>
          <TituloDia data={data} />

          {fase === 'pronto' && (
            <Editor ref={editor} texto={texto} aoMudar={alterar} modo={modo} aoMudarModo={setModo} />
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
        </div>
      </div>

      {/* Preso no pé da tela, como o botão do topo. No modo escrever, o teclado abre por cima dele.
          Provisório até a tela Sobre (tarefa 7.2). */}
      <p className="hoje__privacidade">Seus textos ficam só neste aparelho, sem criptografia.</p>

      {/* Fica por cima da área que rola: o texto passa por baixo do botão. */}
      <header className="hoje__topo">
        {fase === 'pronto' && <AlternarModo modo={modo} aoEscolher={escolherModo} />}
      </header>

      {fase === 'pronto' && mostrarBarra && (
        <BarraDeComandos
          tecladoAberto={tecladoAberto}
          aoInserirHora={() => editor.current?.editar((t, cursor) => inserirHora(t, cursor, horaAgora()))}
          aoEscolherHumor={(n) => editor.current?.editar((t, cursor) => escreverHumor(t, cursor, n, horaAgora()))}
          aoTocar={() => editor.current?.focar()}
        />
      )}
    </main>
  )
}
