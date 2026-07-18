import { useRegisterSW } from 'virtual:pwa-register/react'

export function AtualizacaoDisponivel() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()
  if (!needRefresh[0]) return null
  return <div role="status" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl bg-indigo-700 p-3 text-sm text-white shadow-xl">
    <span>Nova versão disponível.</span>
    <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-11 rounded-lg bg-white px-3 font-semibold text-indigo-800">Recarregar</button>
  </div>
}
