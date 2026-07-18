import { useMemo, useState } from 'react'
import type {
  AcaoRondel,
  EscolhaInvestimento,
  Estado,
  Jogador,
  JurosPagos,
  Nacao,
  TrocaGoverno,
} from '../../../engine'
import {
  aplicarAcaoRondel,
  aplicarEscolhaInvestimento,
  construirInvestidorParar,
  construirInvestidorPassar,
  governosTrocados,
  jurosDaAcao,
  movimentoBanco,
  ordemBancosSuicos,
  pagarJuros,
  portadorCarta,
  proximoHorario,
} from '../../../engine'
import { NOMES_NACAO } from '../../../data/regras'
import type { UseGameResult } from '../../../hooks/useGame'
import { AcaoModal, SecaoAcao } from './AcaoModal'
import { SeletorNacao } from './SeletorNacao'
import { SeletorInvestimento } from './SeletorInvestimento'
import { comprasDisponiveis, descreverEscolha, upgradesDisponiveis } from './modelo'
import type { OpcaoCompra, OpcaoUpgrade } from './modelo'

interface Props {
  /** `true` = parar no espaço (paga juros); `false` = só passar por cima. */
  comJuros: boolean
  estado: Estado
  jogo: UseGameResult
  nacaoInicial: Nacao
  onFechar: () => void
}

interface Investidor {
  jogador: Jogador
  comMais2: boolean
  dinheiroDisponivel: number
  compras: OpcaoCompra[]
  upgrades: OpcaoUpgrade[]
  escolha: EscolhaInvestimento
}

type SimInvestidor =
  | { erro: string }
  | {
      erro: null
      bearer: Jogador
      investidores: Investidor[]
      escolhaPortador: EscolhaInvestimento
      investimentosBanco: Record<string, EscolhaInvestimento>
      juros: JurosPagos['resultado'] | null
      trocas: TrocaGoverno[]
      proximo: Jogador
    }

function escolhaValida(
  escolha: EscolhaInvestimento,
  compras: OpcaoCompra[],
  upgrades: OpcaoUpgrade[],
): boolean {
  if (escolha.tipo === 'passar') return true
  if (escolha.tipo === 'comprar') {
    return compras.some((c) => c.nacao === escolha.nacao && c.valor === escolha.valor)
  }
  return upgrades.some(
    (u) =>
      u.nacao === escolha.nacao &&
      u.valorDevolvido === escolha.valorDevolvido &&
      u.valorNovo === escolha.valorNovo,
  )
}

/** Ação de Investidor (parar ou passar por cima) numa tela, com preview das 3
 *  etapas e resumo do que muda (docs/REGRAS.md §Regras monetárias; enunciado
 *  Sessão 4, itens 4 e 5). */
