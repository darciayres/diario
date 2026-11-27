// Tela Hoje (quadros "V2 TELA | Diário Leitor" e "V2 TELA | Diário Escritor" do Figma).
// Abre no modo ler. Tocar no texto ou no botão de escrever passa para o modo escrever;
// no celular, fechar o teclado volta para o modo ler.
//
// A tela funciona como um app, em camadas: a página fica parada e só a área do texto rola por
// dentro. O botão do topo e o aviso do pé ficam soltos por cima do texto e nunca se mexem.
// O teclado é mais uma camada por cima de tudo: ele cobre a parte de baixo da tela, sem
// encolher nada. Só a barra de comandos acompanha o teclado, logo acima dele.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AlternarModo, type Modo } from '../componentes/AlternarModo.tsx'
import { BarraDeComandos } from '../componentes/BarraDeComandos.tsx'
import { TituloDia } from '../componentes/TituloDia.tsx'
import { useAlturaSemTeclado, useEspacoDoTeclado } from '../componentes/useEspacoDoTeclado.ts'
import { dataDeHoje, horaAgora } from '../datas.ts'
import { escreverHumor, inserirHora } from '../editor/comandos.ts'
import { Editor, type ControleDoEditor, type FaixaVisivel } from '../editor/Editor.tsx'
import { MARGEM_DO_CURSOR_EM_CIMA, MARGEM_DO_CURSOR_EMBAIXO } from '../editor/margens.ts'
import { diagnostico, diagnosticoAppRolou } from '../diagnostico.ts'
import { useTextoDoDia } from '../editor/useTextoDoDia.ts'
import './Hoje.css'

// Abaixo disso (em pixels) o teclado conta como fechado; acima, como aberto.
// A folga evita confundir com a barra de endereço do navegador aparecendo e sumindo.
const TECLADO_FECHADO = 80
const TECLADO_ABERTO = 150
// Quanto tempo (em milissegundos) o teclado precisa ficar fechado para o dia voltar ao modo ler.
const ESPERA_TECLADO_FECHADO = 400

// Antes de o teclado subir pela primeira vez (sem saber a altura dele), o cursor fica nesta
// fração de cima da tela, que o teclado não cobre.
const PARTE_LIVRE_DO_TECLADO = 0.4

/** true em telas de toque (celular, tablet), onde o teclado aparece na tela. */
const ehTelaDeToque = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

/**
 * Faixa da área do texto onde o cursor fica à vista: abaixo do botão do topo e acima do teclado
 * (e da barra de comandos). Antes de o teclado subir, conta com o lugar onde ele vai abrir.
 */
function faixaVisivel(
  area: HTMLElement,
  espacoDoTeclado: number,
  tecladoJaAberto: boolean,
  alturaConhecidaDoTeclado: number,
): FaixaVisivel | undefined {
  const caixa = area.getBoundingClientRect()
  if (caixa.height === 0) return undefined
  const cima = caixa.top + MARGEM_DO_CURSOR_EM_CIMA
  if (tecladoJaAberto || !ehTelaDeToque()) {
    return { cima, baixo: caixa.bottom - espacoDoTeclado - MARGEM_DO_CURSOR_EMBAIXO }
  }
  if (alturaConhecidaDoTeclado) {
    return { cima, baixo: caixa.bottom - alturaConhecidaDoTeclado - MARGEM_DO_CURSOR_EMBAIXO }
  }
  return { cima, baixo: caixa.top + caixa.height * PARTE_LIVRE_DO_TECLADO }
}

/**
 * Rola a área do texto com a rolagem suave do próprio navegador: o celular a faz sem redesenhar
 * o texto a cada quadro (fica fluida), e um toque do dedo a interrompe naturalmente.
 */
function rolarSuave(area: HTMLElement, distancia: number) {
  const menosMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  if (typeof area.scrollBy === 'function') area.scrollBy({ top: distancia, behavior: menosMovimento ? 'auto' : 'smooth' })
  else area.scrollTop += distancia
}

