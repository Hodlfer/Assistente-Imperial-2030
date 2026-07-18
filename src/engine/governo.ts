import type { Estado, Jogador, Nacao } from './types'
import { NACOES } from '../data/regras'
import { somaObrigacoes } from './obrigacoes'

/** Determina quem deve governar uma nação: jogador com a maior soma de valores
 *  de obrigações dela. Empate MANTÉM o governante atual; nação sem obrigações
 *  em mãos de jogadores → null (docs/REGRAS.md §Regras monetárias).
 *
 *  O governante atual usado para desempate é lido de `estado.nacoes[nacao]`. */
export function calcularGovernante(estado: Estado, nacao: Nacao): string | null {
  const atual = estado.nacoes[nacao].governanteId

  let maiorSoma = 0
  let lideres: Jogador[] = []
  for (const jogador of estado.jogadores) {
    const soma = somaObrigacoes(jogador, nacao)
    if (soma <= 0) continue
    if (soma > maiorSoma) {
      maiorSoma = soma
      lideres = [jogador]
    } else if (soma === maiorSoma) {
      lideres.push(jogador)
    }
  }

  // Nação órfã: ninguém possui obrigações dela.
  if (maiorSoma === 0) return null

  // Líder único assume o governo.
  if (lideres.length === 1) return lideres[0].id

  // Empate: o governo não muda.
  return atual
}

/** Mutação in-place: recalcula o governo das 6 nações e redistribui o Banco
 *  Suíço — quem passou a não governar nada ganha; quem governa devolve
 *  (docs/REGRAS.md §Regras monetárias, ação de Investidor). */
export function aplicarRecalculoGovernos(estado: Estado): void {
  for (const nacao of NACOES) {
    estado.nacoes[nacao].governanteId = calcularGovernante(estado, nacao)
  }

  const governantes = new Set<string>()
  for (const nacao of NACOES) {
    const id = estado.nacoes[nacao].governanteId
    if (id) governantes.add(id)
  }

  for (const jogador of estado.jogadores) {
    jogador.temBancoSuico = !governantes.has(jogador.id)
  }
}
