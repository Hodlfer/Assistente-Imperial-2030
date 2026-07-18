import { useGame } from './hooks/useGame'
import { SetupWizard } from './components/setup/SetupWizard'
import { Dashboard } from './components/dashboard/Dashboard'
import { criarEstadoFixture } from './dev/fixtureDashboard'

function App() {
  const jogo = useGame()

  if (!jogo.estado) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100">
        <SetupWizard jogo={jogo} />
        {import.meta.env.DEV && (
          <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-8">
            <button
              type="button"
              onClick={() => jogo.carregarEstado(criarEstadoFixture())}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-500"
            >
              Carregar exemplo (dev): 6 jogadores
            </button>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <Dashboard jogo={jogo} />
    </main>
  )
}

export default App
