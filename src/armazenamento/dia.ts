// Guarda e lê o texto de cada dia no IndexedDB do navegador, só neste aparelho.
// Um registro por dia: { data: "AAAA-MM-DD", texto: string }.

import { openDB, type DBSchema } from 'idb'

export type RegistroDia = { data: string; texto: string }

interface BancoDiario extends DBSchema {
  dias: { key: string; value: RegistroDia }
}

const NOME_DO_BANCO = 'diario'
const VERSAO_DO_BANCO = 1
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/

/** Abre o banco do diário, criando a "gaveta" de dias na primeira vez. */
export function abrirBanco() {
  return openDB<BancoDiario>(NOME_DO_BANCO, VERSAO_DO_BANCO, {
    upgrade(banco) {
      banco.createObjectStore('dias', { keyPath: 'data' })
    },
  })
}

/**
 * Lê o texto salvo do dia. Dia sem registro devolve texto vazio.
 * Se o navegador não deixar ler, dá erro (em vez de devolver vazio),
 * para a tela não mostrar um dia em branco e acabar salvando por cima do texto de verdade.
 */
export async function carregarDia(data: string): Promise<string> {
  const banco = await abrirBanco()
  try {
    const registro = await banco.get('dias', data)
    return registro?.texto ?? ''
  } finally {
    banco.close()
  }
}

/**
 * Lê de uma vez o texto de vários dias (ex.: para a lista de dias da barra lateral).
 * Dias sem registro ficam de fora. Se o navegador não deixar ler, dá erro.
 */
export async function carregarDias(datas: readonly string[]): Promise<Record<string, string>> {
  const banco = await abrirBanco()
  try {
    const tx = banco.transaction('dias', 'readonly')
    const registros = await Promise.all(datas.map((data) => tx.store.get(data)))
    await tx.done
    const textos: Record<string, string> = {}
    for (const registro of registros) if (registro) textos[registro.data] = registro.texto
    return textos
  } finally {
    banco.close()
  }
}

/** Salva o texto do dia. Devolve false se o navegador recusar (armazenamento cheio, bloqueado etc.). */
export async function salvarDia(data: string, texto: string): Promise<boolean> {
  // Uma data mal formada criaria um "dia" fantasma; melhor recusar.
  if (!FORMATO_DATA.test(data)) return false
  try {
    const banco = await abrirBanco()
    try {
      await banco.put('dias', { data, texto })
      return true
    } finally {
      banco.close()
    }
  } catch {
    return false
  }
}

/**
 * Pede ao navegador para não apagar os dados sozinho quando o aparelho ficar sem espaço.
 * Devolve true se o pedido foi aceito. Alguns navegadores só aceitam depois que o app é instalado.
 */
export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
