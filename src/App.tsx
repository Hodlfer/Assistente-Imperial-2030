import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { usePersistencia } from './hooks/usePersistencia'
import { SetupWizard } from './components/setup/SetupWizard'
import { Dashboard } from './components/dashboard/Dashboard'
import { TelaContinuar } from './components/persistencia/TelaContinuar'
import { TelaMigracao } from './components/persistencia/TelaMigracao'
import { AvisoSalvamento } from './components/persistencia/AvisoSalvamento'
import { ExportImportModal } from './components/persistencia/ExportImportModal'
import { criarEstadoFixture } from './dev/fixtureDashboard'

function App() {
  const jogo = useGame()
  const persistencia = usePersistencia(jogo)
  const [importarAberto, setImportarAberto] = useState(false)

  if (persistencia.carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Carregando partida salva…
      </main>
    )
  }

  if (!jogo.estado) {
    if (persistencia.saveBrutoIncompativel) {
      return (
        <main className="min-h-screen bg-slate-900 text-slate-100">
          <TelaMigracao
            jsonBruto={persistencia.saveBrutoIncompativel}
            onDescartar={() => persistencia.descartarSave()}
          />
        </main>
      )
    }

    if (persistencia.saveEncontrado) {
      return (
        <main className="min-h-screen bg-slate-900 text-slate-100">
          <TelaContinuar
            save={persistencia.saveEncontrado}
            onContinuar={persistencia.continuar}
            onNovaPartida={() => persistencia.descartarSave()}
          />
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-slate-900 text-slate-100">
        <SetupWizard jogo={jogo} />
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-8 sm:px-8">
          <button
            type="button"
            onClick={() => setImportarAberto(true)}
            className="self-start rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-400"
          >
            Importar partida de um arquivo/JSON
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => jogo.carregarEstado(criarEstadoFixture())}
              className="self-start rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-500"
            >
              Carregar exemplo (dev): 6 jogadores
            </button>
          )}
        </div>
        <ExportImportModal
          estado={null}
          aberto={importarAberto}
          onFechar={() => setImportarAberto(false)}
          onImportar={(estado) => {
            jogo.carregarEstado(estado)
            setImportarAberto(false)
          }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {persistencia.avisoSalvamento && <AvisoSalvamento mensagem={persistencia.avisoSalvamento} />}
      <Dashboard jogo={jogo} />
    </main>
  )
}

export default App
