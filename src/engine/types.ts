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
  /** Portador da carta de Investidor no momento do recálculo. Quando presente,
   *  o desempate entre novos empatados usa a ordem horária a partir dele
   *  (docs/REGRAS.md §Regras monetárias, ação de Investidor). Ausente no
   *  recálculo inicial da partida, que mantém o governo atual em empates. */
  portadorId?: string
}

/** Movimento simples de dinheiro contra o banco (fonte/destino ilimitada):
 *  débito/crédito no tesouro de uma nação ou no dinheiro pessoal de um jogador.
 *  Primitiva usada pelas ações do rondel (Fábrica, Importação, +2 do portador,
 *  espaços extras). O sinal de `delta` já embute a direção (docs/REGRAS.md
 *  §Regras monetárias, §Banco sem saldo em docs/ARQUITETURA.md). */
export interface MovimentoBanco extends TransacaoBase {
  tipo: 'MovimentoBanco'
  alvo:
    | { tipo: 'tesouro'; nacao: Nacao }
    | { tipo: 'jogador'; jogadorId: string }
  delta: number
}

/** Passa a carta de Investidor de um jogador ao próximo em sentido horário
 *  (docs/REGRAS.md §Regras monetárias, ação de Investidor). */
export interface CartaInvestidorPassada extends TransacaoBase {
  tipo: 'CartaInvestidorPassada'
  deJogadorId: string
  paraJogadorId: string
}

/** Nomes das ações do rondel, para rótulo/histórico e cursor de turno. */
export type TipoAcaoRondel =
  | 'fabrica'
  | 'importacao'
  | 'producao'
  | 'manobra'
  | 'tributacao'
  | 'investidor'
  | 'investidorPassar'
  | 'espacosExtras'

/** Ação do rondel como UMA transação composta: aplica seus `passos` em ordem e
 *  é desfeita de uma vez (docs/ARQUITETURA.md §Tudo é transação; enunciado da
 *  Sessão 4: "dispara UMA transação composta, desfazível de uma vez"). Ações
 *  sem efeito monetário (Produção/Manobra) têm `passos` vazio — servem como
 *  registro de log do turno. */
export interface AcaoRondel extends TransacaoBase {
  tipo: 'AcaoRondel'
  acao: TipoAcaoRondel
  /** Nação ativa que executou a ação (base do cursor de turno). */
  nacao: Nacao
  passos: Transacao[]
}

/** Alvo de uma correção manual (docs/ARQUITETURA.md — válvula de escape para
 *  situações de mesa que o app não modela). */
export type AlvoAjusteManual =
  | { tipo: 'tesouro'; nacao: Nacao; delta: number }
  | { tipo: 'jogador'; jogadorId: string; delta: number }
  | {
      tipo: 'moverObrigacao'
      nacao: Nacao
      valor: number
      /** `null` = pilha de obrigações disponíveis da nação. */
      origemJogadorId: string | null
      /** `null` = pilha de obrigações disponíveis da nação. */
      destinoJogadorId: string | null
    }

/** Transação genérica de ajuste manual (menu "Correção manual" do dashboard):
 *  +/− em qualquer tesouro ou jogador, ou mover uma obrigação. Passa pelo
 *  mesmo pipeline de transações — aparece no histórico e é desfazível. */
export interface AjusteManual extends TransacaoBase {
  tipo: 'AjusteManual'
  motivo: string
  alvo: AlvoAjusteManual
}

export type Transacao =
  | PartidaIniciada
  | ObrigacaoComprada
  | ObrigacaoTrocada
  | TributacaoAplicada
  | JurosPagos
  | GovernosRecalculados
  | MovimentoBanco
  | CartaInvestidorPassada
  | AcaoRondel
  | AjusteManual
