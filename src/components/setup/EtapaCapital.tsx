import { capitalInicial } from '../../data/regras'

interface Props {
  numJogadores: number
  onAvancar: () => void
  onVoltar: () => void
}

export function EtapaCapital({ numJogadores, onAvancar, onVoltar }: Props) {
  const capital = capitalInicial(numJogadores)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">
          Capital inicial
        </h2>
        <p className="mt-1 text-slate-400">
          Aplicado automaticamente conforme o número de jogadores.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 py-10">
        <span className="text-6xl font-bold text-sky-400">{capital}</span>
        <span className="text-lg text-slate-400">
          milhões para cada um dos {numJogadores} jogadores
        </span>
      </div>

      <p className="text-slate-400">
        Depois de comprar as obrigações iniciais, cada jogador deve sobrar com
        exatamente 2 milhões.
      </p>

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
          onClick={onAvancar}
          className="rounded-xl bg-sky-600 px-8 py-4 text-lg font-semibold text-white"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
