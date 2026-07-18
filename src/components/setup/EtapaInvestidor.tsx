import { useEffect } from 'react'
import type { JogadorDraft, ObrigacoesEscolhidas } from './modelo'
import { sugerirPortadorInvestidor } from './modelo'

interface Props {
  jogadores: JogadorDraft[]
  obrigacoes: ObrigacoesEscolhidas
  cartaInvestidorId: string | null
  onMudar: (id: string) => void
  onAvancar: () => void
  onVoltar: () => void
}

export function EtapaInvestidor({
  jogadores,
  obrigacoes,
  cartaInvestidorId,
  onMudar,
  onAvancar,
  onVoltar,
}: Props) {
  const sugestaoId = sugerirPortadorInvestidor(jogadores, obrigacoes)
  const sugestao = jogadores.find((j) => j.id === sugestaoId)

  // Pré-seleciona a sugestão quando ela existe e nada foi escolhido ainda —
  // a seleção final continua manual e o jogador pode trocar livremente.
  useEffect(() => {
    if (sugestaoId && !cartaInvestidorId) onMudar(sugestaoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugestaoId])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">
          Carta de Investidor
        </h2>
        <p className="mt-1 text-slate-400">
          O portador inicial fica à esquerda de quem controla a Rússia; se
          ninguém controla a Rússia, à esquerda de quem controla a China.
        </p>
      </div>

      {sugestao ? (
        <p className="rounded-xl bg-sky-950/40 p-4 text-sky-200">
          Sugestão pela regra: <strong>{sugestao.nome}</strong>. Confirme ou
          escolha outro jogador abaixo.
        </p>
      ) : (
        <p className="rounded-xl bg-slate-800 p-4 text-slate-400">
          Não foi possível sugerir automaticamente (ninguém controla Rússia
          nem China de forma exclusiva) — escolha manualmente.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {jogadores.map((jogador) => (
          <li key={jogador.id}>
            <button
              type="button"
              onClick={() => onMudar(jogador.id)}
              aria-pressed={jogador.id === cartaInvestidorId}
              className={`w-full rounded-xl px-4 py-4 text-left text-lg font-medium ${
                jogador.id === cartaInvestidorId
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {jogador.nome}
              {jogador.id === sugestaoId && (
                <span className="ml-2 text-sm opacity-75">(sugerido)</span>
              )}
            </button>
          </li>
        ))}
      </ul>

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
          disabled={!cartaInvestidorId}
          className="rounded-xl bg-sky-600 px-8 py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