export function Hoje() {
  // O dia é fixado ao abrir a tela: se passar da meia-noite com o app aberto,
  // o texto continua indo para o dia em que a pessoa começou a escrever.
  const [data] = useState(() => dataDeHoje())
  const { texto, fase, falhouSalvar, alterar } = useTextoDoDia(data)
  const [modo, setModo] = useState<Modo>('ler')
  const editor = useRef<ControleDoEditor>(null)

  const alturaSemTeclado = useAlturaSemTeclado()
  const espacoDoTeclado = useEspacoDoTeclado()
  const tecladoAberto = espacoDoTeclado > TECLADO_ABERTO

  // Se o teclado abriu no modo escrever e depois desceu, a barra de comandos some na hora,
  // sem esperar o modo ler (senão ela fica parada no meio da tela por um instante).
  const [tecladoAbriuNaEscrita, setTecladoAbriuNaEscrita] = useState(false)
  if (modo === 'escrever' && tecladoAberto && !tecladoAbriuNaEscrita) setTecladoAbriuNaEscrita(true)
  if (modo === 'ler' && tecladoAbriuNaEscrita) setTecladoAbriuNaEscrita(false)
  const tecladoDesceu = tecladoAbriuNaEscrita && espacoDoTeclado < TECLADO_FECHADO

  // O teclado desce porque o texto perdeu o foco (tocar fora, no ✓ do teclado ou no botão Ler).
  // O app sabe disso na hora, mas o navegador só avisa que o teclado desceu no fim da descida.
  // Então, assim que o texto perde o foco, a barra já começa a descer junto com o teclado e some
  // atrás dele, em vez de ficar parada e sumir de repente no fim.
  const [textoSemFoco, setTextoSemFoco] = useState(false)
  const barraSaindo = espacoDoTeclado > TECLADO_FECHADO && (modo === 'ler' || textoSemFoco)
  const mostrarBarra = (modo === 'escrever' && !tecladoDesceu) || barraSaindo

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

  // Diagnóstico temporário (só com ?diagnostico no endereço).
  useEffect(() => diagnostico('modo', modo), [modo])
  useEffect(() => diagnostico('teclado', `cobre ${espacoDoTeclado}px`, true), [espacoDoTeclado])

  // A altura do teclado, guardada da última vez que ele abriu: assim, ao entrar de novo no modo
  // escrever, o app já sabe onde ele vai cobrir a tela.
  const alturaConhecidaDoTeclado = useRef(0)
  useEffect(() => {
    if (tecladoAberto) alturaConhecidaDoTeclado.current = espacoDoTeclado
  }, [tecladoAberto, espacoDoTeclado])

  // No modo escrever, o cursor fica sempre à vista, acima do teclado. Pelo botão do topo, ele já
  // nasce dentro da faixa visível e nada rola; ao tocar numa linha que o teclado vai cobrir, ou
  // quando o teclado abre, o texto rola suavemente até o cursor.
  const rolagem = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const area = rolagem.current
    // Quando o teclado desce, o dia está voltando para o modo ler: nada rola.
    if (!area || modo !== 'escrever' || tecladoDesceu) return
    const cursor = editor.current?.posicaoDoCursor()
    const faixa = faixaVisivel(area, espacoDoTeclado, tecladoAbriuNaEscrita, alturaConhecidaDoTeclado.current)
    if (!cursor || !faixa) return
    let distancia = 0
    if (cursor.bottom > faixa.baixo) distancia = cursor.bottom - faixa.baixo
    else if (cursor.top < faixa.cima) distancia = cursor.top - faixa.cima
    if (Math.abs(distancia) >= 1) {
      diagnosticoAppRolou(distancia, distancia > 0 ? cursor.bottom : cursor.top, distancia > 0 ? faixa.baixo : faixa.cima)
      rolarSuave(area, distancia)
    }
  }, [espacoDoTeclado, modo, tecladoAbriuNaEscrita, tecladoDesceu])

  // O Safari às vezes ainda tenta deslizar a página parada para mostrar o cursor; aqui ela volta ao lugar.
  useEffect(() => {
    const vv = window.visualViewport
    const voltarAoLugar = () => {
      if (window.scrollY === 0) return
      diagnostico('APP DEVOLVE', `página estava empurrada ${Math.round(window.scrollY)}px`)
      window.scrollTo(0, 0)
    }
    vv?.addEventListener('scroll', voltarAoLugar)
    window.addEventListener('scroll', voltarAoLugar)
    return () => {
      vv?.removeEventListener('scroll', voltarAoLugar)
      window.removeEventListener('scroll', voltarAoLugar)
    }
  }, [])

  function escolherModo(novo: Modo) {
    if (novo !== 'escrever') {
      editor.current?.ler()
      return
    }
    // Pelo botão do topo, o cursor nasce dentro da parte visível acima do teclado: nada rola.
    const area = rolagem.current
    const faixa = area ? faixaVisivel(area, espacoDoTeclado, false, alturaConhecidaDoTeclado.current) : undefined
    diagnostico('lápis', faixa ? `cursor vai para a faixa ${Math.round(faixa.cima)} a ${Math.round(faixa.baixo)}` : '')
    editor.current?.escrever(faixa)
  }

  return (
    <main
      className={`hoje hoje--${modo}`}
      onFocus={(e) => e.target.classList.contains('cm-content') && setTextoSemFoco(false)}
      onBlur={(e) => e.target.classList.contains('cm-content') && setTextoSemFoco(true)}
      style={
        {
          '--altura-sem-teclado': alturaSemTeclado ? `${alturaSemTeclado}px` : undefined,
        } as CSSProperties
      }
    >
      <div className="hoje__rolagem" ref={rolagem}>
        <div className="hoje__coluna">
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

      {/* Preso no pé da tela, como o botão do topo. No modo escrever, o teclado cobre ele.
          Provisório até a tela Sobre (tarefa 7.2). */}
      <p className="hoje__privacidade">Seus textos ficam só neste aparelho, sem criptografia.</p>

      {/* Fica por cima da área que rola: o texto passa por baixo do botão. */}
      <header className="hoje__topo">
        {fase === 'pronto' && <AlternarModo modo={modo} aoEscolher={escolherModo} />}
      </header>

      {fase === 'pronto' && mostrarBarra && (
        <BarraDeComandos
          tecladoAberto={tecladoAberto}
          espacoDoTeclado={espacoDoTeclado}
          saindo={barraSaindo}
          aoInserirHora={() => editor.current?.editar((t, cursor) => inserirHora(t, cursor, horaAgora()))}
          aoEscolherHumor={(n) => editor.current?.editar((t, cursor) => escreverHumor(t, cursor, n, horaAgora()))}
          aoTocar={() => editor.current?.focar()}
        />
      )}
    </main>
  )
}
