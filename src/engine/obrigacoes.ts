import type { Jogador, Nacao } from './types'
import { jurosPorValor } from '../data/regras'

/** Juros de uma obrigação, derivados do seu valor (docs/REGRAS.md §Obrigações). */
export function jurosDaObrigacao(valor: number): number {
  return jurosPorValor(valor)
}

/** Soma dos VALORES das obrigações de uma nação que o jogador possui.
 *  Base para determinar o controle (docs/REGRAS.md §Regras monetárias). */
export function somaObrigacoes(jogador: Jogador, nacao: Nacao): number {
  return jogador.obrigacoes
    .filter((o) => o.nacao === nacao)
    .reduce((soma, o) => soma + o.valor, 0)
}

/** Soma dos JUROS devidos a um jogador pelas obrigações de uma nação. */
export function jurosDevidos(jogador: Jogador, nacao: Nacao): number {
  return jogador.obrigacoes
    .filter((o) => o.nacao === nacao)
    .reduce((soma, o) => soma + jurosDaObrigacao(o.valor), 0)
}
