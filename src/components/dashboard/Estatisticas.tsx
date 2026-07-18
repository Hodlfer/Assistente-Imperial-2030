import type { Estado } from '../../engine'
import { classificacaoFinal, preverTributacao } from '../../engine'
import { NACOES } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import {
  controleFinanceiro,
  distribuicaoTerritorial,
  type FatiaGrafico,
} from './estatisticasModelo'

interface Props { estado: Estado; aberto: boolean; onFechar: () => void }

export function Estatisticas({ estado, aberto, onFechar }: Props) {
  if (!aberto) return null
  const territorios = distribuicaoTerritorial(estado)
  const tributacoes = NACOES.map((nacao) => ({
    nacao,
    previa: preverTributacao(estado, nacao),
    situacao: estado.nacoes[nacao].situacao,
  }))
  const maiorTributo = Math.max(1, ...tributacoes.map((item) => item.previa.resultado.tributacao))
  const ranking = classificacaoFinal(estado)

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/70 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Estatísticas da partida">
      <section className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-t-2xl bg-slate-800 p-4 shadow-2xl sm:rounded-2xl sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Estatísticas da partida</h2>
            <p className="text-sm text-slate-400">Fotografia atual do mapa e dos investimentos.</p>
          </div>
          <button type="button" onClick={onFechar} className="min-h-11 rounded-lg bg-slate-700 px-4 text-slate-200">Fechar</button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(420px,1.4fr)]">
          <Painel titulo="Territórios controlados">
            <Pizza titulo="Distribuição dos 38 territórios neutros" fatias={territorios} tamanho="grande" />
          </Painel>

          <Painel titulo="Tributação projetada">
            <div className="flex flex-col gap-3" role="img" aria-label="Tributação bruta por nação, dividida entre custo militar e saldo">
              {tributacoes.map(({ nacao, previa, situacao }) => {
                const bruto = previa.resultado.tributacao
                const largura = (bruto / maiorTributo) * 100
                const militar = bruto > 0 ? (previa.consumoDoTributo / bruto) * 100 : 0
                return (
                  <div key={nacao} className="grid grid-cols-[72px_1fr] items-center gap-2 text-xs">
                    <span className={`font-semibold ${CORES_NACAO[nacao].texto}`}>{CORES_NACAO[nacao].nome}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 flex-1 rounded bg-slate-700/70">
                          <div className="flex h-full min-w-1 overflow-hidden rounded" style={{ width: `${largura}%` }}>
                            <span className="h-full bg-red-500/80" style={{ width: `${militar}%` }} title={`${previa.consumoDoTributo} consumidos por unidades`} />
                            <span className="h-full bg-emerald-500/80" style={{ width: `${100 - militar}%` }} title={`${previa.saldoTributoAposMilitares} restantes`} />
                          </div>
                        </div>
                        <strong className="w-6 text-right text-slate-200">{bruto}</strong>
                      </div>
                      <p className="mt-1 text-slate-400">
                        {situacao.territorios} territ. · {situacao.fabricasTributaveis} fábr. · {situacao.unidadesMilitares} unid.
                        {previa.excedenteCobertoPeloTesouro > 0 && (
                          <span className="ml-1 text-amber-300">
                            · tesouro cobre {previa.excedenteCobertoPeloTesouro}
                          </span>
                        )}
                        {previa.salariosNaoPagos > 0 && (
                          <span className="ml-1 text-red-300">
                            · não pagos {previa.salariosNaoPagos}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-400">
              <LegendaCor cor="#ef4444" texto="Consumido por militares" />
              <LegendaCor cor="#22c55e" texto="Saldo do tributo" />
            </div>
          </Painel>
        </div>

        <Painel titulo="Controle financeiro por nação" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NACOES.map((nacao) => (
              <div key={nacao} className="chart-nation-card rounded-xl bg-slate-950/40 p-3">
                <h4 className={`mb-2 text-center font-semibold ${CORES_NACAO[nacao].texto}`}>{CORES_NACAO[nacao].nome}</h4>
                <Pizza titulo={`Controle financeiro de ${CORES_NACAO[nacao].nome}`} fatias={controleFinanceiro(estado, nacao)} />
              </div>
            ))}
          </div>
        </Painel>

        <Painel titulo="Ranking se a partida terminasse agora" className="mt-4">
          <ol className="divide-y divide-slate-700">
            {ranking.map((entrada) => (
              <li key={entrada.jogador.id} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3">
                <span className="text-center text-xl font-black text-slate-400">{entrada.posicao}º</span>
                <div>
                  <strong className="text-slate-100">{entrada.jogador.nome}</strong>
                  <p className="text-xs text-slate-400">
                    Obrigações {entrada.detalhe.subtotalObrigacoes} + dinheiro {entrada.detalhe.dinheiro}
                    {entrada.desempate && ` · desempate: ${CORES_NACAO[entrada.desempate.nacao].nome}`}
                    {entrada.empateReal && ' · empate real'}
                  </p>
                </div>
                <strong className="text-lg text-emerald-300">{entrada.detalhe.total} pts</strong>
              </li>
            ))}
          </ol>
        </Painel>
      </section>
    </div>
  )
}

function Painel({ titulo, children, className = '' }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-slate-900 p-4 ${className}`}>
      <h3 className="mb-3 font-semibold text-slate-100">{titulo}</h3>
      {children}
    </section>
  )
}

function Pizza({ titulo, fatias, tamanho = 'normal' }: { titulo: string; fatias: FatiaGrafico[]; tamanho?: 'normal' | 'grande' }) {
  const validas = fatias.filter((fatia) => fatia.valor > 0)
  const total = validas.reduce((soma, fatia) => soma + fatia.valor, 0)
  const segmentos = validas.reduce<Array<FatiaGrafico & { offset: number }>>(
    (resultado, fatia) => {
      const acumulado = resultado.reduce((soma, segmento) => soma + segmento.percentual, 0)
      return [...resultado, { ...fatia, offset: 25 - acumulado }]
    },
    [],
  )
  return (
    <div className={tamanho === 'grande' ? 'sm:flex sm:items-center sm:gap-5' : ''}>
      <svg viewBox="0 0 42 42" className={`mx-auto ${tamanho === 'grande' ? 'h-48 w-48' : 'h-32 w-32'}`} role="img" aria-label={titulo}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#334155" strokeWidth="8" />
        {segmentos.map((fatia) => {
          const percentual = total > 0 ? (fatia.valor / total) * 100 : 0
          return <circle key={fatia.id} cx="21" cy="21" r="15.9155" fill="none" stroke={fatia.cor} strokeWidth="8" strokeDasharray={`${percentual} ${100 - percentual}`} strokeDashoffset={fatia.offset} />
        })}
        <text x="21" y="20.5" textAnchor="middle" className="chart-total-text text-[5px] font-bold">{total}</text>
        <text x="21" y="25" textAnchor="middle" className="chart-caption-text text-[2.7px]">total</text>
      </svg>
      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-1 text-xs">
        {validas.length === 0 ? (
          <span className="text-center text-slate-500">Sem obrigações distribuídas</span>
        ) : validas.map((fatia) => (
          <div key={fatia.id} className="flex items-center justify-between gap-2 text-slate-300">
            <LegendaCor cor={fatia.cor} texto={fatia.nome} />
            <span className="shrink-0">{fatia.valor} · {fatia.percentual.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendaCor({ cor, texto }: { cor: string; texto: string }) {
  return <span className="min-w-0 truncate"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} />{texto}</span>
}
