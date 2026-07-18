import type { Estado, Jogador, Nacao, Obrigacao } from './types'
import { NACOES, PP_MAXIMO } from '../data/regras'
import { jurosDaObrigacao, somaObrigacoes } from './obrigacoes'
import { fatorDePoder } from './poder'

// --- Fim de jogo -------------------------------------------------------------

/** Nações que atingiram o teto de PP e dispararam o fim de jogo (docs/REGRAS.md
 *  §Regras monetárias, etapa 4 da Tributação; enunciado Sessão 6, item 1). */
export function nacoesEncerrando(estado: Estado): Nacao[] {
  return NACOES.filter((n) => estado.nacoes[n].pontosPoder >= PP_MAXIMO)
}

/** Fim de jogo: alguma nação atingiu 25 Pontos de Poder. Derivado do estado,
 *  então undo/redo de uma tributação reflete no fim de jogo automaticamente
 *  (enunciado Sessão 6, itens 1 e 4). */
export function jogoTerminou(estado: Estado): boolean {
  return nacoesEncerrando(estado).length > 0
}

// --- Pontuação ---------------------------------------------------------------

/** Valor de uma obrigação na pontuação final: juros × Fator de Poder da nação
 *  (docs/REGRAS.md §Pontuação final). */
export function valorPontuacaoObrigacao(
  estado: Estado,
  obrigacao: Obrigacao,
): number {
  const fator = fatorDePoder(estado.nacoes[obrigacao.nacao].pontosPoder)
  return jurosDaObrigacao(obrigacao.valor) * fator
}

/** Pontuação de um jogador: Σ(juros × Fator de Poder) + dinheiro restante. */
export function pontuacaoJogador(estado: Estado, jogador: Jogador): number {
  const obrigacoes = jogador.obrigacoes.reduce(
    (soma, o) => soma + valorPontuacaoObrigacao(estado, o),
    0,
  )
  return obrigacoes + jogador.dinheiro
}

/** Detalhamento de uma obrigação na tela de pontuação:
 *  `juros × Fator de Poder = pontos` (ex.: Índia 12 → 5 × 3 = 15). */
export interface DetalheObrigacao {
  nacao: Nacao
  valor: number
  juros: number
  fator: number
  pontos: number
}

/** Detalhamento completo da pontuação de um jogador (enunciado Sessão 6, item 2). */
export interface PontuacaoDetalhada {
  jogador: Jogador
  obrigacoes: DetalheObrigacao[]
  /** Subtotal das obrigações (Σ pontos). */
  subtotalObrigacoes: number
  dinheiro: number
  /** Subtotal + dinheiro restante. */
  total: number
}

/** Monta o detalhamento por obrigação + subtotal + total de um jogador. As
 *  obrigações são ordenadas por ordem de turno da nação e, dentro dela, por
 *  valor decrescente — estável para a exibição. */
export function detalharPontuacaoJogador(
  estado: Estado,
  jogador: Jogador,
): PontuacaoDetalhada {
  const obrigacoes: DetalheObrigacao[] = jogador.obrigacoes
    .map((o) => {
      const fator = fatorDePoder(estado.nacoes[o.nacao].pontosPoder)
      const juros = jurosDaObrigacao(o.valor)
      return { nacao: o.nacao, valor: o.valor, juros, fator, pontos: juros * fator }
    })
    .sort(
      (a, b) =>
        NACOES.indexOf(a.nacao) - NACOES.indexOf(b.nacao) || b.valor - a.valor,
    )

  const subtotalObrigacoes = obrigacoes.reduce((s, o) => s + o.pontos, 0)
  return {
    jogador,
    obrigacoes,
    subtotalObrigacoes,
    dinheiro: jogador.dinheiro,
    total: subtotalObrigacoes + jogador.dinheiro,
  }
}

// --- Classificação e desempate -----------------------------------------------

/** Nações em ordem decrescente de PP (base do desempate). Empate de PP mantém a
 *  ordem de turno como critério estável. */
