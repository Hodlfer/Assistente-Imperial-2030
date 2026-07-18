import { useState } from 'react'

// Nomes de ações do rondel citadas em docs/REGRAS.md, mais as ações clássicas
// de Imperial ainda não documentadas em detalhe. Todas desabilitadas — a
// implementação (e a ordem exata do rondel) fica para a Sessão 4.
const ACOES_RONDEL = ['Produção', 'Manobra', 'Importação', 'Investidor', 'Tributação', 'Fábrica']

export function AcoesFlutuante() {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      {aberto && (
        <div className="flex flex-col gap-2 rounded-xl bg-slate-800 p-3 shadow-lg">
          <p className="px-1 text-xs text-slate-400">Ações do rondel — sessão 4</p>
          {ACOES_RONDEL.map((acao) => (
            <button
              key={acao}
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-slate-700 px-4 py-2 text-left text-sm text-slate-400 opacity-60"
            >
              {acao}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="rounded-full bg-sky-600 px-6 py-4 text-lg font-semibold text-white shadow-lg"
      >
        Ações
      </button>
    </div>
  )
}