export function InvestidorModal({ comJuros, estado, jogo, nacaoInicial, onFechar }: Props) {
  const [nacao, setNacao] = useState<Nacao>(nacaoInicial)
  const [escolhas, setEscolhas] = useState<Record<string, EscolhaInvestimento>>({})

  const bearer = portadorCarta(estado)

  const sim = useMemo((): SimInvestidor => {
    if (!bearer) {
      return { erro: 'Nenhum jogador tem a carta de Investidor.' }
    }
    try {
      // Simulação incremental: aplica juros (se parar) e +2, depois cada
      // investidor na ordem, para calcular dinheiro/opções corretos a cada passo.
      let e = comJuros ? pagarJuros(estado, nacao) : estado
      e = movimentoBanco(e, { tipo: 'jogador', jogadorId: bearer.id }, 2, '+2 do banco')

      const ordem = [bearer.id, ...ordemBancosSuicos(estado, bearer.id).map((j) => j.id)]
      const investidores: Investidor[] = []
      const sanitizadas: Record<string, EscolhaInvestimento> = {}

      for (const [i, jid] of ordem.entries()) {
        const jog = e.jogadores.find((j) => j.id === jid)!
        const compras = comprasDisponiveis(e, jog.dinheiro)
        const upgrades = upgradesDisponiveis(e, jog, jog.dinheiro)
        let escolha = escolhas[jid] ?? { tipo: 'passar' }
        if (!escolhaValida(escolha, compras, upgrades)) escolha = { tipo: 'passar' }
        sanitizadas[jid] = escolha
        investidores.push({
          jogador: jog,
          comMais2: i === 0,
          dinheiroDisponivel: jog.dinheiro,
          compras,
          upgrades,
          escolha,
        })
        e = aplicarEscolhaInvestimento(e, jid, escolha)
      }

      const escolhaPortador = sanitizadas[bearer.id]
      const investimentosBanco = { ...sanitizadas }
      delete investimentosBanco[bearer.id]

      const acao: AcaoRondel = comJuros
        ? construirInvestidorParar(estado, nacao, escolhaPortador, investimentosBanco)
        : construirInvestidorPassar(estado, nacao, escolhaPortador, investimentosBanco)
      const depois = aplicarAcaoRondel(estado, acao)

      return {
        erro: null,
        bearer,
        investidores,
        escolhaPortador,
        investimentosBanco,
        juros: comJuros ? jurosDaAcao(acao)?.resultado ?? null : null,
        trocas: governosTrocados(estado, depois),
        proximo: proximoHorario(estado, bearer.id),
      }
    } catch (e) {
      return { erro: e instanceof Error ? e.message : String(e) }
    }
  }, [bearer, comJuros, estado, nacao, escolhas])

  function nome(id: string | null): string {
    return estado.jogadores.find((j) => j.id === id)?.nome ?? '—'
  }

  function confirmar() {
    if (sim.erro !== null) return
    const escolhaPortador = sim.escolhaPortador
    const investimentosBanco = sim.investimentosBanco
    jogo.dispatch((e) =>
      aplicarAcaoRondel(
        e,
        comJuros
          ? construirInvestidorParar(e, nacao, escolhaPortador, investimentosBanco)
          : construirInvestidorPassar(e, nacao, escolhaPortador, investimentosBanco),
      ),
    )
    onFechar()
  }

  const titulo = comJuros ? 'Investidor — parar no espaço' : 'Investidor — passar por cima'

  return (
    <AcaoModal
      titulo={titulo}
      onFechar={onFechar}
      erro={sim.erro}
      rodape={
        <button
          type="button"
          onClick={confirmar}
          disabled={!!sim.erro}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Confirmar Investidor
        </button>
      }
    >
      {comJuros ? (
        <SeletorNacao valor={nacao} onChange={setNacao} rotulo="Nação que parou no espaço" />
      ) : (
        <SeletorNacao valor={nacao} onChange={setNacao} rotulo="Nação que passou por cima" />
      )}

      {sim.erro === null && (
       <>
      <p className="text-xs text-slate-400">
        Portador da carta: <span className="text-slate-200">{sim.bearer.nome}</span>
      </p>

      {/* Etapa 1 — juros (só ao parar). */}
      {comJuros && (
        <SecaoAcao titulo="1. Juros (tesouro → portadores)">
          {sim.juros && sim.juros.porJogador.length > 0 ? (
            <>
              {sim.juros.porJogador.map((p) => (
                <p key={p.jogadorId} className="flex justify-between text-slate-200">
                  <span className="truncate text-slate-400">{nome(p.jogadorId)}</span>
                  <span className="shrink-0">
                    devido {p.devido} · recebe <span className="font-semibold">{p.recebido}</span>
                  </span>
                </p>
              ))}
              <div className="mt-1 border-t border-slate-700 pt-1 text-xs text-slate-400">
                <p>Do tesouro: {sim.juros.doTesouro}</p>
                {sim.juros.governanteAbdicou > 0 && (
                  <p className="text-amber-300">
                    Tesouro insuficiente: o governante abdicou de {sim.juros.governanteAbdicou}
                  </p>
                )}
                {sim.juros.doBolsoGovernante > 0 && (
                  <p className="text-amber-300">
                    O governante completou {sim.juros.doBolsoGovernante} do próprio bolso
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-400">Nenhuma obrigação desta nação em mãos — sem juros.</p>
          )}
        </SecaoAcao>
      )}

      {/* Etapa 2 — carta de Investidor (portador +2 + escolha). */}
      {(
        <SecaoAcao titulo="2. Carta de Investidor (+2 do banco)">
          {sim.investidores
            .filter((inv) => inv.comMais2)
            .map((inv) => (
              <SeletorInvestimento
                key={inv.jogador.id}
                nomeJogador={inv.jogador.nome}
                dinheiroDisponivel={inv.dinheiroDisponivel}
                compras={inv.compras}
                upgrades={inv.upgrades}
                escolha={inv.escolha}
                onChange={(escolha) =>
                  setEscolhas((prev) => ({ ...prev, [inv.jogador.id]: escolha }))
                }
              />
            ))}
        </SecaoAcao>
      )}

      {/* Etapa 3 — bancos suíços. */}
      {(
        <SecaoAcao titulo="3. Bancos Suíços (ordem horária a partir do portador)">
          {sim.investidores.filter((inv) => !inv.comMais2).length === 0 ? (
            <p className="text-slate-400">Nenhum Banco Suíço para investir.</p>
          ) : (
            sim.investidores
              .filter((inv) => !inv.comMais2)
              .map((inv) => (
                <SeletorInvestimento
                  key={inv.jogador.id}
                  nomeJogador={inv.jogador.nome}
                  dinheiroDisponivel={inv.dinheiroDisponivel}
                  compras={inv.compras}
                  upgrades={inv.upgrades}
                  escolha={inv.escolha}
                  onChange={(escolha) =>
                    setEscolhas((prev) => ({ ...prev, [inv.jogador.id]: escolha }))
                  }
                />
              ))
          )}
        </SecaoAcao>
      )}

      {/* Resumo do que muda. */}
      {(
        <SecaoAcao titulo="Resumo ao confirmar">
          {sim.investidores.some((inv) => inv.escolha.tipo !== 'passar') && (
            <div className="text-slate-300">
              {sim.investidores
                .filter((inv) => inv.escolha.tipo !== 'passar')
                .map((inv) => (
                  <p key={inv.jogador.id}>
                    {inv.jogador.nome}: {descreverEscolha(inv.escolha, (n) => NOMES_NACAO[n])}
                  </p>
                ))}
            </div>
          )}
          {sim.trocas.length > 0 ? (
            <div className="text-slate-300">
              {sim.trocas.map((t) => (
                <p key={t.nacao}>
                  Governo de {NOMES_NACAO[t.nacao]}: {nome(t.de)} → {nome(t.para)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhuma troca de governo.</p>
          )}
          <p className="text-slate-300">
            Carta de Investidor: {sim.bearer.nome} → {sim.proximo.nome}
          </p>
        </SecaoAcao>
      )}
       </>
      )}
    </AcaoModal>
  )
}
