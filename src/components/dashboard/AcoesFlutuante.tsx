import { useState } from 'react'
import type { Nacao } from '../../engine'
import { nacaoAtivaSugerida } from '../../engine'
import { NOMES_NACAO } from '../../data/regras'
import type { UseGameResult } from '../../hooks/useGame'
import type { AcaoSimples } from './acoes/AcaoSimplesModal'
import { AcaoSimplesModal } from './acoes/AcaoSimplesModal'
import { TributacaoModal } from './acoes/TributacaoModal'
import { InvestidorModal } from './acoes/InvestidorModal'
import { FimDeJogoModal } from './acoes/FimDeJogoModal'

interface Props {
  jogo: UseGameResult
  onPedirDesfazer: () => void
}

type ModalAberto =
  | { tipo: 'simples'; acao: AcaoSimples }
  | { tipo: 'tributacao' }
  | { tipo: 'investidor'; comJuros: boolean }
  | null

interface ItemMenu {
  rotulo: string
  abrir: ModalAberto
}

// Ordem do rondel de Imperial (docs/REGRAS.md §Regras monetárias): Fábrica,
// Produção, Importação, Manobra, Tributação, Investidor. Espaços extras é uma
// ferramenta à parte (enunciado Sessão 4, item 6).
const ITENS: ItemMenu[] = [
  { rotulo: 'Fábrica', abrir: { tipo: 'simples', acao: 'fabrica' } },
  { rotulo: 'Produção', abrir: { tipo: 'simples', acao: 'producao' } },
  { rotulo: 'Importação', abrir: { tipo: 'simples', acao: 'importacao' } },
  { rotulo: 'Manobra', abrir: { tipo: 'simples', acao: 'manobra' } },
  { rotulo: 'Tributação', abrir: { tipo: 'tributacao' } },
  { rotulo: 'Investidor — parar', abrir: { tipo: 'investidor', comJuros: true } },
  { rotulo: 'Investidor — passar por cima', abrir: { tipo: 'investidor', comJuros: false } },
  { rotulo: 'Espaços extras', abrir: { tipo: 'simples', acao: 'espacosExtras' } },
]

export function AcoesFlutuante({ jogo, onPedirDesfazer }: Props) {
  const [aberto, setAberto] = useState(false)
  const [modal, setModal] = useState<ModalAberto>(null)
  const [fimDeJogo, setFimDeJogo] = useState<Nacao | null>(null)

  const estado = jogo.estado
  if (!estado) return null

  const nacaoInicial = nacaoAtivaSugerida(estado)

  function abrir(item: ModalAberto) {
    setModal(item)
    setAberto(false)
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {aberto && (
          <div className="flex w-60 flex-col gap-2 rounded-xl bg-slate-800 p-3 shadow-lg">
            <p className="px-1 text-xs text-slate-400">
              Próxima na ordem:{' '}
              <span className="font-semibold text-slate-200">{NOMES_NACAO[nacaoInicial]}</span>
            </p>
            {ITENS.map((item) => (
              <button
                key={item.rotulo}
                type="button"
                onClick={() => abrir(item.abrir)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-left text-sm font-medium text-slate-100 hover:bg-slate-600"
              >
                {item.rotulo}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onPedirDesfazer()
              }}
              disabled={!jogo.podeDesfazer}
              className="mt-1 rounded-lg border border-slate-600 px-4 py-2 text-left text-sm text-slate-300 disabled:opacity-40"
            >
              Desfazer última ação
            </button>
            <button
              type="button"
              onClick={() => jogo.refazer()}
              disabled={!jogo.podeRefazer}
              className="rounded-lg border border-slate-600 px-4 py-2 text-left text-sm text-slate-300 disabled:opacity-40"
            >
              Refazer
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="rounded-full bg-sky-600 px-6 py-4 text-lg font-semibold text-white shadow-lg"
        >
          Ações
        </button>
      </div>

      {modal?.tipo === 'simples' && (
        <AcaoSimplesModal
          tipo={modal.acao}
          estado={estado}
          jogo={jogo}
          nacaoInicial={nacaoInicial}
          onFechar={() => setModal(null)}
        />
      )}

      {modal?.tipo === 'tributacao' && (
        <TributacaoModal
          estado={estado}
          jogo={jogo}
          nacaoInicial={nacaoInicial}
          onFechar={() => setModal(null)}
          onFimDeJogo={(nacao) => setFimDeJogo(nacao)}
        />
      )}

      {modal?.tipo === 'investidor' && (
        <InvestidorModal
          comJuros={modal.comJuros}
          estado={estado}
          jogo={jogo}
          nacaoInicial={nacaoInicial}
          onFechar={() => setModal(null)}
        />
      )}

      {fimDeJogo && <FimDeJogoModal nacao={fimDeJogo} onFechar={() => setFimDeJogo(null)} />}
    </>
  )
}
