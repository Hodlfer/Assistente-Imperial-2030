import { useState } from 'react'
import type { Estado, Jogador } from '../../engine'
import { CORES_NACAO } from '../../data/cores'
import { nacoesGovernadasPor, obrigacoesAgrupadasPorNacao } from './modelo'

interface Props {
  estado: Estado
  jogador: Jogador
}

export function CartaoJogador({ estado, jogador }: Props) {
  const [oculto, setOculto] = useState(false)
  const governa = nacoesGovernadasPor(estado, jogador.id)
  const grupos = obrigacoesAgrupadasPorNacao(estado, jogador.id)

  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-xl bg-slate-800 p-3 text-xs sm:text-sm">
      <div className="-mx-3 -mt-3 flex h-1.5">
        {governa.length > 0 ? (
          governa.map((nacao) => (
            <span
              key={nacao}
              className={`flex-1 ${CORES_NACAO[nacao].bg.split(' ')[0]}`}
            />
          ))
        ) : (
          <span className="flex-1 bg-slate-700" />
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-slate-100" title={jogador.nome}>
          {jogador.nome}
        </h3>
        <div className="flex shrink-0 gap-1 text-base" aria-hidden="true">
          {jogador.temBancoSuico && <span title="Banco Suíço">🏦</span>}
          {jogador.temCartaInvestidor && <span title="Carta de Investidor">💼</span>}
        </div>
      </div>

      {governa.length > 0 && (
        <p className="truncate text-slate-400">
          Governa: {governa.map((n) => CORES_NACAO[n].nome).join(', ')}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-400">Dinheiro</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100">
            {oculto ? '••' : jogador.dinheiro}
          </span>
          <button
            type="button"
            onClick={() => setOculto((v) => !v)}
            aria-pressed={oculto}
            aria-label={
              oculto
                ? `Mostrar dinheiro de ${jogador.nome}`
                : `Ocultar dinheiro de ${jogador.nome}`
            }
            className="shrink-0 rounded-md bg-slate-700 px-2 py-1 text-slate-200"
          >
            {oculto ? 'Mostrar' : 'Ocultar'}
          </button>
        </div>
      </div>

      {grupos.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {grupos.map(({ nacao, soma, juros }) => (
            <li key={nacao} className="flex justify-between gap-2">
              <span className={`truncate ${CORES_NACAO[nacao].texto}`}>
                {CORES_NACAO[nacao].nome}
              </span>
              <span className="shrink-0 text-slate-300">
                {soma} <span className="text-slate-500">(juros {juros})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
