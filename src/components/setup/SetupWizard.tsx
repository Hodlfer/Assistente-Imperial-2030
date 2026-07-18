import { useState } from 'react'
import type { UseGameResult } from '../../hooks/useGame'
import { EtapaJogadores } from './EtapaJogadores'
import { EtapaCapital } from './EtapaCapital'
import { EtapaObrigacoes } from './EtapaObrigacoes'
import { EtapaInvestidor } from './EtapaInvestidor'
import { EtapaResumo } from './EtapaResumo'
import type { JogadorDraft, ObrigacoesEscolhidas } from './modelo'
import { criarObrigacoesVazias, jogadorPadrao } from './modelo'
import { capitalInicial } from '../../data/regras'

const ETAPAS = [
  'Jogadores',
  'Capital inicial',
  'Obrigações',
  'Investidor',
  'Resumo',
] as const

interface Props {
  jogo: UseGameResult
}

export function SetupWizard({ jogo }: Props) {
  const [passo, setPasso] = useState(0)
  const [jogadores, setJogadores] = useState<JogadorDraft[]>(() => [
    jogadorPadrao(1),
    jogadorPadrao(2),
  ])
  const [obrigacoes, setObrigacoes] = useState<ObrigacoesEscolhidas>(() =>
    criarObrigacoesVazias(),
  )
  const [cartaInvestidorId, setCartaInvestidorId] = useState<string | null>(
    null,
  )

  const avancar = () => setPasso((p) => Math.min(p + 1, ETAPAS.length - 1))
  const voltar = () => setPasso((p) => Math.max(p - 1, 0))

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <ol className="flex flex-wrap gap-2 text-sm">
        {ETAPAS.map((nome, indice) => (
          <li
            key={nome}
            className={`rounded-full px-3 py-1 ${
              indice === passo
                ? 'bg-sky-600 text-white'
                : indice < passo
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            {indice + 1}. {nome}
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <EtapaJogadores
          jogadores={jogadores}
          onMudar={setJogadores}
          onAvancar={avancar}
        />
      )}

      {passo === 1 && (
        <EtapaCapital
          numJogadores={jogadores.length}
          onAvancar={avancar}
          onVoltar={voltar}
        />
      )}

      {passo === 2 && (
        <EtapaObrigacoes
          jogadores={jogadores}
          obrigacoes={obrigacoes}
          onMudar={setObrigacoes}
          onAvancar={avancar}
          onVoltar={voltar}
        />
      )}

      {passo === 3 && (
        <EtapaInvestidor
          jogadores={jogadores}
          obrigacoes={obrigacoes}
          cartaInvestidorId={cartaInvestidorId}
          onMudar={setCartaInvestidorId}
          onAvancar={avancar}
          onVoltar={voltar}
        />
      )}

      {passo === 4 && (
        <EtapaResumo
          jogadores={jogadores}
          capital={capitalInicial(jogadores.length)}
          obrigacoes={obrigacoes}
          cartaInvestidorId={cartaInvestidorId}
          jogo={jogo}
          onVoltar={voltar}
        />
      )}
    </div>
  )
}
