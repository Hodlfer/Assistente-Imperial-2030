// Autosave + carregamento do save salvo (enunciado da Sessão 5, itens 3 e 6).
// Envolve `useGame`: observa `jogo.estado` e grava no IndexedDB (+ espelho em
// localStorage) a cada transação, sem bloquear a UI (efeito assíncrono).

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseGameResult } from './useGame'
import {
  carregarPartidaIndexedDB,
  limparPartidaIndexedDB,
  salvarPartidaIndexedDB,
} from '../persistence/db'
import { carregarEspelho, limparEspelho, salvarEspelho } from '../persistence/localStorageMirror'
import { solicitarPersistencia, type ResultadoPersistencia } from '../persistence/storagePersist'
import { SCHEMA_VERSION, type PartidaSalva } from '../persistence/tipos'

export interface UsePersistenciaResult {
  /** Ainda checando IndexedDB/espelho por um save existente. */
  carregando: boolean
  /** Save pronto para retomar (schemaVersion compatível). */
  saveEncontrado: PartidaSalva | null
  /** JSON bruto de um save com schemaVersion desconhecida — oferecido para
   *  export em vez de tentar (e falhar) reconstruir o estado. */
  saveBrutoIncompativel: string | null
  /** Carrega o save encontrado no jogo em curso. */
  continuar: () => void
  /** Descarta qualquer save salvo (chamado após a confirmação de "Nova
   *  partida" do enunciado, item 3). */
  descartarSave: () => Promise<void>
  /** Aviso persistente quando a última gravação falhou. */
  avisoSalvamento: string | null
  /** Resultado de `navigator.storage.persist()`, solicitado na primeira
   *  gravação bem-sucedida. `null` antes da primeira gravação. */
  persistencia: ResultadoPersistencia | null
}

export function usePersistencia(jogo: UseGameResult): UsePersistenciaResult {
  const [carregando, setCarregando] = useState(true)
  const [saveEncontrado, setSaveEncontrado] = useState<PartidaSalva | null>(null)
  const [saveBrutoIncompativel, setSaveBrutoIncompativel] = useState<string | null>(null)
  const [avisoSalvamento, setAvisoSalvamento] = useState<string | null>(null)
  const [persistencia, setPersistencia] = useState<ResultadoPersistencia | null>(null)
  const persistSolicitadaRef = useRef(false)

  // Carrega um save existente uma única vez, ao montar.
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      let registro = await carregarPartidaIndexedDB().catch(() => undefined)
      if (!registro) registro = carregarEspelho() ?? undefined
      if (cancelado) return
      if (!registro) {
        setCarregando(false)
        return
      }
      if (registro.schemaVersion !== SCHEMA_VERSION) {
        setSaveBrutoIncompativel(JSON.stringify(registro, null, 2))
      } else {
        setSaveEncontrado(registro)
      }
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  // Autosave: dispara a cada transação nova (docs da Sessão 5, item 3).
  useEffect(() => {
    const estado = jogo.estado
    if (!estado) return
    let cancelado = false

    async function salvar() {
      try {
        await salvarPartidaIndexedDB(estado!)
        salvarEspelho(estado!)
        if (cancelado) return
        setAvisoSalvamento(null)
        if (!persistSolicitadaRef.current) {
          persistSolicitadaRef.current = true
          const resultado = await solicitarPersistencia()
          if (!cancelado) setPersistencia(resultado)
        }
      } catch {
        if (!cancelado) {
          setAvisoSalvamento('Partida não está sendo salva — exporte o JSON para não perder o progresso.')
        }
      }
    }
    salvar()
    return () => {
      cancelado = true
    }
  }, [jogo.estado])

  const continuar = useCallback(() => {
    if (!saveEncontrado) return
    jogo.carregarEstado(saveEncontrado.estado)
    setSaveEncontrado(null)
  }, [jogo, saveEncontrado])

  const descartarSave = useCallback(async () => {
    await limparPartidaIndexedDB().catch(() => undefined)
    limparEspelho()
    setSaveEncontrado(null)
    setSaveBrutoIncompativel(null)
  }, [])

  return {
    carregando,
    saveEncontrado,
    saveBrutoIncompativel,
    continuar,
    descartarSave,
    avisoSalvamento,
    persistencia,
  }
}
