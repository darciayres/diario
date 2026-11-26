// Campo onde a pessoa escreve o dia. Cresce junto com o texto, sem barra de rolagem própria.
import { useLayoutEffect, useRef } from 'react'
import './Editor.css'

type Props = {
  texto: string
  aoMudar: (texto: string) => void
}

export function Editor({ texto, aoMudar }: Props) {
  const campo = useRef<HTMLTextAreaElement>(null)

  // Ajusta a altura ao texto a cada mudança.
  useLayoutEffect(() => {
    const el = campo.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [texto])

  return (
    <textarea
      ref={campo}
      className="editor"
      value={texto}
      onChange={(e) => aoMudar(e.target.value)}
      aria-label="Texto do dia"
      // Ao abrir o app, o cursor já está no dia de hoje.
      autoFocus
      spellCheck
    />
  )
}
