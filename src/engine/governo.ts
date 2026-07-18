import type { Estado, Jogador, Nacao } from './types'
import { NACOES } from '../data/regras'
import { somaObrigacoes } from './obrigacoes'

/** Entre jogadores empatados, escolhe o primeiro em sentido horário a partir do
 *  portador da carta de Investidor (inclui o próprio portador). Usa os assentos
 *  (docs/REGRAS.md §Regras monetárias, ação de Investidor). */
function primeiroHorarioApartirDoPortador(
  estado: Estado,
  empatados: Jogador[],
  portadorId: string,
): string {
  const portador = estado.jogadores.find((j) => j.id === portadorId)
  const base = portador ? portador.assento : 0
  const total = estado.jogadores.length
  let melhor = empatados[0]
  let melhorDist = Infinity
  for (const jogador of empatados) {
    const dist = (jogador.assento - base + total) % total
    if (dist < melhorDist) {
      melhorDist = dist
      melhor = jogador
    }
  }
  return melhor.id
}

/** Determina quem deve governar uma nação: jogador com a maior soma de valores
 *  de obrigações dela. Nação sem obrigações em mãos de jogadores → null
 *  (docs/REGRAS.md §Regras monetárias).
 *
 *  Desempate: sem `portadorId`, o empate MANTÉM o governante atual (recálculo
 *  inicial da partida). Com `portadorId` (recálculo do fim do Investidor), se o
 *  governante atual continua entre os empatados ele é mantido; caso contrário
 *  vence o primeiro em sentido horário a partir do portador da carta.
 *
 *  O governante atual usado para desempate é lido de `estado.nacoes[nacao]`. */
export function calcularGovernante(
  estado: Estado,
  nacao: Nacao,
  portadorId?: string,
): string | null {
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

  // Empate: o governante atual, se ainda empatado, permanece.
  if (atual && lideres.some((l) => l.id === atual)) return atual

  // Empate sem o atual entre os líderes: no Investidor, primeiro horário a
  // partir do portador; fora dele, mantém o atual (regra geral simplificada).
  if (portadorId) {
    return primeiroHorarioApartirDoPortador(estado, lideres, portadorId)
  }
  return atual
}

/** Mutação in-place: recalcula o governo das 6 nações e redistribui o Banco
 *  Suíço — quem passou a não governar nada ganha; quem governa devolve
 *  (docs/REGRAS.md §Regras monetárias, ação de Investidor). `portadorId`
 *  habilita o desempate horário a partir do portador da carta. */
export function aplicarRecalculoGovernos(
  estado: Estado,
  portadorId?: string,
): void {
  for (const nacao of NACOES) {
    estado.nacoes[nacao].governanteId = calcularGovernante(estado, nacao, portadorId)
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
