import type { Estado, Jogador, Obrigacao } from './types'
import { NACOES } from '../data/regras'
import { jurosDaObrigacao, somaObrigacoes } from './obrigacoes'
import { fatorDePoder } from './poder'

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

/** Classificação final, do maior para o menor. Desempate: maior soma de
 *  obrigações na nação com mais PP; persiste → próxima nação com mais PP
 *  (docs/REGRAS.md §Pontuação final). */
export function pontuacaoFinal(
  estado: Estado,
): { jogador: Jogador; pontos: number }[] {
  const nacoesPorPP = [...NACOES].sort(
    (a, b) => estado.nacoes[b].pontosPoder - estado.nacoes[a].pontosPoder,
  )

  return estado.jogadores
    .map((jogador) => ({ jogador, pontos: pontuacaoJogador(estado, jogador) }))
    .sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos
      for (const nacao of nacoesPorPP) {
        const diff =
          somaObrigacoes(b.jogador, nacao) - somaObrigacoes(a.jogador, nacao)
        if (diff !== 0) return diff
      }
      return 0
    })
}
