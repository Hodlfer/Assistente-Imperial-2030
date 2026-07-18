interface Props {
  jsonBruto: string
  onDescartar: () => void
}

function baixar(jsonBruto: string) {
  const blob = new Blob([jsonBruto], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'imperial-2030-save-incompativel.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Save com `schemaVersion` desconhecida: em vez de tentar reconstruir (e
 *  quebrar), oferece o JSON bruto para export (enunciado da Sessão 5, item 3
 *  — "Migração"). */
export function TelaMigracao({ jsonBruto, onDescartar }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-100">Assistente Imperial 2030</h1>

      <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-800 p-5 text-left">
        <p className="text-slate-200">
          O save salvo neste dispositivo usa uma versão de dados que este app não reconhece
          mais. Para não perder nada, baixe o backup bruto abaixo antes de começar uma nova
          partida.
        </p>
        <button
          type="button"
          onClick={() => baixar(jsonBruto)}
          className="rounded-lg bg-slate-700 px-4 py-3 font-semibold text-slate-100"
        >
          Baixar JSON bruto
        </button>
        <button
          type="button"
          onClick={onDescartar}
          className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Já baixei — começar nova partida
        </button>
      </div>
    </div>
  )
}
