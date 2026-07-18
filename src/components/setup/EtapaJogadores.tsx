import type { JogadorDraft } from './modelo'
import { jogadorPadrao } from './modelo'

interface Props {
  jogadores: JogadorDraft[]
  onMudar: (jogadores: JogadorDraft[]) => void
  onAvancar: () => void
}

const MIN_JOGADORES = 2
const MAX_JOGADORES = 6

export function EtapaJogadores({ jogadores, onMudar, onAvancar }: Props) {
  const podeAvancar =
    jogadores.length >= MIN_JOGADORES &&
    jogadores.length <= MAX_JOGADORES &&
    jogadores.every((j) => j.nome.trim().length > 0)

  function adicionar() {
    if (jogadores.length >= MAX_JOGADORES) return
    onMudar([...jogadores, jogadorPadrao(jogadores.length + 1)])
  }

  function remover(id: string) {
    if (jogadores.length <= MIN_JOGADORES) return
    onMudar(jogadores.filter((j) => j.id !== id))
  }

  function renomear(id: string, nome: string) {
    onMudar(jogadores.map((j) => (j.id === id ? { ...j, nome } : j)))
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= jogadores.length) return
    const copia = [...jogadores]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    onMudar(copia)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Jogadores</h2>
        <p className="mt-1 text-slate-400">
          De 2 a 6 jogadores. A ordem da lista é a ordem dos assentos em
          sentido horário — ela é obrigatória, pois a ação de Investidor
          depende dela.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {jogadores.map((jogador, indice) => (
          <li
            key={jogador.id}
            className="flex items-center gap-3 rounded-xl bg-slate-800 p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-slate-200">
              {indice + 1}
            </span>
            <input
              type="text"
              value={jogador.nome}
              onChange={(e) => renomear(jogador.id, e.target.value)}
              placeholder={`Jogador ${indice + 1}`}
              aria-label={`Nome do jogador no assento ${indice + 1}`}
              className="min-w-0 flex-1 rounded-lg bg-slate-900 px-4 py-3 text-lg text-slate-100 outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
                aria-label="Mover para cima"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-700 text-xl text-slate-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => mover(indice, 1)}
                disabled={indice === jogadores.length - 1}
                aria-label="Mover para baixo"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-700 text-xl text-slate-100 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remover(jogador.id)}
                disabled={jogadores.length <= MIN_JOGADORES}
                aria-label={`Remover ${jogador.nome}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-900/60 text-xl text-red-200 disabled:opacity-30"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={adicionar}
        disabled={jogadores.length >= MAX_JOGADORES}
        className="rounded-xl border-2 border-dashed border-slate-600 py-4 text-lg font-medium text-slate-300 disabled:opacity-30"
      >
        + Adicionar jogador
      </button>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAvancar}
          disabled={!podeAvancar}
          className="rounded-xl bg-sky-600 px-8 py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
