import type { Estado } from '../../engine'
import type { UseGameResult } from '../../hooks/useGame'
import { AcaoModal } from '../dashboard/acoes/AcaoModal'
import { resumoParaDesfazer } from './modelo'

interface Props {
  estado: Estado
  jogo: UseGameResult
  aberto: boolean
  onFechar: () => void
}

/** Confirmação do desfazer: mostra o que será revertido antes de aplicar
 *  (docs da Sessão 5, item 2 — "com confirmação mostrando o que será
 *  revertido"). A transação inteira é desfeita de uma vez, nunca por etapas. */
export function ConfirmarDesfazer({ estado, jogo, aberto, onFechar }: Props) {
  if (!aberto) return null
  const linha = resumoParaDesfazer(estado)
  if (!linha) return null

  function confirmar() {
    jogo.desfazer()
    onFechar()
  }

  return (
    <AcaoModal
      titulo="Desfazer última ação"
      onFechar={onFechar}
      rodape={
        <>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg bg-slate-700 px-4 py-2 text-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Desfazer
          </button>
        </>
      }
    >
      <p className="text-slate-300">Isto vai reverter a transação inteira:</p>
      <div className="rounded-lg bg-slate-900/50 p-3">
        <p className="font-semibold text-slate-100">
          #{linha.indice} · {linha.titulo}
        </p>
        {linha.flags.length > 0 && (
          <p className="mt-1 text-sm text-slate-400">{linha.flags.join(' · ')}</p>
        )}
        {linha.ehAjusteManual && linha.motivo && (
          <p className="mt-1 text-sm italic text-amber-300">Motivo: {linha.motivo}</p>
        )}
      </div>
    </AcaoModal>
  )
}
