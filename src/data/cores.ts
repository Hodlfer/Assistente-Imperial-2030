// Tokens de cor das nações, centralizados para uso consistente em todo o app
// (docs/REGRAS.md §Nações, docs/ARQUITETURA.md §Constantes de regras).
// Classes Tailwind literais (não interpoladas) para serem detectadas pelo scanner.

import type { Nacao } from '../engine/types'

export interface CorNacao {
  nome: string
  /** Fundo sólido + texto legível sobre ele (chips, botões selecionados). */
  bg: string
  /** Texto na cor da nação sobre fundo neutro. */
  texto: string
  /** Borda na cor da nação (cards, seleção). */
  borda: string
  /** Fundo suave para áreas maiores (linhas de tabela, painéis). */
  bgSuave: string
  /** Valor hex bruto, para casos sem Tailwind (ex.: SVG, canvas). */
  hex: string
}

export const CORES_NACAO: Record<Nacao, CorNacao> = {
  russia: {
    nome: 'Rússia',
    bg: 'bg-violet-600 text-white',
    texto: 'text-violet-400',
    borda: 'border-violet-500',
    bgSuave: 'bg-violet-950/40',
    hex: '#7c3aed',
  },
  china: {
    nome: 'China',
    bg: 'bg-yellow-400 text-slate-900',
    texto: 'text-yellow-400',
    borda: 'border-yellow-400',
    bgSuave: 'bg-yellow-900/30',
    hex: '#facc15',
  },
  india: {
    nome: 'Índia',
    bg: 'nation-india-solid',
    texto: 'nation-india-text',
    borda: 'nation-india-border',
    bgSuave: 'nation-india-soft',
    hex: '#a8b1bd',
  },
  brasil: {
    nome: 'Brasil',
    bg: 'bg-green-600 text-white',
    texto: 'text-green-400',
    borda: 'border-green-500',
    bgSuave: 'bg-green-950/40',
    hex: '#16a34a',
  },
  eua: {
    nome: 'EUA',
    bg: 'bg-red-600 text-white',
    texto: 'text-red-400',
    borda: 'border-red-500',
    bgSuave: 'bg-red-950/40',
    hex: '#dc2626',
  },
  europa: {
    nome: 'Europa',
    bg: 'bg-blue-600 text-white',
    texto: 'text-blue-400',
    borda: 'border-blue-500',
    bgSuave: 'bg-blue-950/40',
    hex: '#2563eb',
  },
}
