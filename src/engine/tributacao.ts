import { DEGRAUS_TRIBUTACAO } from '../data/regras'

export interface ResultadoDegrauTributacao {
  /** Bônus militar pago ao governante. */
  bonus: number
  /** Pontos de Poder ganhos pela nação. */
  pp: number
}

/** Bônus ao governante e ganho de PP para um valor de tributação.
 *  Tabela por DEGRAUS: busca do maior degrau ≤ valor — NÃO uma tabela indexada
 *  por inteiro consecutivo (docs/REGRAS.md §Tabela de Tributação COMPLETA).
 *  Ex: 7 usa o degrau 6; 9 usa o 8; 17 usa o 16; ≥18 usa 18+. */
export function bonusEPontosTributacao(valor: number): ResultadoDegrauTributacao {
  const v = Math.max(0, valor)
  let escolhido = DEGRAUS_TRIBUTACAO[0]
  for (const degrau of DEGRAUS_TRIBUTACAO) {
    if (v >= degrau.min) escolhido = degrau
    else break
  }
  return { bonus: escolhido.bonus, pp: escolhido.pp }
}
