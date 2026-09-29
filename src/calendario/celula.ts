// Regras visuais da célula de calendário (prova de conceito).

/** Emojis provisórios. Os definitivos virão do Figma. */
export const EMOJI_HUMOR: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

/**
 * Fundo da célula, a partir dos humores do dia na ordem dos blocos.
 * Nenhum humor: neutro. Um humor: cor sólida. Dois ou mais: degradê em oklch,
 * que mistura as cores sem passar por tons acinzentados no meio.
 */
export function fundoDaCelula(humores: number[]): string {
  if (humores.length === 0) return 'var(--cell-empty)'
  if (humores.length === 1) return `var(--mood-${humores[0]})`
  const cores = humores.map((h) => `var(--mood-${h})`).join(', ')
  // Direção provisória. A decisão final (horizontal ou diagonal) fica para o desenvolvimento.
  return `linear-gradient(in oklch to right, ${cores})`
}
