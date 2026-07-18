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
import { usePreferencias } from './hooks/usePreferencias'
import { useWakeLock } from './hooks/useWakeLock'
import { AtualizacaoDisponivel } from './components/pwa/AtualizacaoDisponivel'

function App() {
  const jogo = useGame()
  const persistencia = usePersistencia(jogo)
  const [importarAberto, setImportarAberto] = useState(false)
  const { preferencias, atualizar } = usePreferencias()
  useWakeLock(preferencias.manterTelaLigada)

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
        <main className={`min-h-screen bg-slate-900 text-slate-100 ${preferencias.tema === 'claro' ? 'theme-light' : 'theme-dark'}`}>
          <TelaMigracao
            jsonBruto={persistencia.saveBrutoIncompativel}
            onDescartar={() => persistencia.descartarSave()}
          />
        </main>
      )
    }

    if (persistencia.saveEncontrado) {
      return (
        <main className={`min-h-screen bg-slate-900 text-slate-100 ${preferencias.tema === 'claro' ? 'theme-light' : 'theme-dark'}`}>
          <TelaContinuar
            save={persistencia.saveEncontrado}
            onContinuar={persistencia.continuar}
            onNovaPartida={() => persistencia.descartarSave()}
          />
        </main>
      )
    }

    return (
      <main className={`min-h-screen bg-slate-900 text-slate-100 ${preferencias.tema === 'claro' ? 'theme-light' : 'theme-dark'}`}>
        <SetupWizard jogo={jogo} />
        <Preferencias controles={preferencias} atualizar={atualizar} />
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
    <main className={`min-h-screen bg-slate-900 text-slate-100 ${preferencias.tema === 'claro' ? 'theme-light' : 'theme-dark'}`}>
      {persistencia.avisoSalvamento && <AvisoSalvamento mensagem={persistencia.avisoSalvamento} />}
      {persistencia.avisoMigracao && <AvisoSalvamento mensagem={persistencia.avisoMigracao} />}
      <Dashboard
        jogo={jogo}
        preferencias={preferencias}
        atualizarPreferencias={atualizar}
        onNovaPartida={async () => {
          await persistencia.descartarSave()
          jogo.reiniciar()
        }}
      />
      <AtualizacaoDisponivel />
    </main>
  )
}

function Preferencias({ controles, atualizar }: { controles: ReturnType<typeof usePreferencias>['preferencias']; atualizar: (p: Partial<ReturnType<typeof usePreferencias>['preferencias']>) => void }) {
  return <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pb-4 text-sm"><button type="button" onClick={() => atualizar({ tema: controles.tema === 'escuro' ? 'claro' : 'escuro' })} className="min-h-11 rounded-lg bg-slate-700 px-3">{controles.tema === 'escuro' ? '☀️ Tema claro' : '🌙 Tema escuro'}</button><button type="button" aria-pressed={controles.manterTelaLigada} onClick={() => atualizar({ manterTelaLigada: !controles.manterTelaLigada })} className="min-h-11 rounded-lg bg-slate-700 px-3">{controles.manterTelaLigada ? '✓ Manter tela ligada' : 'Manter tela ligada'}</button></div>
}

export default App
