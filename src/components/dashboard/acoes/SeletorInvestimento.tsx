import type { EscolhaInvestimento } from '../../../engine'
import { NOMES_NACAO } from '../../../data/regras'
import type { OpcaoCompra, OpcaoUpgrade } from './modelo'

interface Props {
  nomeJogador: string
  /** Dinheiro disponível já simulado (portador: +2 incluído). */
  dinheiroDisponivel: number
  compras: OpcaoCompra[]
  upgrades: OpcaoUpgrade[]
  escolha: EscolhaInvestimento
  onChange: (escolha: EscolhaInvestimento) => void
}

const chaveCompra = (o: OpcaoCompra) => `${o.nacao}:${o.valor}`
const chaveUpgrade = (o: OpcaoUpgrade) => `${o.nacao}:${o.valorDevolvido}:${o.valorNovo}`

/** Controle de investimento de um jogador na ação de Investidor: passar, comprar
 *  uma obrigação disponível ou fazer upgrade (só trocas válidas — mesma nação,
 *  valor maior; exibe a diferença) (enunciado Sessão 4, item 4.2). */
export function SeletorInvestimento({
  nomeJogador,
  dinheiroDisponivel,
  compras,
  upgrades,
  escolha,
  onChange,
}: Props) {
  const modo = escolha.tipo

  function selecionarModo(novo: EscolhaInvestimento['tipo']) {
    if (novo === 'passar') return onChange({ tipo: 'passar' })
    if (novo === 'comprar') {
      const o = compras[0]
      return onChange(o ? { tipo: 'comprar', nacao: o.nacao, valor: o.valor } : { tipo: 'passar' })
    }
    const u = upgrades[0]
    onChange(
      u
        ? { tipo: 'upgrade', nacao: u.nacao, valorDevolvido: u.valorDevolvido, valorNovo: u.valorNovo }
        : { tipo: 'passar' },
    )
  }

  const botoes: { valor: EscolhaInvestimento['tipo']; rotulo: string; habilitado: boolean }[] = [
    { valor: 'passar', rotulo: 'Passar', habilitado: true },
    { valor: 'comprar', rotulo: 'Comprar', habilitado: compras.length > 0 },
    { valor: 'upgrade', rotulo: 'Upgrade', habilitado: upgrades.length > 0 },
  ]

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 p-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-200">{nomeJogador}</span>
        <span className="text-xs text-slate-400">dinheiro: {dinheiroDisponivel}</span>
      </div>

      <div className="flex gap-1">
        {botoes.map((b) => (
          <button
            key={b.valor}
            type="button"
            disabled={!b.habilitado}
            aria-pressed={modo === b.valor}
            onClick={() => selecionarModo(b.valor)}
            className={`flex-1 rounded-md px-2 py-1 text-xs disabled:opacity-40 ${
              modo === b.valor ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {b.rotulo}
          </button>
        ))}
      </div>

      {modo === 'comprar' && escolha.tipo === 'comprar' && (
        <select
          aria-label={`Obrigação a comprar por ${nomeJogador}`}
          value={`${escolha.nacao}:${escolha.valor}`}
          onChange={(e) => {
            const o = compras.find((c) => chaveCompra(c) === e.target.value)
            if (o) onChange({ tipo: 'comprar', nacao: o.nacao, valor: o.valor })
          }}
          className="rounded-md bg-slate-700 p-2 text-slate-100"
        >
          {compras.map((o) => (
            <option key={chaveCompra(o)} value={chaveCompra(o)}>
              {NOMES_NACAO[o.nacao]} — {o.valor}
            </option>
          ))}
        </select>
      )}

      {modo === 'upgrade' && escolha.tipo === 'upgrade' && (
        <select
          aria-label={`Upgrade de ${nomeJogador}`}
          value={`${escolha.nacao}:${escolha.valorDevolvido}:${escolha.valorNovo}`}
          onChange={(e) => {
            const u = upgrades.find((x) => chaveUpgrade(x) === e.target.value)
            if (u)
              onChange({
                tipo: 'upgrade',
                nacao: u.nacao,
                valorDevolvido: u.valorDevolvido,
                valorNovo: u.valorNovo,
              })
          }}
          className="rounded-md bg-slate-700 p-2 text-slate-100"
        >
          {upgrades.map((u) => (
            <option key={chaveUpgrade(u)} value={chaveUpgrade(u)}>
              {NOMES_NACAO[u.nacao]} {u.valorDevolvido}→{u.valorNovo} (paga {u.diferenca})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
