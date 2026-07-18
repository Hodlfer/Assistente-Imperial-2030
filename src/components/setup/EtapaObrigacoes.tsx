import { useState } from 'react'
import type { Nacao } from '../../engine'
import { capitalInicial } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import type { JogadorDraft, ObrigacoesEscolhidas } from './modelo'
import { NACOES, VALORES_OBRIGACAO, totalDaNacao, totalEscolhidoPeloJogador } from './modelo'

interface Props {
  jogadores: JogadorDraft[]
  obrigacoes: ObrigacoesEscolhidas
  onMudar: (obrigacoes: ObrigacoesEscolhidas) => void
  onAvancar: () => void
  onVoltar: () => void
}

export function EtapaObrigacoes({
  jogadores,
  obrigacoes,
  onMudar,
  onAvancar,
  onVoltar,
}: Props) {
  const [jogadorAtivoId, setJogadorAtivoId] = useState(jogadores[0]?.id ?? '')
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const capital = capitalInicial(jogadores.length)

  function alternar(nacao: Nacao, valor: number) {
    const dono = obrigacoes[nacao][valor]
    if (dono && dono !== jogadorAtivoId) return // pertence a outro jogador

    const proximaNacao = { ...obrigacoes[nacao] }
    if (dono === jogadorAtivoId) {
      delete proximaNacao[valor]
    } else {
      proximaNacao[valor] = jogadorAtivoId
    }
    onMudar({ ...obrigacoes, [nacao]: proximaNacao })
  }

  const saldos = jogadores.map((jogador) => ({
    jogador,
    saldo: capital - totalEscolhidoPeloJogador(obrigacoes, jogador.id),
  }))
  const foraDoAlvo = saldos.filter(({ saldo }) => saldo !== 2)

  function tentarAvancar() {
    if (foraDoAlvo.length > 0) {
      setMostrarAviso(true)
      return
    }
    onAvancar()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">
          Obrigações iniciais
        </h2>
        <p className="mt-1 text-slate-400">
          O sorteio das cartas de controle acontece na mesa física — aqui
          você só registra o que cada jogador comprou. Escolha o jogador
          abaixo e toque nas obrigações que ele possui.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {saldos.map(({ jogador, saldo }) => (
          <button
            key={jogador.id}
            type="button"
            onClick={() => setJogadorAtivoId(jogador.id)}
            aria-pressed={jogador.id === jogadorAtivoId}
            className={`rounded-xl px-4 py-3 text-left ${
              jogador.id === jogadorAtivoId
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            <div className="font-semibold">{jogador.nome}</div>
            <div
              className={`text-sm ${
                saldo === 2
                  ? 'text-emerald-300'
                  : saldo < 0
                    ? 'text-red-300'
                    : 'text-amber-300'
              }`}
            >
              sobra {saldo}
            </div>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-slate-800">
        <table className="w-full min-w-[640px] border-collapse text-center">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400">Nação</th>
              {VALORES_OBRIGACAO.map((valor) => (
                <th key={valor} className="p-2 text-slate-400">
                  {valor}
                </th>
              ))}
              <th className="p-2 text-slate-400">Tesouro</th>
            </tr>
          </thead>
          <tbody>
            {NACOES.map((nacao) => {
              const cor = CORES_NACAO[nacao]
              return (
                <tr key={nacao} className="border-t border-slate-700">
                  <th className={`p-2 text-left font-medium ${cor.texto}`}>
                    {cor.nome}
                  </th>
                  {VALORES_OBRIGACAO.map((valor) => {
                    const dono = obrigacoes[nacao][valor]
                    const donoJogador = jogadores.find((j) => j.id === dono)
                    const ativa = dono === jogadorAtivoId
                    return (
                      <td key={valor} className="p-1">
                        <button
                          type="button"
                          onClick={() => alternar(nacao, valor)}
                          disabled={Boolean(dono) && !ativa}
                          aria-pressed={ativa}
                          aria-label={`Obrigação ${valor} de ${cor.nome}${
                            donoJogador
                              ? `, comprada por ${donoJogador.nome}`
                              : ', disponível'
                          }`}
                          className={`flex h-12 w-full min-w-12 items-center justify-center rounded-lg text-sm font-semibold ${
                            ativa
                              ? cor.bg
                              : dono
                                ? 'bg-slate-900 text-slate-600'
                                : 'bg-slate-700 text-slate-200'
                          } disabled:opacity-60`}
                        >
                          {valor}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-2 font-semibold text-slate-200">
                    {totalDaNacao(obrigacoes, nacao)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mostrarAviso && (
        <div className="rounded-xl border border-amber-600 bg-amber-950/40 p-4">
          <p className="font-semibold text-amber-300">
            Nem todo jogador ficou com exatamente 2 milhões de sobra:
          </p>
          <ul className="mt-2 list-disc pl-6 text-amber-200">
            {foraDoAlvo.map(({ jogador, saldo }) => (
              <li key={jogador.id}>
                {jogador.nome}: sobra {saldo}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-amber-200">
            Alguns grupos usam variantes — você pode prosseguir mesmo assim.
          </p>
          <div className="mt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setMostrarAviso(false)}
              className="rounded-lg bg-slate-700 px-4 py-3 text-slate-100"
            >
              Corrigir
            </button>
            <button
              type="button"
              onClick={onAvancar}
              className="rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white"
            >
              Prosseguir assim mesmo
            </button>
          </div>
        </div>
      )}

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
          onClick={tentarAvancar}
          className="rounded-xl bg-sky-600 px-8 py-4 text-lg font-semibold text-white"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
