import { useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { carregarDia, dataDeHoje, horaAgora, salvarDia } from './armazenamento/dia.ts'
import { CelulaCalendario } from './calendario/CelulaCalendario.tsx'
import { EMOJI_HUMOR } from './calendario/celula.ts'
import { aplicarHumor, inserirHoraAutomatica } from './editor/comandos.ts'
import { parse } from './parser/index.ts'

const EXEMPLO = `hora/14:32 fui almoçar
humor/4

hora/16:05
humor/3`

function App() {
  const [data] = useState(() => dataDeHoje())
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

  function aoDigitar(e: ChangeEvent<HTMLTextAreaElement>) {
    let novo = e.target.value
    let cursor = e.target.selectionStart
    const tipo = (e.nativeEvent as InputEvent).inputType
    // Só texto digitado dispara a hora automática. Texto colado não, porque a hora seria falsa.
    // "insertCompositionText" é o que os teclados de celular costumam enviar.
    if (tipo === 'insertText' || tipo === 'insertCompositionText') {
      const auto = inserirHoraAutomatica(novo, cursor, horaAgora())
      if (auto) {
        novo = auto.texto
        cursor = auto.cursor
        atualizar(novo, cursor)
        return
      }
    }
    atualizar(novo, null)
  }

  function aoClicarHumor(n: number) {
    const area = areaRef.current
    const cursor = area ? area.selectionStart : texto.length
    const r = aplicarHumor(texto, cursor, n)
    atualizar(r.texto, r.cursor)
    area?.focus()
  }

  const { blocos, avisos } = parse(texto)
  const humoresDeHoje = blocos.filter((b) => b.humor !== null).map((b) => b.humor as number)

  return (
    <main className="poc">
      <h1>Diário: prova de conceito</h1>
      <p className="nota">
        Página descartável para testar as ideias. Hoje é {data}. O texto fica só neste aparelho e não é criptografado.
      </p>

      <section aria-labelledby="titulo-editor">
        <h2 id="titulo-editor">1. Texto do dia</h2>
        <textarea
          ref={areaRef}
          value={texto}
          onChange={aoDigitar}
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
        <p className="nota">A primeira é o seu dia de hoje, ao vivo. As outras são exemplos fixos.</p>
        <div className="celulas">
          <figure>
            <CelulaCalendario dia={Number(data.slice(8))} humores={humoresDeHoje} />
            <figcaption>Hoje</figcaption>
          </figure>
          <figure>
            <CelulaCalendario dia={1} humores={[]} />
            <figcaption>Sem humor</figcaption>
          </figure>
          <figure>
            <CelulaCalendario dia={2} humores={[4]} />
            <figcaption>Um humor</figcaption>
          </figure>
          <figure>
            <CelulaCalendario dia={3} humores={[2, 5]} />
            <figcaption>Dois humores</figcaption>
          </figure>
          <figure>
            <CelulaCalendario dia={4} humores={[1, 3, 5]} />
            <figcaption>Três humores</figcaption>
          </figure>
        </div>
      </section>
    </main>
  )
}

export default App
