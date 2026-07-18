import { useMemo, useState } from 'react'
import type { Estado, Nacao } from '../../../engine'
import {
  aplicarAcaoRondel,
  bonusEPontosTributacao,
  construirTributacao,
  tributacaoDaAcao,
} from '../../../engine'
import { NOMES_NACAO, PP_MAXIMO } from '../../../data/regras'
import type { UseGameResult } from '../../../hooks/useGame'
import { AcaoModal, SecaoAcao } from './AcaoModal'
import { SeletorNacao } from './SeletorNacao'

interface Props {
  estado: Estado
  jogo: UseGameResult
  nacaoInicial: Nacao
  onFechar: () => void
  onFimDeJogo: (nacao: Nacao) => void
}

/** Tributação: 4 etapas numa tela, com preview detalhado dos casos de tesouro
 *  insuficiente (docs/REGRAS.md §Regras monetárias; enunciado Sessão 4, item 3). */
export function TributacaoModal({ estado, jogo, nacaoInicial, onFechar, onFimDeJogo }: Props) {
  const [nacao, setNacao] = useState<Nacao>(nacaoInicial)
  const [fabricas, setFabricas] = useState(0)
  const [bandeiras, setBandeiras] = useState(0)
  const [unidades, setUnidades] = useState(0)

  const previa = useMemo(() => {
    try {
      const acao = construirTributacao(estado, nacao, fabricas, bandeiras, unidades)
      const trib = tributacaoDaAcao(acao)!
      const depois = aplicarAcaoRondel(estado, acao)
      return { resultado: trib.resultado, depois, erro: null as string | null }
    } catch (e) {
      return { resultado: null, depois: null, erro: e instanceof Error ? e.message : String(e) }
    }
  }, [estado, nacao, fabricas, bandeiras, unidades])

  const estadoNacao = estado.nacoes[nacao]
  const governante = estado.jogadores.find((j) => j.id === estadoNacao.governanteId)

  function confirmar() {
    if (previa.erro || !previa.depois) return
    jogo.dispatch((e) =>
      aplicarAcaoRondel(e, construirTributacao(e, nacao, fabricas, bandeiras, unidades)),
    )
    const ppFinal = previa.depois.nacoes[nacao].pontosPoder
    onFechar()
    if (ppFinal >= PP_MAXIMO) onFimDeJogo(nacao)
  }

  const r = previa.resultado
  const bonusNominal = r ? bonusEPontosTributacao(r.tributacao).bonus : 0
  const salariosInsuf = r ? r.salarios < unidades : false
  const bonusInsuf = r ? governante && r.bonusGovernante < bonusNominal : false
  const ppFinal = r ? Math.min(PP_MAXIMO, estadoNacao.pontosPoder + r.ganhoPP) : estadoNacao.pontosPoder

  return (
    <AcaoModal
      titulo="Tributação"
      onFechar={onFechar}
      erro={previa.erro}
      rodape={
        <button
          type="button"
          onClick={confirmar}
          disabled={!!previa.erro}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Confirmar tributação
        </button>
      }
    >
      <SeletorNacao valor={nacao} onChange={setNacao} />

      <div className="grid grid-cols-3 gap-2">
        <CampoNumero rotulo="Fábricas não-ocup." valor={fabricas} onChange={setFabricas} />
        <CampoNumero rotulo="Bandeiras" valor={bandeiras} onChange={setBandeiras} />
        <CampoNumero rotulo="Unid. militares" valor={unidades} onChange={setUnidades} />
      </div>

      {r && (
        <SecaoAcao titulo="Prévia das 4 etapas">
          <p className="text-slate-400">
            Tributação = 2×{fabricas} + {bandeiras} ={' '}
            <span className="font-semibold text-slate-100">{r.tributacao}</span>
          </p>

          <Etapa numero={1} texto="Banco → tesouro">
            <span className="text-emerald-300">+{r.aoTesouro}</span> ao tesouro
          </Etapa>

          <Etapa numero={2} texto="Tesouro → banco (salários)">
            <span className="text-red-300">−{r.salarios}</span>
            {salariosInsuf && (
              <span className="ml-1 text-amber-300">
                (tesouro insuficiente p/ {unidades}: paga o possível)
              </span>
            )}
          </Etapa>

          <Etapa numero={3} texto="Tesouro → governante (bônus)">
            {governante ? (
              <>
                <span className="text-emerald-300">+{r.bonusGovernante}</span> a {governante.nome}
                {bonusInsuf && (
                  <span className="ml-1 text-amber-300">
                    (tabela {bonusNominal}: paga o possível, resto perdido)
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400">sem governante — bônus não pago</span>
            )}
          </Etapa>

          <Etapa numero={4} texto="Nação ganha Pontos de Poder">
            <span className="text-emerald-300">+{r.ganhoPP} PP</span> ({estadoNacao.pontosPoder} →{' '}
            {ppFinal})
            {ppFinal >= PP_MAXIMO && (
              <span className="ml-1 font-semibold text-amber-300">→ fim de jogo!</span>
            )}
          </Etapa>

          <p className="mt-1 flex justify-between border-t border-slate-700 pt-2 text-slate-200">
            <span className="text-slate-400">Tesouro {NOMES_NACAO[nacao]}</span>
            <span>
              {estadoNacao.tesouro} →{' '}
              <span className="font-semibold">{previa.depois!.nacoes[nacao].tesouro}</span>
            </span>
          </p>
        </SecaoAcao>
      )}
    </AcaoModal>
  )
}

function CampoNumero({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string
  valor: number
  onChange: (n: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-300">
      {rotulo}
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="rounded-lg bg-slate-700 p-2 text-base text-slate-100"
      />
    </label>
  )
}

function Etapa({
  numero,
  texto,
  children,
}: {
  numero: number
  texto: string
  children: React.ReactNode
}) {
  return (
    <p className="text-slate-200">
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs">
        {numero}
      </span>
      <span className="text-slate-400">{texto}: </span>
      {children}
    </p>
  )
}
