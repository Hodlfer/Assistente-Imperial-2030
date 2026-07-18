// Estado de exemplo para dev/manual QA do dashboard (Sessão 3, critério de
// aceite: 6 jogadores e ~20 obrigações distribuídas). Não é usado em
// produção — só pelo botão "Carregar exemplo (dev)" em App.tsx (import.meta.env.DEV).
//
// `governanteId` é fixado manualmente (não via `recalcularGovernos`) para que
// Rússia, Brasil e Índia fiquem com um "controle latente" pendente, exercitando
// o aviso do dashboard; Europa começa com 22 PP para exercitar o aviso de fim
// de jogo próximo; dois nomes longos testam o layout.

import type { EstadoNacao, Jogador, Nacao } from '../engine'
import { criarEstado } from '../engine'

export const fixtureJogadores: Jogador[] = [
  {
    id: 'fixture-j1',
    nome: 'Alexandre da Silva Nogueira Filho',
    assento: 0,
    dinheiro: 2,
    obrigacoes: [
      { nacao: 'russia', valor: 12 },
      { nacao: 'russia', valor: 20 },
      { nacao: 'eua', valor: 2 },
      { nacao: 'india', valor: 2 },
    ],
    temBancoSuico: false,
    temCartaInvestidor: false,
  },
  {
    id: 'fixture-j2',
    nome: 'Beatriz',
    assento: 1,
    dinheiro: 5,
    obrigacoes: [
      { nacao: 'china', valor: 16 },
      { nacao: 'brasil', valor: 20 },
      { nacao: 'europa', valor: 2 },
    ],
    temBancoSuico: false,
    temCartaInvestidor: true,
  },
  {
    id: 'fixture-j3',
    nome: 'Carlos Eduardo Machado de Barros Júnior',
    assento: 2,
    dinheiro: 0,
    obrigacoes: [
      { nacao: 'russia', valor: 25 },
      { nacao: 'russia', valor: 30 },
      { nacao: 'eua', valor: 4 },
      { nacao: 'eua', valor: 6 },
      { nacao: 'eua', valor: 30 },
    ],
    temBancoSuico: false,
    temCartaInvestidor: false,
  },
  {
    id: 'fixture-j4',
    nome: 'Diana',
    assento: 3,
    dinheiro: 8,
    obrigacoes: [
      { nacao: 'china', valor: 9 },
      { nacao: 'india', valor: 4 },
      { nacao: 'eua', valor: 9 },
      { nacao: 'europa', valor: 4 },
    ],
    temBancoSuico: true,
    temCartaInvestidor: false,
  },
  {
    id: 'fixture-j5',
    nome: 'Elias',
    assento: 4,
    dinheiro: -1,
    obrigacoes: [
      { nacao: 'brasil', valor: 6 },
      { nacao: 'brasil', valor: 9 },
      { nacao: 'china', valor: 2 },
    ],
    temBancoSuico: false,
    temCartaInvestidor: false,
  },
  {
    id: 'fixture-j6',
    nome: 'Fernanda',
    assento: 5,
    dinheiro: 3,
    obrigacoes: [
      { nacao: 'brasil', valor: 4 },
      { nacao: 'europa', valor: 12 },
      { nacao: 'europa', valor: 16 },
    ],
    temBancoSuico: false,
    temCartaInvestidor: false,
  },
]

export const fixtureNacoesParciais: Partial<Record<Nacao, Partial<EstadoNacao>>> = {
  // j3 (soma 55) já supera j1 (soma 32) — controle latente.
  russia: { tesouro: 25, pontosPoder: 17, governanteId: 'fixture-j1' },
  china: { tesouro: 18, pontosPoder: 11, governanteId: 'fixture-j2' },
  // ninguém tem obrigação de Índia ainda no fixture original, mas j1/j4
  // compraram depois → órfã com controle pendente (governanteId null).
  india: { tesouro: 6, pontosPoder: 3, governanteId: null },
  // j2 (soma 20) já supera j5 (soma 15) — controle latente.
  brasil: { tesouro: 12, pontosPoder: 9, governanteId: 'fixture-j5' },
  eua: { tesouro: 30, pontosPoder: 14, governanteId: 'fixture-j3' },
  // 22 PP → aviso de fim de jogo próximo (limiar é 20).
  europa: { tesouro: 40, pontosPoder: 22, governanteId: 'fixture-j6' },
}

/** Monta o `Estado` completo do fixture, pronto para `jogo.carregarEstado`. */
export function criarEstadoFixture() {
  return criarEstado(fixtureJogadores, fixtureNacoesParciais)
}
