// Hook que liga o engine (puro, sem React) à UI (docs/ARQUITETURA.md
// §Engine separado da UI). Por enquanto o estado vive só em memória — a
// persistência em IndexedDB é da Sessão 5.

import { useCallback, useState } from 'react'
import type { Estado, EstadoNacao, Jogador, Nacao } from '../engine'
import { criarEstado, desfazer as desfazerEstado, recalcularGovernos } from '../engine'

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
  /** Desfaz a última transação aplicada (`engine.desfazer`). */
  desfazer: () => void
  /** Inicia a partida: recebe os jogadores e os tesouros iniciais das nações
   *  definidos no wizard, calcula os governos e registra a transação
   *  `PartidaIniciada` como baseline do undo. */
  iniciarPartida: (
    jogadores: Jogador[],
    nacoesParciais?: Partial<Record<Nacao, Partial<EstadoNacao>>>,
  ) => void
  /** Substitui o estado atual por um já pronto (ex.: fixture de dev, import de
   *  JSON — Sessão 5), sem recalcular governos. */
  carregarEstado: (estado: Estado) => void
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

export function useGame(): UseGameResult {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const dispatch = useCallback((transacao: (estado: Estado) => Estado) => {
    setEstado((atual) => {
      if (!atual) return atual
      try {
        const proximo = transacao(atual)
        setErro(null)
        return proximo
      } catch (e) {
        setErro(mensagemDeErro(e))
        return atual
      }
    })
  }, [])

  const desfazer = useCallback(() => {
    setEstado((atual) => (atual ? desfazerEstado(atual) : atual))
  }, [])

  const iniciarPartida = useCallback(
    (
      jogadores: Jogador[],
      nacoesParciais: Partial<Record<Nacao, Partial<EstadoNacao>>> = {},
    ) => {
      try {
        setEstado(estadoInicialComGovernos(jogadores, nacoesParciais))
        setErro(null)
      } catch (e) {
        setErro(mensagemDeErro(e))
      }
    },
    [],
  )

  const carregarEstado = useCallback((novoEstado: Estado) => {
    setEstado(novoEstado)
    setErro(null)
  }, [])

  const limparErro = useCallback(() => setErro(null), [])

  return {
    estado,
    erro,
    dispatch,
    desfazer,
    iniciarPartida,
    carregarEstado,
    limparErro,
  }
}
