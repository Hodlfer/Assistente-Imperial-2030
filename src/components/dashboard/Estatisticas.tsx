import type { Estado, Nacao } from '../../engine'
import { aplicarTransacao } from '../../engine'
import { NACOES, NOMES_NACAO } from '../../data/regras'

interface Props { estado: Estado; aberto: boolean; onFechar: () => void }
const cores: Record<Nacao, string> = { russia: '#a855f7', china: '#eab308', india: '#64748b', brasil: '#22c55e', eua: '#ef4444', europa: '#3b82f6' }

function historico(estado: Estado) {
  const inicio = estado.transacoes[0]
  if (!inicio || inicio.tipo !== 'PartidaIniciada') return []
  let atual: Estado = { jogadores: inicio.estadoInicial.jogadores, nacoes: inicio.estadoInicial.nacoes, transacoes: [inicio] }
  const pontos = [atual]
  for (const t of estado.transacoes.slice(1)) { atual = aplicarTransacao(atual, t); pontos.push(atual) }
  return pontos
}
function caminho(valores: number[], maximo: number, largura = 300, altura = 100) {
  return valores.map((v, i) => `${(i / Math.max(1, valores.length - 1)) * largura},${altura - (v / Math.max(1, maximo)) * altura}`).join(' ')
}

export function Estatisticas({ estado, aberto, onFechar }: Props) {
  if (!aberto) return null
  const pontos = historico(estado)
  const maxPP = Math.max(25, ...pontos.flatMap((e) => NACOES.map((n) => e.nacoes[n].pontosPoder)))
  const maxDinheiro = Math.max(1, ...pontos.flatMap((e) => e.jogadores.map((j) => j.dinheiro)))
  return <div className="fixed inset-0 z-40 flex items-end bg-slate-950/70 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Estatísticas da partida">
    <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-slate-800 p-4 shadow-2xl sm:rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Estatísticas da partida</h2><button type="button" onClick={onFechar} className="min-h-11 rounded-lg bg-slate-700 px-3">Fechar</button></div>
      <p className="mb-3 text-sm text-slate-400">Evolução registrada após cada ação confirmada ({Math.max(0, pontos.length - 1)} ações).</p>
      <Grafico titulo="Pontos de Poder por nação" legenda={NACOES.map((n) => ({ nome: NOMES_NACAO[n], cor: cores[n] }))} linhas={NACOES.map((n) => ({ cor: cores[n], valores: pontos.map((e) => e.nacoes[n].pontosPoder) }))} maximo={maxPP} />
      <Grafico titulo="Dinheiro por jogador" legenda={estado.jogadores.map((j, i) => ({ nome: j.nome, cor: ['#38bdf8','#f472b6','#a3e635','#fb923c','#c084fc','#2dd4bf'][i] }))} linhas={estado.jogadores.map((j, i) => ({ cor: ['#38bdf8','#f472b6','#a3e635','#fb923c','#c084fc','#2dd4bf'][i], valores: pontos.map((e) => e.jogadores.find((x) => x.id === j.id)?.dinheiro ?? 0) }))} maximo={maxDinheiro} />
    </section>
  </div>
}
function Grafico({ titulo, legenda, linhas, maximo }: { titulo: string; legenda: {nome:string;cor:string}[]; linhas:{cor:string;valores:number[]}[]; maximo:number }) {
 return <section className="mb-6 rounded-xl bg-slate-900 p-3"><h3 className="mb-2 font-semibold">{titulo}</h3><svg viewBox="0 0 300 100" className="h-36 w-full rounded bg-slate-950" role="img" aria-label={titulo}>{linhas.map((l,i)=><polyline key={i} points={caminho(l.valores,maximo)} fill="none" stroke={l.cor} strokeWidth="2" vectorEffect="non-scaling-stroke" />)}</svg><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">{legenda.map((x)=><span key={x.nome}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{backgroundColor:x.cor}} />{x.nome}</span>)}</div></section>
}
