import { useMemo, useState } from 'react'
import type { AcaoRondel, Estado, Nacao } from '../../../engine'
import {
  aplicarAcaoRondel,
  construirEspacosExtras,
  construirFabrica,
  construirImportacao,
  construirManobra,
  construirProducao,
  custoEspacosExtras,
  fatorDePoder,
} from '../../../engine'
import { NOMES_NACAO } from '../../../data/regras'
import type { UseGameResult } from '../../../hooks/useGame'
import { AcaoModal, SecaoAcao } from './AcaoModal'
import { SeletorNacao } from './SeletorNacao'
import { formatarDelta } from './modelo'

/** Ações simples que compartilham o mesmo modal. */
export type AcaoSimples = 'fabrica' | 'importacao' | 'producao' | 'manobra' | 'espacosExtras'

const TITULOS: Record<AcaoSimples, string> = {
  fabrica: 'Fábrica',
  importacao: 'Importação',
  producao: 'Produção',
  manobra: 'Manobra',
  espacosExtras: 'Espaços extras',
}

interface Props {
  tipo: AcaoSimples
  estado: Estado
  jogo: UseGameResult
  nacaoInicial: Nacao
  onFechar: () => void
}

export function AcaoSimplesModal({ tipo, estado, jogo, nacaoInicial, onFechar }: Props) {
  const [nacao, setNacao] = useState<Nacao>(nacaoInicial)
  const [unidades, setUnidades] = useState(1)
  const [espacos, setEspacos] = useState(1)

  const construtor = useMemo(() => {
    return (e: Estado): AcaoRondel => {
      switch (tipo) {
        case 'fabrica':
          return construirFabrica(e, nacao)
        case 'importacao':
          return construirImportacao(e, nacao, unidades)
        case 'producao':
          return construirProducao(e, nacao)
        case 'manobra':
          return construirManobra(e, nacao)
        case 'espacosExtras':
          return construirEspacosExtras(e, nacao, espacos)
      }
    }
  }, [tipo, nacao, unidades, espacos])

  const previa = useMemo(() => {
    try {
      const acao = construtor(estado)
      return { depois: aplicarAcaoRondel(estado, acao), erro: null as string | null }
    } catch (e) {
      return { depois: null, erro: e instanceof Error ? e.message : String(e) }
    }
  }, [construtor, estado])

  function confirmar() {
    if (previa.erro) return
    jogo.dispatch((e) => aplicarAcaoRondel(e, construtor(e)))
    onFechar()
  }

  const estadoNacao = estado.nacoes[nacao]
  const governante = estado.jogadores.find((j) => j.id === estadoNacao.governanteId)

  return (
    <AcaoModal
      titulo={TITULOS[tipo]}
      onFechar={onFechar}
      erro={previa.erro}
      rodape={
        <button
          type="button"
          onClick={confirmar}
          disabled={!!previa.erro}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Confirmar
        </button>
      }
    >
      <SeletorNacao valor={nacao} onChange={setNacao} />

      {tipo === 'importacao' && (
        <label className="flex flex-col gap-1 text-slate-300">
          Unidades importadas (1–3)
          <input
            type="number"
            min={1}
            max={3}
            value={unidades}
            onChange={(e) => setUnidades(Math.max(1, Math.min(3, Number(e.target.value))))}
            className="rounded-lg bg-slate-700 p-2 text-base text-slate-100"
          />
        </label>
      )}

      {tipo === 'espacosExtras' && (
        <label className="flex flex-col gap-1 text-slate-300">
          Espaços extras (1–3)
          <input
            type="number"
            min={1}
            max={3}
            value={espacos}
            onChange={(e) => setEspacos(Math.max(1, Math.min(3, Number(e.target.value))))}
            className="rounded-lg bg-slate-700 p-2 text-base text-slate-100"
          />
        </label>
      )}

      <SecaoAcao titulo="Prévia">
        {(tipo === 'fabrica' || tipo === 'importacao') && previa.depois && (
          <FluxoTesouro
            nome={NOMES_NACAO[nacao]}
            antes={estadoNacao.tesouro}
            depois={previa.depois.nacoes[nacao].tesouro}
          />
        )}

        {tipo === 'espacosExtras' && (
          <div className="flex flex-col gap-1 text-slate-200">
            <p className="text-slate-400">
              Custo: {espacos} × (1 + Fator x{fatorDePoder(estadoNacao.pontosPoder)}) ={' '}
              <span className="font-semibold text-slate-100">
                {custoEspacosExtras(estado, nacao, espacos)}
              </span>
            </p>
            {governante && previa.depois && (
              <FluxoDinheiro
                nome={governante.nome}
                antes={governante.dinheiro}
                depois={
                  previa.depois.jogadores.find((j) => j.id === governante.id)?.dinheiro ?? 0
                }
              />
            )}
          </div>
        )}

        {tipo === 'producao' && (
          <p className="text-slate-300">
            Sem efeito monetário. Registra a ação de Produção no histórico do turno.
          </p>
        )}

        {tipo === 'manobra' && (
          <div className="flex flex-col gap-2 text-slate-300">
            <p>Sem efeito monetário. Registra a ação de Manobra no histórico do turno.</p>
            <p className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-xs text-slate-400">
              Lembrete: a Manobra pode ter consequências no tabuleiro (mover bandeiras, destruir
              fábricas) que o app não controla — ajuste manualmente se necessário.
            </p>
          </div>
        )}
      </SecaoAcao>
    </AcaoModal>
  )
}

function FluxoTesouro({ nome, antes, depois }: { nome: string; antes: number; depois: number }) {
  return (
    <p className="flex items-center justify-between text-slate-200">
      <span className="text-slate-400">Tesouro {nome}</span>
      <span>
        {antes} → <span className="font-semibold">{depois}</span>{' '}
        <span className="text-slate-400">({formatarDelta(depois - antes)} ao banco)</span>
      </span>
    </p>
  )
}

function FluxoDinheiro({ nome, antes, depois }: { nome: string; antes: number; depois: number }) {
  return (
    <p className="flex items-center justify-between text-slate-200">
      <span className="truncate text-slate-400">Dinheiro de {nome}</span>
      <span className="shrink-0">
        {antes} → <span className="font-semibold">{depois}</span>{' '}
        <span className="text-slate-400">({formatarDelta(depois - antes)})</span>
      </span>
    </p>
  )
}