function nacoesPorPoder(estado: Estado): Nacao[] {
  return [...NACOES].sort(
    (a, b) => estado.nacoes[b].pontosPoder - estado.nacoes[a].pontosPoder,
  )
}

/** Nação que decidiu um desempate no total (docs/REGRAS.md §Pontuação final). */
export interface CriterioDesempate {
  nacao: Nacao
  pontosPoder: number
}

/** Compara dois jogadores na classificação final. `ordem < 0` → `a` vem antes
 *  (melhor colocado); `ordem === 0` → empate real (mesmo total e mesmas somas de
 *  obrigações em TODAS as 6 nações). `criterio` é preenchido quando o total
 *  empatou e uma nação decidiu — a primeira nação (maior PP) em que as somas de
 *  obrigações diferem (docs/REGRAS.md §Pontuação final). */
function compararFinal(
  estado: Estado,
  a: PontuacaoDetalhada,
  b: PontuacaoDetalhada,
  nacoes: Nacao[],
): { ordem: number; criterio: CriterioDesempate | null } {
  if (a.total !== b.total) return { ordem: b.total - a.total, criterio: null }
  for (const nacao of nacoes) {
    const diff = somaObrigacoes(b.jogador, nacao) - somaObrigacoes(a.jogador, nacao)
    if (diff !== 0) {
      return {
        ordem: diff,
        criterio: { nacao, pontosPoder: estado.nacoes[nacao].pontosPoder },
      }
    }
  }
  return { ordem: 0, criterio: null }
}

/** Uma linha da classificação final. */
export interface EntradaClassificacao {
  jogador: Jogador
  detalhe: PontuacaoDetalhada
  /** Colocação (1-based). Jogadores em empate real compartilham a mesma. */
  posicao: number
  /** Critério que colocou este jogador à frente do próximo quando o total
   *  empatou. `null` se a diferença para o próximo foi no próprio total, ou se é
   *  o último colocado, ou se é empate real com o próximo. */
  desempate: CriterioDesempate | null
  /** Empate real com algum vizinho: mesmo total e mesmas somas de obrigações em
   *  todas as 6 nações. O manual manda declarar empate nesse caso. */
  empateReal: boolean
}

/** Classificação final, do melhor para o pior, com detalhamento, desempates e
 *  empates reais resolvidos (docs/REGRAS.md §Pontuação final; enunciado Sessão 6,
 *  itens 2 e 3). */
export function classificacaoFinal(estado: Estado): EntradaClassificacao[] {
  const nacoes = nacoesPorPoder(estado)
  const detalhes = estado.jogadores.map((j) => detalharPontuacaoJogador(estado, j))
  const ordenados = [...detalhes].sort(
    (a, b) => compararFinal(estado, a, b, nacoes).ordem,
  )

  const entradas: EntradaClassificacao[] = []
  for (let i = 0; i < ordenados.length; i++) {
    const det = ordenados[i]

    let posicao = i + 1
    let empateReal = false
    if (i > 0) {
      const cmpAnterior = compararFinal(estado, ordenados[i - 1], det, nacoes)
      if (cmpAnterior.ordem === 0) {
        posicao = entradas[i - 1].posicao
        empateReal = true
        entradas[i - 1].empateReal = true
      }
    }

    let desempate: CriterioDesempate | null = null
    if (i < ordenados.length - 1) {
      desempate = compararFinal(estado, det, ordenados[i + 1], nacoes).criterio
    }

    entradas.push({ jogador: det.jogador, detalhe: det, posicao, desempate, empateReal })
  }
  return entradas
}

/** Classificação final compacta (compatibilidade): só jogador + total, na ordem
 *  de colocação. */
export function pontuacaoFinal(
  estado: Estado,
): { jogador: Jogador; pontos: number }[] {
  return classificacaoFinal(estado).map((e) => ({
    jogador: e.jogador,
    pontos: e.detalhe.total,
  }))
}
