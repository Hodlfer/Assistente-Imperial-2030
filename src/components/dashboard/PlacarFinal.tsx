import { useState } from 'react'
import type { EntradaClassificacao, Estado } from '../../engine'
import { classificacaoFinal, nacoesEncerrando } from '../../engine'
import { NOMES_NACAO } from '../../data/regras'
import type { UseGameResult } from '../../hooks/useGame'

interface Props {
  estado: Estado
  jogo: UseGameResult
  onFechar: () => void
  onNovaPartida: () => void
}

/** Tela de pontuação final (enunciado Sessão 6, itens 2–4): detalhamento por
 *  obrigação, subtotal + dinheiro = total, ranking com destaque do vencedor,
 *  critério de desempate, e pós-jogo (undo do fim + nova partida). */
export function PlacarFinal({ estado, jogo, onFechar, onNovaPartida }: Props) {
  const [confirmarNova, setConfirmarNova] = useState(false)
  const classificacao = classificacaoFinal(estado)
  const encerrando = nacoesEncerrando(estado)
  const posicaoVencedora = classificacao[0]?.posicao
  const vencedores = classificacao.filter((e) => e.posicao === posicaoVencedora)
  const empateNoTopo = vencedores.length > 1

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-4">
      <div className="my-4 flex w-full max-w-2xl flex-col gap-4 rounded-xl bg-slate-800 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">🏁 Placar final</h2>
            <p className="mt-1 text-sm text-slate-400">
              {encerrando.map((n) => NOMES_NACAO[n]).join(' e ')}{' '}
              {encerrando.length > 1 ? 'atingiram' : 'atingiu'} 25 Pontos de Poder — a partida
              terminou.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="shrink-0 rounded-md bg-slate-700 px-3 py-1 text-sm text-slate-300"
          >
            Fechar
          </button>
        </header>

        <div
          className={`rounded-lg p-3 text-center ${
            empateNoTopo ? 'bg-amber-950/40 text-amber-200' : 'bg-emerald-950/40 text-emerald-200'
          }`}
        >
          {empateNoTopo ? (
            <p className="text-lg font-semibold">
              Empate entre {vencedores.map((e) => e.jogador.nome).join(', ')} —{' '}
              {vencedores[0].detalhe.total} pts
            </p>
          ) : (
            <p className="text-lg font-semibold">
              🏆 {vencedores[0].jogador.nome} venceu com {vencedores[0].detalhe.total} pts
            </p>
          )}
        </div>

        <ol className="flex flex-col gap-3">
          {classificacao.map((entrada) => (
            <LinhaJogador key={entrada.jogador.id} entrada={entrada} vencedor={entrada.posicao === posicaoVencedora} />
          ))}
        </ol>

        <div className="flex flex-col gap-2 border-t border-slate-700 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={jogo.desfazer}
            disabled={!jogo.podeDesfazer}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
          >
            Desfazer fim de jogo
          </button>

          {!confirmarNova ? (
            <button
              type="button"
              onClick={() => setConfirmarNova(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Nova partida
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-red-700 bg-red-950/30 p-3">
              <p className="text-sm text-red-200">
                Isso encerra e descarta esta partida. Exporte o JSON antes se quiser guardá-la.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmarNova(false)}
                  className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onNovaPartida}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Descartar e começar nova
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LinhaJogador({
  entrada,
  vencedor,
}: {
  entrada: EntradaClassificacao
  vencedor: boolean
}) {
  const { detalhe, posicao, desempate, empateReal } = entrada
  return (
    <li
      className={`rounded-lg border p-3 ${
        vencedor ? 'border-emerald-600 bg-emerald-950/20' : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-400">{posicao}º</span>
          <span className="text-lg font-semibold text-slate-100">{detalhe.jogador.nome}</span>
          {empateReal && (
            <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-xs text-amber-200">
              empate
            </span>
          )}
        </span>
        <span className="text-xl font-bold text-slate-100">{detalhe.total}</span>
      </div>

      {detalhe.obrigacoes.length > 0 ? (
        <table className="mt-2 w-full text-sm text-slate-300">
          <tbody>
            {detalhe.obrigacoes.map((o, i) => (
              <tr key={`${o.nacao}-${o.valor}-${i}`}>
                <td className="py-0.5 text-slate-400">
                  {NOMES_NACAO[o.nacao]} {o.valor}
                </td>
                <td className="py-0.5 text-right tabular-nums">
                  {o.juros} × {o.fator} ={' '}
                  <span className="font-semibold text-slate-100">{o.pontos}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Sem obrigações.</p>
      )}

      <div className="mt-2 flex justify-between border-t border-slate-700 pt-1 text-sm text-slate-300">
        <span className="text-slate-400">
          Subtotal obrigações {detalhe.subtotalObrigacoes} + dinheiro {detalhe.dinheiro}
        </span>
        <span className="font-semibold text-slate-100">= {detalhe.total}</span>
      </div>

      {desempate && (
        <p className="mt-1 text-xs text-sky-300">
          Ficou à frente por desempate pela {NOMES_NACAO[desempate.nacao]} ({desempate.pontosPoder}{' '}
          PP)
        </p>
      )}
    </li>
  )
}
