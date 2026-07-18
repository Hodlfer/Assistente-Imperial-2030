import type { Estado, Nacao } from '../../engine'
import { fatorDePoder } from '../../engine'
import { VALORES_OBRIGACAO } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import { controleLatente } from './modelo'

interface Props {
  estado: Estado
  nacao: Nacao
}

export function CartaoNacao({ estado, nacao }: Props) {
  const cor = CORES_NACAO[nacao]
  const estadoNacao = estado.nacoes[nacao]
  const governante = estado.jogadores.find((j) => j.id === estadoNacao.governanteId)
  const fator = fatorDePoder(estadoNacao.pontosPoder)
  const latente = controleLatente(estado, nacao)
  const jogadorLatente = latente
    ? estado.jogadores.find((j) => j.id === latente.jogadorId)
    : null

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border-2 ${cor.borda} ${cor.bgSuave} p-2 text-xs sm:text-sm`}
    >
      <div className={`flex items-center justify-between rounded-lg px-2 py-1 font-semibold ${cor.bg}`}>
        <span className="truncate">{cor.nome}</span>
        {jogadorLatente && (
          <span
            title={`Controle pendente: ${jogadorLatente.nome} já supera o governante atual (só muda na próxima verificação do Investidor)`}
            aria-label={`Controle pendente de ${cor.nome}`}
            className="shrink-0 text-amber-200"
          >
            ⚠
          </span>
        )}
      </div>

      <div className="flex justify-between text-slate-200">
        <span className="text-slate-400">Tesouro</span>
        <span className="font-semibold">{estadoNacao.tesouro}</span>
      </div>

      <div className="flex justify-between text-slate-200">
        <span className="text-slate-400">Poder</span>
        <span className="font-semibold">
          {estadoNacao.pontosPoder} PP · x{fator}
        </span>
      </div>

      <div className="flex justify-between gap-1 text-slate-200">
        <span className="text-slate-400">Governo</span>
        <span className="truncate font-semibold">
          {governante ? governante.nome : '— (pula o turno)'}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-1">
        {VALORES_OBRIGACAO.map((valor) => {
          const disponivel = estadoNacao.obrigacoesDisponiveis.includes(valor)
          return (
            <span
              key={valor}
              className={`rounded px-1 leading-tight ${
                disponivel
                  ? 'bg-slate-900/40 text-slate-100'
                  : 'text-slate-500 line-through'
              }`}
            >
              {valor}
            </span>
          )
        })}
      </div>
    </div>
  )
}
