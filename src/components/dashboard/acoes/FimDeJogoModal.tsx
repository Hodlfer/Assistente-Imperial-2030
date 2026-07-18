import type { Nacao } from '../../../engine'
import { NOMES_NACAO } from '../../../data/regras'
import { AcaoModal } from './AcaoModal'

interface Props {
  nacao: Nacao
  onFechar: () => void
}

/** Placeholder do fim de jogo: uma nação atingiu 25 PP. A pontuação final entra
 *  na Sessão 6 (enunciado Sessão 4, item 3). */
export function FimDeJogoModal({ nacao, onFechar }: Props) {
  return (
    <AcaoModal
      titulo="Fim de jogo"
      onFechar={onFechar}
      rodape={
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-slate-100"
        >
          Entendi
        </button>
      }
    >
      <p className="text-slate-200">
        <span className="font-semibold">{NOMES_NACAO[nacao]}</span> atingiu 25 Pontos de Poder —
        o jogo terminou.
      </p>
      <p className="text-slate-400">A pontuação final chega na sessão 6.</p>
    </AcaoModal>
  )
}
