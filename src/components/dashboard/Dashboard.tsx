import { useState } from 'react'
import type { PreferenciasMesa } from '../../hooks/usePreferencias'
import { jogoTerminou } from '../../engine'
import type { UseGameResult } from '../../hooks/useGame'
import { FaixaNacoes } from './FaixaNacoes'
import { CartoesJogadores } from './CartoesJogadores'
import { AjusteManual } from './AjusteManual'
import { AcoesFlutuante } from './AcoesFlutuante'
import { PlacarFinal } from './PlacarFinal'
import { PainelHistorico } from '../historico/PainelHistorico'
import { ConfirmarDesfazer } from '../historico/ConfirmarDesfazer'
import { ExportImportModal } from '../persistencia/ExportImportModal'
import { Estatisticas } from './Estatisticas'

interface Props {
  jogo: UseGameResult
  /** Encerra a partida e volta ao wizard (App descarta o save; enunciado
   *  Sessão 6, item 4). */
  onNovaPartida: () => void
  preferencias?: PreferenciasMesa
  atualizarPreferencias?: (parcial: Partial<PreferenciasMesa>) => void
}

/** Tela principal, aberta durante a partida inteira: exibição fiel do estado
 *  + ajustes manuais de emergência + histórico/undo/export (Sessão 5) + placar
 *  final e pós-jogo (Sessão 6). */
export function Dashboard({ jogo, onNovaPartida, preferencias = { tema: 'escuro', ocultarDinheiro: false, manterTelaLigada: false }, atualizarPreferencias = () => {} }: Props) {
  const [ajusteAberto, setAjusteAberto] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [confirmarDesfazer, setConfirmarDesfazer] = useState(false)
  const [exportImportAberto, setExportImportAberto] = useState(false)
  const [placarFechado, setPlacarFechado] = useState(false)
  const [estatisticasAbertas, setEstatisticasAbertas] = useState(false)
  const [terminouAnterior, setTerminouAnterior] = useState(false)
  const estado = jogo.estado

  const terminou = !!estado && jogoTerminou(estado)

  // Ajuste de estado durante o render (padrão recomendado do React): ao voltar
  // abaixo de 25 PP (undo do fim de jogo), reabilita a exibição automática do
  // placar para um eventual novo encerramento.
  if (terminou !== terminouAnterior) {
    setTerminouAnterior(terminou)
    if (!terminou) setPlacarFechado(false)
  }

  if (!estado) return null

  const placarAberto = terminou && !placarFechado

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3 pb-28 sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-100 sm:text-2xl">
          Assistente Imperial 2030
        </h1>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button type="button" onClick={() => atualizarPreferencias({ tema: preferencias.tema === 'escuro' ? 'claro' : 'escuro' })} className="min-h-11 rounded-lg bg-slate-700 px-3 text-sm font-medium text-slate-200">{preferencias.tema === 'escuro' ? '☀️ Tema' : '🌙 Tema'}</button>
          <button type="button" aria-pressed={preferencias.ocultarDinheiro} onClick={() => atualizarPreferencias({ ocultarDinheiro: !preferencias.ocultarDinheiro })} className="min-h-11 rounded-lg bg-slate-700 px-3 text-sm font-medium text-slate-200">{preferencias.ocultarDinheiro ? 'Mostrar dinheiro' : 'Ocultar dinheiro'}</button>
          <button type="button" aria-pressed={preferencias.manterTelaLigada} onClick={() => atualizarPreferencias({ manterTelaLigada: !preferencias.manterTelaLigada })} className="min-h-11 rounded-lg bg-slate-700 px-3 text-sm font-medium text-slate-200">{preferencias.manterTelaLigada ? '✓ Tela ligada' : 'Tela ligada'}</button>
          <button type="button" onClick={() => setEstatisticasAbertas(true)} className="min-h-11 rounded-lg bg-slate-700 px-3 text-sm font-medium text-slate-200">Estatísticas</button>
          {terminou && (
            <button
              type="button"
              onClick={() => setPlacarFechado(false)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              🏁 Placar final
            </button>
          )}
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
      <CartoesJogadores estado={estado} ocultarDinheiro={preferencias.ocultarDinheiro} />

      <Estatisticas estado={estado} aberto={estatisticasAbertas} onFechar={() => setEstatisticasAbertas(false)} />
      <AjusteManual
        estado={estado}
        jogo={jogo}
        aberto={ajusteAberto}
        onFechar={() => setAjusteAberto(false)}
      />
      <AcoesFlutuante
        jogo={jogo}
        bloqueado={terminou}
        onPedirDesfazer={() => setConfirmarDesfazer(true)}
      />
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
      {placarAberto && (
        <PlacarFinal
          estado={estado}
          jogo={jogo}
          onFechar={() => setPlacarFechado(true)}
          onNovaPartida={onNovaPartida}
        />
      )}
    </div>
  )
}
