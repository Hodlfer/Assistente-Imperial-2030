import { useState } from 'react'
import type { UseGameResult } from '../../hooks/useGame'
import { FaixaNacoes } from './FaixaNacoes'
import { CartoesJogadores } from './CartoesJogadores'
import { AjusteManual } from './AjusteManual'
import { AcoesFlutuante } from './AcoesFlutuante'
import { PainelHistorico } from '../historico/PainelHistorico'
import { ConfirmarDesfazer } from '../historico/ConfirmarDesfazer'
import { ExportImportModal } from '../persistencia/ExportImportModal'

interface Props {
  jogo: UseGameResult
}

/** Tela principal, aberta durante a partida inteira: exibição fiel do estado
 *  + ajustes manuais de emergência + histórico/undo/export (Sessão 5). */
export function Dashboard({ jogo }: Props) {
  const [ajusteAberto, setAjusteAberto] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [confirmarDesfazer, setConfirmarDesfazer] = useState(false)
  const [exportImportAberto, setExportImportAberto] = useState(false)
  const estado = jogo.estado
  if (!estado) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3 pb-28 sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-100 sm:text-2xl">
          Assistente Imperial 2030
        </h1>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setHistoricoAberto(true)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200"
          >
            Histórico
          </button>
          <button
            type="button"
            onClick={() => setExportImportAberto(true)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200"
          >
            Exportar/Importar
          </button>
          <button
            type="button"
            onClick={() => setAjusteAberto(true)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200"
          >
            Correção manual
          </button>
        </div>
      </header>

      <FaixaNacoes estado={estado} />
      <CartoesJogadores estado={estado} />

      <AjusteManual
        estado={estado}
        jogo={jogo}
        aberto={ajusteAberto}
        onFechar={() => setAjusteAberto(false)}
      />
      <AcoesFlutuante jogo={jogo} onPedirDesfazer={() => setConfirmarDesfazer(true)} />
      <PainelHistorico
        estado={estado}
        jogo={jogo}
        aberto={historicoAberto}
        onFechar={() => setHistoricoAberto(false)}
        onPedirDesfazer={() => setConfirmarDesfazer(true)}
      />
      <ConfirmarDesfazer
        estado={estado}
        jogo={jogo}
        aberto={confirmarDesfazer}
        onFechar={() => setConfirmarDesfazer(false)}
      />
      <ExportImportModal
        estado={estado}
        aberto={exportImportAberto}
        onFechar={() => setExportImportAberto(false)}
        onImportar={(novoEstado) => {
          jogo.carregarEstado(novoEstado)
          setExportImportAberto(false)
        }}
      />
    </div>
  )
}
