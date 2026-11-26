// Propriedades para botões que ficam ao lado do texto (barra de comandos, botão de escrever).
// Tocar neles não pode tirar o foco do editor: no celular, isso fecharia o teclado.
// O navegador muda o foco no "mousedown" (no iPhone, ele vem logo depois do toque);
// cancelar esse evento, e também o "pointerdown", mantém o cursor onde estava.
import type { SyntheticEvent } from 'react'

const cancelar = (e: SyntheticEvent) => e.preventDefault()

export const naoTirarFoco = { onPointerDown: cancelar, onMouseDown: cancelar }
