// Constantes de regras, centralizadas e comentadas com a seção de origem em
// docs/REGRAS.md — para facilitar auditoria e correção (ver docs/ARQUITETURA.md
// §Constantes de regras).

import type { Nacao } from '../engine/types'

/** Ordem de turno cíclica (docs/REGRAS.md §Nações). */
export const NACOES: readonly Nacao[] = [
  'russia',
  'china',
  'india',
  'brasil',
  'eua',
  'europa',
] as const

// --- Obrigações (docs/REGRAS.md §Obrigações) ---------------------------------
// ⚠️ Linha valor→juros validar contra as cartas físicas antes do Investidor.
// Âncoras confirmadas no manual: valor 12 → juros 5; valor 16 → juros 6.
export const OBRIGACOES: readonly { valor: number; juros: number }[] = [
  { valor: 2, juros: 1 },
  { valor: 4, juros: 2 },
  { valor: 6, juros: 3 },
  { valor: 9, juros: 4 },
  { valor: 12, juros: 5 },
  { valor: 16, juros: 6 },
  { valor: 20, juros: 7 },
  { valor: 25, juros: 8 },
  { valor: 30, juros: 9 },
]

/** Pilha completa de valores de obrigação de cada nação (9 por nação). */
export const VALORES_OBRIGACAO: readonly number[] = OBRIGACOES.map((o) => o.valor)

const JUROS_POR_VALOR = new Map<number, number>(
  OBRIGACOES.map((o) => [o.valor, o.juros]),
)

/** Juros derivados de um valor de obrigação. Lança se o valor não existir. */
export function jurosPorValor(valor: number): number {
  const juros = JUROS_POR_VALOR.get(valor)
  if (juros === undefined) {
    throw new Error(`Valor de obrigação inválido: ${valor}`)
  }
  return juros
}

// --- Fator de Poder (docs/REGRAS.md §Fator de Poder) -------------------------
// Trilha 0–25: 0–4→x0 | 5–9→x1 | 10–14→x2 | 15–19→x3 | 20–24→x4 | 25→x5
export const DEGRAUS_FATOR_PODER: readonly { min: number; fator: number }[] = [
  { min: 0, fator: 0 },
  { min: 5, fator: 1 },
  { min: 10, fator: 2 },
  { min: 15, fator: 3 },
  { min: 20, fator: 4 },
  { min: 25, fator: 5 },
]

// --- Tributação (docs/REGRAS.md §Tabela de Tributação COMPLETA) --------------
// Tabela por DEGRAUS (breakpoints), não por inteiro consecutivo. Um valor de
// tributação usa o degrau imediatamente igual ou inferior (busca do maior
// degrau ≤ valor). Ex: 7 usa o degrau 6; 9 usa o 8; 17 usa o 16; ≥18 usa 18+.
export const DEGRAUS_TRIBUTACAO: readonly {
  min: number
  bonus: number
  pp: number
}[] = [
  { min: 0, bonus: 0, pp: 0 },
  { min: 6, bonus: 1, pp: 1 },
  { min: 8, bonus: 1, pp: 2 },
  { min: 10, bonus: 2, pp: 3 },
  { min: 11, bonus: 2, pp: 4 },
  { min: 12, bonus: 3, pp: 5 },
  { min: 13, bonus: 3, pp: 6 },
  { min: 14, bonus: 4, pp: 7 },
  { min: 15, bonus: 4, pp: 8 },
  { min: 16, bonus: 5, pp: 9 },
  { min: 18, bonus: 5, pp: 10 },
]

/** Fim de jogo ao atingir 25 PP (docs/REGRAS.md §Regras monetárias). */
export const PP_MAXIMO = 25

// --- Capital inicial (docs/REGRAS.md §Capital inicial) -----------------------
// 6/5/4 jogadores: 13 | 3 jogadores: 24 | 2 jogadores: 35.
const CAPITAL_INICIAL = new Map<number, number>([
  [6, 13],
  [5, 13],
  [4, 13],
  [3, 24],
  [2, 35],
])

export function capitalInicial(numJogadores: number): number {
  const capital = CAPITAL_INICIAL.get(numJogadores)
  if (capital === undefined) {
    throw new Error(`Número de jogadores não suportado: ${numJogadores}`)
  }
  return capital
}
