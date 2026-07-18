import { useGame } from './hooks/useGame'
import { SetupWizard } from './components/setup/SetupWizard'

function App() {
  const jogo = useGame()

  if (!jogo.estado) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100">
        <SetupWizard jogo={jogo} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
      <h1 className="text-3xl font-semibold sm:text-5xl">
        Assistente Imperial 2030
      </h1>
      <p className="text-slate-400">
        Partida iniciada com {jogo.estado.jogadores.length} jogadores.
      </p>
    </main>
  )
}

export default App
