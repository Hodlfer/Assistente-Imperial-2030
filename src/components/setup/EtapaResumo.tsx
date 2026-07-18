import { useMemo } from 'react'
import type { UseGameResult } from '../../hooks/useGame'
import { estadoInicialComGovernos } from '../../hooks/useGame'
import { CORES_NACAO } from '../../data/cores'
import type { JogadorDraft, ObrigacoesEscolhidas } from './modelo'
import { NACOES, construirJogadoresEngine, construirNacoesParciais } from './modelo'

interface Props {
  jogadores: JogadorDraft[]
  capital: number
  obrigacoes: ObrigacoesEscolhidas
  cartaInvestidorId: string | null
  jogo: UseGameResult
  onVoltar: () => void
}

export function EtapaResumo({
  jogadores,
  capital,
  obrigacoes,
  cartaInvestidorId,
  jogo,
  onVoltar,
}: Props) {
  const jogadoresEngine = useMemo(
    () => construirJogadoresEngine(jogadores, capital, obrigacoes, cartaInvestidorId),
    [jogadores, capital, obrigacoes, cartaInvestidorId],
  )
  const nacoesParciais = useMemo(
    () => construirNacoesParciais(obrigacoes),
    [obrigacoes],
  )
  const previa = useMemo(
    () => estadoInicialComGovernos(jogadoresEngine, nacoesParciais),
    [jogadoresEngine, nacoesParciais],
  )

  function iniciar() {
    jogo.iniciarPartida(jogadoresEngine, nacoesParciais)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Resumo</h2>
        <p className="mt-1 text-slate-400">
          Confira os governos calculados e os saldos antes de iniciar a
          partida.
        </p>
      </div>

      {jogo.erro && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-600 bg-red-950/40 p-4 text-red-200">
          <p>{jogo.erro}</p>
          <button
            type="button"
            onClick={jogo.limparErro}
            className="shrink-0 rounded-lg bg-red-900/60 px-3 py-1 text-sm"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-slate-800">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="text-slate-400">
              <th className="p-3">Jogador</th>
              <th className="p-3">Dinheiro</th>
              <th className="p-3">Obrigações</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {previa.jogadores.map((jogador) => (
              <tr key={jogador.id} className="border-t border-slate-700">
                <td className="p-3 font-medium text-slate-100">
                  {jogador.nome}
                </td>
                <td className="p-3 text-slate-200">{jogador.dinheiro}</td>
                <td className="p-3 text-slate-300">
                  {jogador.obrigacoes.length === 0
                    ? '—'
                    : jogador.obrigacoes
                        .map((o) => `${CORES_NACAO[o.nacao].nome} ${o.valor}`)
                        .join(', ')}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {jogador.temCartaInvestidor && (
                      <span className="rounded-full bg-sky-900/60 px-2 py-1 text-xs font-medium text-sky-200">
                        Carta de Investidor
                      </span>
                    )}
                    {jogador.temBancoSuico && (
                      <span className="rounded-full bg-emerald-900/60 px-2 py-1 text-xs font-medium text-emerald-200">
                        Banco Suíço
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl bg-slate-800">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="text-slate-400">
              <th className="p-3">Nação</th>
              <th className="p-3">Tesouro</th>
              <th className="p-3">Governo</th>
            </tr>
          </thead>
          <tbody>
            {NACOES.map((nacao) => {
              const cor = CORES_NACAO[nacao]
              const estadoNacao = previa.nacoes[nacao]
              const governante = previa.jogadores.find(
                (j) => j.id === estadoNacao.governanteId,
              )
              return (
                <tr key={nacao} className="border-t border-slate-700">
                  <td className={`p-3 font-medium ${cor.texto}`}>
                    {cor.nome}
                  </td>
                  <td className="p-3 text-slate-200">
                    {estadoNacao.tesouro}
                  </td>
                  <td className="p-3 text-slate-300">
                    {governante ? governante.nome : 'Sem governo'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onVoltar}
          className="rounded-xl bg-slate-700 px-8 py-4 text-lg font-semibold text-slate-100"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={iniciar}
          className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white"
        >
          Iniciar partida
        </button>
      </div>
    </div>
  )
}
