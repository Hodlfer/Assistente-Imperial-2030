// `navigator.storage.persist()` (docs/ARQUITETURA.md §Persistência; enunciado
// da Sessão 5, item 3): pede ao navegador para nunca despejar os dados do
// site sob pressão de espaço. Chamado uma vez, na primeira gravação.

export interface ResultadoPersistencia {
  suportado: boolean
  persistido: boolean
}

let jaSolicitado = false

/** Solicita persistência de armazenamento e retorna o resultado de
 *  `navigator.storage.persisted()`. Idempotente: só chama `persist()` uma vez
 *  por sessão da página. */
export async function solicitarPersistencia(): Promise<ResultadoPersistencia> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return { suportado: false, persistido: false }
  }
  if (!jaSolicitado) {
    jaSolicitado = true
    try {
      await navigator.storage.persist()
    } catch {
      // Segue para checar o estado real via persisted() abaixo.
    }
  }
  try {
    const persistido = (await navigator.storage.persisted?.()) ?? false
    return { suportado: true, persistido }
  } catch {
    return { suportado: true, persistido: false }
  }
}
