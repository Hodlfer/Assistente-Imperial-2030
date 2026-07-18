// Hook que liga o engine (puro, sem React) à UI (docs/ARQUITETURA.md
// §Engine separado da UI). A persistência (autosave em IndexedDB) fica em
// `usePersistencia`, que envolve este hook (Sessão 5).

import { useCallback, useState } from 'react'
import type { Estado, EstadoNacao, Jogador, Nacao, Transacao } from '../engine'
import {
  aplicarTransacao,
  criarEstado,
  desfazer as desfazerEstado,
  recalcularGovernos,
} from '../engine'

interface EstadoInterno {
  estado: Estado | null
  /** Transações removidas por `desfazer`, na ordem em que podem ser
   *  reaplicadas por `refazer`. Zerada sempre que uma nova transação é
   *  aplicada (docs da Sessão 5: "refazer disponível até que uma nova
   *  transação seja aplicada"). */
  pilhaRefazer: Transacao[]
}

export interface UseGameResult {
  /** `null` antes do wizard finalizar o setup (nenhuma partida em curso). */
  estado: Estado | null
  /** Mensagem do último erro de invariante lançado pelo engine, para exibir
   *  como toast/alerta. `null` quando não há erro pendente. */
  erro: string | null
  /** Aplica uma ação do engine sobre o estado atual, ex.:
   *  `dispatch((e) => comprarObrigacao(e, jogadorId, nacao, valor))`.
   *  Erros de invariante (lançados pelo engine) são capturados e expostos em
   *  `erro`, sem derrubar a UI nem mudar o estado. */
  dispatch: (transacao: (estado: Estado) => Estado) => void
  /** Desfaz a última transação aplicada (`engine.desfazer`), empilhando-a
   *  para um `refazer` futuro. */
  desfazer: () => void
  /** Reaplica a última transação desfeita, se houver. */
  refazer: () => void
  /** Há alguma transação além de `PartidaIniciada` para desfazer. */
  podeDesfazer: boolean
  /** Há alguma transação desfeita para reaplicar. */
  podeRefazer: boolean
  /** Inicia a partida: recebe os jogadores e os tesouros iniciais das nações
   *  definidos no wizard, calcula os governos e registra a transação
   *  `PartidaIniciada` como baseline do undo. */
  iniciarPartida: (
    jogadores: Jogador[],
    nacoesParciais?: Partial<Record<Nacao, Partial<EstadoNacao>>>,
  ) => void
  /** Substitui o estado atual por um já pronto (ex.: fixture de dev, save
   *  carregado do IndexedDB, import de JSON), sem recalcular governos. */
  carregarEstado: (estado: Estado) => void
  /** Encerra a partida atual e volta ao estado sem partida (`estado === null`),
   *  levando a UI de volta ao wizard (enunciado Sessão 6, item 4). */
  reiniciar: () => void
  /** Limpa o erro pendente (ex.: ao fechar o toast). */
  limparErro: () => void
}

/** Monta o estado inicial já com os governos calculados: cria um estado
 *  provisório, aplica `recalcularGovernos` sobre ele e usa o resultado como
 *  snapshot de uma NOVA `PartidaIniciada` — assim o baseline do undo já
 *  nasce com governos e Bancos Suíços corretos, numa única transação. */
export function estadoInicialComGovernos(
  jogadores: Jogador[],
  nacoesParciais: Partial<Record<Nacao, Partial<EstadoNacao>>> = {},
): Estado {
  const provisorio = recalcularGovernos(criarEstado(jogadores, nacoesParciais))
  return criarEstado(provisorio.jogadores, provisorio.nacoes)
}

function mensagemDeErro(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export function useGame(estadoInicial: Estado | null = null): UseGameResult {
  const [interno, setInterno] = useState<EstadoInterno>({
    estado: estadoInicial,
    pilhaRefazer: [],
  })
  const [erro, setErro] = useState<string | null>(null)

  const dispatch = useCallback((transacao: (estado: Estado) => Estado) => {
    setInterno((atual) => {
      if (!atual.estado) return atual
      try {
        const proximo = transacao(atual.estado)
        setErro(null)
        return { estado: proximo, pilhaRefazer: [] }
      } catch (e) {
        setErro(mensagemDeErro(e))
        return atual
      }
    })
  }, [])

  const desfazer = useCallback(() => {
    setInterno((atual) => {
      if (!atual.estado || atual.estado.transacoes.length <= 1) return atual
      const removida = atual.estado.transacoes[atual.estado.transacoes.length - 1]
      return {
        estado: desfazerEstado(atual.estado),
        pilhaRefazer: [...atual.pilhaRefazer, removida],
      }
    })
  }, [])

  const refazer = useCallback(() => {
    setInterno((atual) => {
      if (!atual.estado || atual.pilhaRefazer.length === 0) return atual
      const transacao = atual.pilhaRefazer[atual.pilhaRefazer.length - 1]
      try {
        const proximo = aplicarTransacao(atual.estado, transacao)
        setErro(null)
        return { estado: proximo, pilhaRefazer: atual.pilhaRefazer.slice(0, -1) }
      } catch (e) {
        setErro(mensagemDeErro(e))
        return atual
      }
    })
  }, [])

  const iniciarPartida = useCallback(
    (
      jogadores: Jogador[],
      nacoesParciais: Partial<Record<Nacao, Partial<EstadoNacao>>> = {},
    ) => {
      try {
        setInterno({
          estado: estadoInicialComGovernos(jogadores, nacoesParciais),
          pilhaRefazer: [],
        })
        setErro(null)
      } catch (e) {
        setErro(mensagemDeErro(e))
      }
    },
    [],
  )

  const carregarEstado = useCallback((novoEstado: Estado) => {
    setInterno({ estado: novoEstado, pilhaRefazer: [] })
    setErro(null)
  }, [])

  const reiniciar = useCallback(() => {
    setInterno({ estado: null, pilhaRefazer: [] })
    setErro(null)
  }, [])

  const limparErro = useCallback(() => setErro(null), [])

  return {
    estado: interno.estado,
    erro,
    dispatch,
    desfazer,
    refazer,
    podeDesfazer: !!interno.estado && interno.estado.transacoes.length > 1,
    podeRefazer: interno.pilhaRefazer.length > 0,
    iniciarPartida,
    carregarEstado,
    reiniciar,
    limparErro,
  }
}
