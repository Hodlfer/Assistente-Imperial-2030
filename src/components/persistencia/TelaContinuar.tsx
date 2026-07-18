import { useState } from 'react'
import type { PartidaSalva } from '../../persistence/tipos'

interface Props {
  save: PartidaSalva
  onContinuar: () => void
  onNovaPartida: () => void
}

function formatarData(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/** Tela inicial quando há uma partida salva (enunciado da Sessão 5, item 3):
 *  "Continuar partida de [data] ([n] transações)" vs "Nova partida", com
 *  confirmação antes de descartar o save existente. */
export function TelaContinuar({ save, onContinuar, onNovaPartida }: Props) {
  const [confirmarNova, setConfirmarNova] = useState(false)
  const numTransacoes = Math.max(0, save.estado.transacoes.length - 1)

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-100">Assistente Imperial 2030</h1>

      <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-800 p-5">
        <p className="text-slate-200">
          Partida salva de <strong>{formatarData(save.salvoEm)}</strong>
        </p>
        <p className="text-sm text-slate-400">
          {numTransacoes} {numTransacoes === 1 ? 'transação registrada' : 'transações registradas'}
        </p>

        <button
          type="button"
          onClick={onContinuar}
          className="mt-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Continuar partida
        </button>

        {!confirmarNova ? (
          <button
            type="button"
            onClick={() => setConfirmarNova(true)}
            className="rounded-lg border border-slate-600 px-4 py-3 text-slate-300"
          >
            Nova partida
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-red-700 bg-red-950/30 p-3">
            <p className="text-sm text-red-200">
              Isso descarta a partida salva acima permanentemente. Exporte o JSON antes se
              quiser guardá-la.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarNova(false)}
                className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onNovaPartida}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white"
              >
                Descartar e começar nova
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
