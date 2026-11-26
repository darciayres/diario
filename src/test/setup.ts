// Adiciona verificações extras aos testes, como toBeInTheDocument().
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// O navegador simulado dos testes (jsdom) não mede tamanhos na tela, e o CodeMirror precisa disso.
// Estas versões de mentira devolvem tamanho zero, o que basta para os testes.
const retanguloVazio = () => new DOMRect(0, 0, 0, 0)
const listaVazia = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
Range.prototype.getBoundingClientRect = retanguloVazio
Range.prototype.getClientRects = listaVazia
