// Modelo de dados e helpers puros do wizard de setup. Mantido separado dos
// componentes para poder ser testado sem renderizar nada.

import type { EstadoNacao, Jogador, Nacao, Obrigacao } from '../../engine'
import { NACOES, VALORES_OBRIGACAO } from '../../data/regras'

export interface JogadorDraft {
  id: string
  nome: string
}

let contadorId = 0
function novoIdJogador(): string {
  contadorId += 1
  return `jogador-${contadorId}`
}

export function jogadorPadrao(numero: number): JogadorDraft {
  return { id: novoIdJogador(), nome: `Jogador ${numero}` }
}

/** nação → valor da obrigação → id do jogador dono (ausente = disponível). */
export type ObrigacoesEscolhidas = Record<Nacao, Partial<Record<number, string>>>

export function criarObrigacoesVazias(): ObrigacoesEscolhidas {
  const obj = {} as ObrigacoesEscolhidas
  for (const nacao of NACOES) obj[nacao] = {}
  return obj
}

/** Soma dos valores de obrigação que um jogador escolheu, em todas as nações. */
export function totalEscolhidoPeloJogador(
  obrigacoes: ObrigacoesEscolhidas,
  jogadorId: string,
): number {
  let soma = 0
  for (const nacao of NACOES) {
    for (const [valor, dono] of Object.entries(obrigacoes[nacao])) {
      if (dono === jogadorId) soma += Number(valor)
    }
  }
  return soma
}

/** Soma dos valores de obrigação atribuídos a uma nação (vira o tesouro dela). */
export function totalDaNacao(obrigacoes: ObrigacoesEscolhidas, nacao: Nacao): number {
  return Object.entries(obrigacoes[nacao]).reduce(
    (soma, [valor]) => soma + Number(valor),
    0,
  )
}

/** Quem tem a maior soma de valores de obrigação de uma nação entre os
 *  jogadores do wizard. Empate → ninguém controla ainda (não há governante
 *  anterior para desempatar), igual à regra de nação sem líder único
 *  (docs/REGRAS.md §Regras monetárias). */
export function quemControla(
  jogadores: JogadorDraft[],
  obrigacoes: ObrigacoesEscolhidas,
  nacao: Nacao,
): string | null {
  let melhorId: string | null = null
  let melhorSoma = 0
  let empatado = false
  for (const jogador of jogadores) {
    const soma = totalEscolhidoPorJogadorNaNacao(obrigacoes, nacao, jogador.id)
    if (soma <= 0) continue
    if (soma > melhorSoma) {
      melhorSoma = soma
      melhorId = jogador.id
      empatado = false
    } else if (soma === melhorSoma) {
      empatado = true
    }
  }
  return empatado ? null : melhorId
}

function totalEscolhidoPorJogadorNaNacao(
  obrigacoes: ObrigacoesEscolhidas,
  nacao: Nacao,
  jogadorId: string,
): number {
  return Object.entries(obrigacoes[nacao]).reduce(
    (soma, [valor, dono]) => (dono === jogadorId ? soma + Number(valor) : soma),
    0,
  )
}

/** Sugere o portador inicial da carta de Investidor: à esquerda (próximo em
 *  sentido horário) de quem controla a Rússia; senão, de quem controla a
 *  China (docs/REGRAS.md §Nações — ordem cíclica é a ordem dos assentos). */
export function sugerirPortadorInvestidor(
  jogadores: JogadorDraft[],
  obrigacoes: ObrigacoesEscolhidas,
): string | null {
  if (jogadores.length === 0) return null
  const controladorId =
    quemControla(jogadores, obrigacoes, 'russia') ??
    quemControla(jogadores, obrigacoes, 'china')
  if (!controladorId) return null
  const indice = jogadores.findIndex((j) => j.id === controladorId)
  if (indice < 0) return null
  return jogadores[(indice + 1) % jogadores.length].id
}

/** Constrói os `Jogador` do engine a partir do draft do wizard. `assento` é a
 *  posição no array (já em sentido horário, ver EtapaJogadores). */
export function construirJogadoresEngine(
  jogadores: JogadorDraft[],
  capital: number,
  obrigacoes: ObrigacoesEscolhidas,
  cartaInvestidorId: string | null,
): Jogador[] {
  return jogadores.map((draft, assento) => {
    const obrigacoesDoJogador: Obrigacao[] = []
    for (const nacao of NACOES) {
      for (const [valor, dono] of Object.entries(obrigacoes[nacao])) {
        if (dono === draft.id) obrigacoesDoJogador.push({ nacao, valor: Number(valor) })
      }
    }
    return {
      id: draft.id,
      nome: draft.nome,
      assento,
      dinheiro: capital - totalEscolhidoPeloJogador(obrigacoes, draft.id),
      obrigacoes: obrigacoesDoJogador,
      temBancoSuico: false, // recalculado por `recalcularGovernos` ao iniciar
      temCartaInvestidor: draft.id === cartaInvestidorId,
    }
  })
}

/** Tesouro inicial de cada nação: soma dos valores das obrigações compradas. */
export function construirNacoesParciais(
  obrigacoes: ObrigacoesEscolhidas,
): Partial<Record<Nacao, Partial<EstadoNacao>>> {
  const parcial: Partial<Record<Nacao, Partial<EstadoNacao>>> = {}
  for (const nacao of NACOES) {
    parcial[nacao] = { tesouro: totalDaNacao(obrigacoes, nacao) }
  }
  return parcial
}

export { NACOES, VALORES_OBRIGACAO }
