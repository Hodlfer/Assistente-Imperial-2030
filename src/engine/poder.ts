import { DEGRAUS_FATOR_PODER, PP_MAXIMO } from '../data/regras'

/** Fator de Poder de uma nação a partir dos seus Pontos de Poder.
 *  Busca do maior degrau ≤ pontos (docs/REGRAS.md §Fator de Poder). */
export function fatorDePoder(pontos: number): number {
  const p = Math.max(0, Math.min(PP_MAXIMO, pontos))
  let fator = 0
  for (const degrau of DEGRAUS_FATOR_PODER) {
    if (p >= degrau.min) fator = degrau.fator
    else break
  }
  return fator
}
