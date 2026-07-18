import type { ReactNode } from 'react'

interface Props {
  titulo: string
  onFechar: () => void
  children: ReactNode
  /** Rodapé (normalmente o botão de confirmar). */
  rodape?: ReactNode
  erro?: string | null
  largura?: 'normal' | 'larga'
}

/** Casca comum dos modais de ação: overlay + cartão rolável + cabeçalho, para o
 *  padrão "selecionar nação → inputs → preview → confirmar" (enunciado Sessão 4). */
export function AcaoModal({ titulo, onFechar, children, rodape, erro, largura = 'normal' }: Props) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className={`flex max-h-[92vh] w-full flex-col rounded-xl bg-slate-800 text-sm ${largura === 'larga' ? 'max-w-5xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-slate-100">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md bg-slate-700 px-3 py-1 text-slate-300"
          >
            Fechar
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {erro && (
            <div className="rounded-lg border border-red-600 bg-red-950/40 p-2 text-red-200">
              {erro}
            </div>
          )}
          {children}
        </div>

        {rodape && (
          <div className="flex justify-end gap-2 border-t border-slate-700 p-4">{rodape}</div>
        )}
      </div>
    </div>
  )
}

/** Seção rotulada dentro de um modal de ação. */
export function SecaoAcao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg bg-slate-900/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</h3>
      {children}
    </section>
  )
}
