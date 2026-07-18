import { useMemo, useState } from 'react'
import type { Estado } from '../../engine'
import type { UseGameResult } from '../../hooks/useGame'
import { construirHistorico, detalhesDaTransacao, type LinhaHistorico } from './modelo'

interface Props {
  estado: Estado
  jogo: UseGameResult
  aberto: boolean
  onFechar: () => void
  /** Abre a confirmação de desfazer (compartilhada com o botão de ações). */
  onPedirDesfazer: () => void
}

function LinhaExpandivel({ linha, estado }: { linha: LinhaHistorico; estado: Estado }) {
  const [expandido, setExpandido] = useState(false)
  const detalhes = useMemo(
    () => (expandido ? detalhesDaTransacao(estado, linha.indice) : null),
    [expandido, estado, linha.indice],
  )

  return (
    <li
      className={`rounded-lg border p-2 text-sm ${
        linha.ehAjusteManual
          ? 'border-amber-600 bg-amber-950/30'
          : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
        className="flex w-full flex-col items-start gap-1 text-left"
      >
        <span className="text-slate-100">
          <span className="font-mono text-xs text-slate-500">#{linha.indice}</span>{' '}
          <span className="font-semibold">{linha.titulo}</span>
        </span>
        {linha.flags.length > 0 && (
          <span className="text-xs text-slate-400">{linha.flags.join(' · ')}</span>
        )}
        {linha.ehAjusteManual && linha.motivo && (
          <span className="text-xs italic text-amber-300">Motivo: {linha.motivo}</span>
        )}
      </button>

      {expandido && detalhes && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-slate-700 pt-2 text-xs text-slate-400">
          {detalhes.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** Painel lateral (gaveta inferior em telas pequenas) com o log de transações
 *  em ordem reversa (docs da Sessão 5, item 1). */
export function PainelHistorico({ estado, jogo, aberto, onFechar, onPedirDesfazer }: Props) {
  const linhas = useMemo(() => (aberto ? construirHistorico(estado) : []), [aberto, estado])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/50">
      <div className="flex h-[75vh] w-full flex-col gap-3 self-end rounded-t-xl bg-slate-800 p-4 sm:h-full sm:w-96 sm:self-auto sm:rounded-t-none sm:rounded-l-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Histórico</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md bg-slate-700 px-3 py-1 text-sm text-slate-300"
          >
            Fechar
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPedirDesfazer}
            disabled={!jogo.podeDesfazer}
            className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={() => jogo.refazer()}
            disabled={!jogo.podeRefazer}
            className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            Refazer
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {linhas.map((linha) => (
            <LinhaExpandivel key={linha.indice} linha={linha} estado={estado} />
          ))}
        </ul>
      </div>
    </div>
  )
}
