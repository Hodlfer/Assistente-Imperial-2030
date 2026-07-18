// Tipos puros do engine — sem nenhuma dependência de React.
// Ver docs/ARQUITETURA.md (§Engine separado da UI, §Tudo é transação).

export type Nacao = 'russia' | 'china' | 'india' | 'brasil' | 'eua' | 'europa'

/** Uma obrigação em mãos de um jogador. Os juros são derivados do valor
 *  (ver `jurosDaObrigacao`), não armazenados. */
export interface Obrigacao {
  nacao: Nacao
  valor: number
}

export interface Jogador {
  id: string
  nome: string
  /** Ordem na mesa, sentido horário. */
  assento: number
  dinheiro: number
  obrigacoes: Obrigacao[]
  temBancoSuico: boolean
  temCartaInvestidor: boolean
}

export interface EstadoNacao {
  tesouro: number
  pontosPoder: number
  governanteId: string | null
  /** Valores de obrigação ainda na pilha (não comprados). */
  obrigacoesDisponiveis: number[]
}

export interface Estado {
  jogadores: Jogador[]
  nacoes: Record<Nacao, EstadoNacao>
  /** Histórico completo. `transacoes[0]` é sempre `PartidaIniciada` e guarda o
   *  snapshot inicial usado para reconstruir o estado (undo). */
  transacoes: Transacao[]
}

// --- Transações (união discriminada, uma variante por ação) ------------------

interface TransacaoBase {
  /** Momento em que a transação foi registrada. */
  timestamp: number
  /** Rótulo legível para o histórico/undo na UI. */
  rotulo: string
}

/** Primeira transação de toda partida: guarda o estado inicial para o undo. */
export interface PartidaIniciada extends TransacaoBase {
  tipo: 'PartidaIniciada'
  estadoInicial: {
    jogadores: Jogador[]
    nacoes: Record<Nacao, EstadoNacao>
  }
}

export interface ObrigacaoComprada extends TransacaoBase {
  tipo: 'ObrigacaoComprada'
  jogadorId: string
  nacao: Nacao
  valor: number
  resultado: { pagoAoTesouro: number }
}

/** Upgrade: devolve uma obrigação da mesma nação e pega outra de valor maior,
 *  pagando a diferença ao tesouro. A devolvida volta à pilha. */
export interface ObrigacaoTrocada extends TransacaoBase {
  tipo: 'ObrigacaoTrocada'
  jogadorId: string
  nacao: Nacao
  valorDevolvido: number
  valorNovo: number
  resultado: { diferencaPaga: number }
}

export interface TributacaoAplicada extends TransacaoBase {
  tipo: 'TributacaoAplicada'
  nacao: Nacao
  fabricas: number
  bandeiras: number
  unidades: number
  resultado: {
    /** Valor de tributação = 2×fábricas + 1×bandeiras. */
    tributacao: number
    /** banco → tesouro (etapa 1). */
    aoTesouro: number
    /** tesouro → banco por unidade militar (etapa 2). */
    salarios: number
    /** tesouro → governante, bônus da tabela (etapa 3). */
    bonusGovernante: number
    /** Pontos de Poder ganhos pela nação (etapa 4). */
    ganhoPP: number
  }
}

export interface JurosPagos extends TransacaoBase {
  tipo: 'JurosPagos'
  nacao: Nacao
  resultado: {
    porJogador: { jogadorId: string; devido: number; recebido: number }[]
    /** Total pago pelo tesouro da nação. */
    doTesouro: number
    /** Total completado pelo bolso do governante quando o tesouro faltou. */
    doBolsoGovernante: number
    /** Juros que o governante abdicou (não recebeu) por falta de tesouro. */
    governanteAbdicou: number
  }
}

/** Recalcula os governos das 6 nações e redistribui o Banco Suíço.
 *  Só é aplicada ao fim da ação de Investidor. */
export interface GovernosRecalculados extends TransacaoBase {
  tipo: 'GovernosRecalculados'
}

export type Transacao =
  | PartidaIniciada
  | ObrigacaoComprada
  | ObrigacaoTrocada
  | TributacaoAplicada
  | JurosPagos
  | GovernosRecalculados
