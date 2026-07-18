// Helpers puros do dashboard. Mantidos separados dos componentes para poder
// ser testados sem renderizar nada (mesmo padrão de src/components/setup/modelo.ts).

import type { Estado, Nacao } from '../../engine'
import { jurosDevidos, somaObrigacoes } from '../../engine'
import { NACOES } from '../../data/regras'

export interface GrupoObrigacoes {
  nacao: Nacao
  soma: number
  juros: number
}

/** Obrigações de um jogador agrupadas por nação (só nações com alguma
 *  obrigação), com a soma de valores (define controle) e a soma de juros. */
export function obrigacoesAgrupadasPorNacao(
  estado: Estado,
  jogadorId: string,
): GrupoObrigacoes[] {
  const jogador = estado.jogadores.find((j) => j.id === jogadorId)
  if (!jogador) return []
  return NACOES.map((nacao) => ({
    nacao,
    soma: somaObrigacoes(jogador, nacao),
    juros: jurosDevidos(jogador, nacao),
  })).filter((grupo) => grupo.soma > 0)
}

/** Nações governadas por um jogador. */
export function nacoesGovernadasPor(estado: Estado, jogadorId: string): Nacao[] {
  return NACOES.filter((nacao) => estado.nacoes[nacao].governanteId === jogadorId)
}

export interface NacaoLider {
  nacao: Nacao
  pontosPoder: number
}

/** Nação com mais Pontos de Poder (para a barra de progresso rumo a 25 PP). */
export function nacaoLider(estado: Estado): NacaoLider {
  let melhor: NacaoLider = { nacao: NACOES[0], pontosPoder: -1 }
  for (const nacao of NACOES) {
    const pontosPoder = estado.nacoes[nacao].pontosPoder
    if (pontosPoder > melhor.pontosPoder) melhor = { nacao, pontosPoder }
  }
  return melhor
}

export interface ControleLatente {
  jogadorId: string
  soma: number
}

/** Sinaliza quando a soma de obrigações de outro jogador já supera a do
 *  governante atual de uma nação — mudança pendente que só se efetiva na
 *  próxima verificação do Investidor (docs/REGRAS.md §Regras monetárias).
 *  Não decide o governo, só aponta o candidato com maior soma. */
export function controleLatente(estado: Estado, nacao: Nacao): ControleLatente | null {
  const estadoNacao = estado.nacoes[nacao]
  const governanteAtual = estado.jogadores.find((j) => j.id === estadoNacao.governanteId)
  const somaAtual = governanteAtual ? somaObrigacoes(governanteAtual, nacao) : 0

  let melhor: ControleLatente | null = null
  for (const jogador of estado.jogadores) {
    if (jogador.id === estadoNacao.governanteId) continue
    const soma = somaObrigacoes(jogador, nacao)
    if (soma > somaAtual && (!melhor || soma > melhor.soma)) {
      melhor = { jogadorId: jogador.id, soma }
    }
  }
  return melhor
}
