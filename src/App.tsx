import { useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, SyntheticEvent } from 'react'
import { carregarDia, dataCurta, dataDeHoje, dataPorExtenso, horaAgora, salvarDia, somarDias } from './armazenamento/dia.ts'
import { CelulaCalendario } from './calendario/CelulaCalendario.tsx'
import { EMOJI_HUMOR } from './calendario/celula.ts'
import { aplicarHumor, inserirHoraAutomatica, preencherHoraVazia } from './editor/comandos.ts'
import { parse } from './parser/index.ts'

const EXEMPLO = `hora/14:32 fui almoçar
humor/4

hora/16:05
humor/3`

/** Humores do dia (1 a 5), na ordem dos blocos. */
function humoresDoTexto(texto: string): number[] {
  return parse(texto)
    .blocos.filter((b) => b.humor !== null)
    .map((b) => b.humor as number)
}

function App() {
  const [hoje] = useState(() => dataDeHoje())
  const [data, setData] = useState(hoje)
  // O texto é lido antes da primeira tela, para nunca gravar um dia vazio por cima de um dia salvo.
  const [texto, setTexto] = useState(() => carregarDia(data))
  const [salvoOk, setSalvoOk] = useState(true)

  const areaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPendente = useRef<number | null>(null)

  // Depois de o app alterar o texto, devolve o cursor ao lugar certo.
  useLayoutEffect(() => {
    if (cursorPendente.current !== null && areaRef.current) {
      areaRef.current.setSelectionRange(cursorPendente.current, cursorPendente.current)
      cursorPendente.current = null
    }
  }, [texto])

  function atualizar(novoTexto: string, cursor: number | null) {
    cursorPendente.current = cursor
    setTexto(novoTexto)
    setSalvoOk(salvarDia(data, novoTexto))
  }

  // Trocar de dia só LÊ o texto do novo dia. Nada é gravado aqui: a gravação
  // acontece só quando a pessoa altera o texto (em `atualizar`).
  function irParaDia(novaData: string) {
    if (novaData === data) return
    cursorPendente.current = null
    setData(novaData)
    setTexto(carregarDia(novaData))
    setSalvoOk(true)
  }

  function aoDigitar(e: ChangeEvent<HTMLTextAreaElement>) {
    let novo = e.target.value
    let cursor = e.target.selectionStart
    let alterado = false
    const tipo = (e.nativeEvent as InputEvent).inputType
    // Só texto digitado dispara a hora automática. Texto colado não, porque a hora seria falsa.
    // "insertCompositionText" é o que os teclados de celular costumam enviar.
    if (tipo === 'insertText' || tipo === 'insertCompositionText') {
      const auto = inserirHoraAutomatica(novo, cursor, horaAgora())
      if (auto) {
        novo = auto.texto
        cursor = auto.cursor
        alterado = true
      }
    }
    // Um hora/ vazio que ficou para trás (ex.: ao apertar Enter) vira a hora atual.
    const preenchido = preencherHoraVazia(novo, cursor, horaAgora())
    if (preenchido) {
      novo = preenchido.texto
      cursor = preenchido.cursor
      alterado = true
    }
    atualizar(novo, alterado ? cursor : null)
  }

  // Cursor saiu da linha (clique ou setas): completa o hora/ vazio que ficou para trás.
  function aoMoverCursor(e: SyntheticEvent<HTMLTextAreaElement>) {
    const area = e.currentTarget
    const r = preencherHoraVazia(area.value, area.selectionStart, horaAgora())
    if (r) atualizar(r.texto, r.cursor)
  }

  // Saiu do campo de texto: completa qualquer hora/ vazio, inclusive o da linha do cursor.
  function aoSairDoCampo(e: FocusEvent<HTMLTextAreaElement>) {
    const area = e.currentTarget
    const r = preencherHoraVazia(area.value, area.selectionStart, horaAgora(), true)
    if (r) atualizar(r.texto, null)
  }

  function aoClicarHumor(n: number) {
    const area = areaRef.current
    const cursor = area ? area.selectionStart : texto.length
    const r = aplicarHumor(texto, cursor, n)
    atualizar(r.texto, r.cursor)
    area?.focus()
  }

  const { blocos, avisos } = parse(texto)

  // Calendário: o dia aberto, 2 dias antes e 2 depois. O dia aberto usa o texto ao vivo;
  // os vizinhos são lidos do que está salvo no aparelho.
  const diasDoCalendario = [-2, -1, 0, 1, 2].map((deslocamento) => {
    const dia = somarDias(data, deslocamento)
    const humores = humoresDoTexto(deslocamento === 0 ? texto : carregarDia(dia))
    return { dia, humores, atual: deslocamento === 0 }
  })

  return (
    <main className="poc">
      <h1>Diário: prova de conceito</h1>
      <p className="nota">
        Página descartável para testar as ideias. O texto fica só neste aparelho e não é criptografado.
      </p>

      <nav className="navegacao-dias" aria-label="Navegar entre os dias">
        <button type="button" onClick={() => irParaDia(somarDias(data, -1))}>
          ‹ Anterior
        </button>
        <input
          type="date"
          value={data}
          aria-label="Ir para o dia"
          onChange={(e) => e.target.value && irParaDia(e.target.value)}
        />
        <button type="button" onClick={() => irParaDia(somarDias(data, 1))}>
          Seguinte ›
        </button>
        <button type="button" onClick={() => irParaDia(hoje)} disabled={data === hoje}>
          Hoje
        </button>
      </nav>

      <section aria-labelledby="titulo-editor">
        <h2 id="titulo-editor">1. Texto do dia: {dataPorExtenso(data)}</h2>
        <textarea
          ref={areaRef}
          value={texto}
          onChange={aoDigitar}
          onSelect={aoMoverCursor}
          onBlur={aoSairDoCampo}
          aria-label="Texto do dia"
          placeholder={`Escreva seu dia. Exemplo:\n\n${EXEMPLO}`}
        />
        <div className="humores" role="group" aria-label="Humor do bloco onde está o cursor">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="botao-humor"
              style={{ background: `var(--mood-${n})` }}
              aria-label={`Humor ${n}`}
              // Evita tirar o foco do texto (no celular, fecharia o teclado).
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => aoClicarHumor(n)}
            >
              <span aria-hidden="true">{EMOJI_HUMOR[n]}</span> {n}
            </button>
          ))}
        </div>
        <p className="nota" role="status">
          {salvoOk ? 'Salvo neste aparelho.' : 'Não foi possível salvar neste aparelho!'}
        </p>
      </section>

      <section aria-labelledby="titulo-leitura">
        <h2 id="titulo-leitura">2. Como o app entendeu o texto</h2>
        <ol className="blocos">
          {blocos.map((b, i) => (
            <li key={i}>
              {b.hora ? `Bloco das ${b.hora}` : i === 0 ? 'Início do dia (sem horário)' : 'Bloco sem horário'}
              {' · '}
              {b.humor ? `${EMOJI_HUMOR[b.humor]} humor ${b.humor}` : 'sem humor'}
            </li>
          ))}
        </ol>
        {avisos.length > 0 && (
          <ul className="avisos">
            {avisos.map((a, i) => (
              <li key={i}>
                Linha {a.linha + 1}: {a.mensagem}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-calendario">
        <h2 id="titulo-calendario">3. Células de calendário</h2>
        <p className="nota">O dia que você está vendo (com contorno), com os 2 dias antes e os 2 depois.</p>
        <div className="celulas">
          {diasDoCalendario.map(({ dia, humores, atual }) => (
            <figure key={dia}>
              <CelulaCalendario dia={Number(dia.slice(8))} humores={humores} atual={atual} />
              <figcaption>{dia === hoje ? 'Hoje' : dataCurta(dia)}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
