import { useMemo, useState } from 'react'
import type { Estado, Nacao, SituacaoTributaria } from '../../engine'
import { atualizarSituacaoMapa, preverTributacao } from '../../engine'
import { NACOES } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import type { UseGameResult } from '../../hooks/useGame'
import { AcaoModal } from './acoes/AcaoModal'

interface Props {
  estado: Estado
  jogo: UseGameResult
  aberto: boolean
  onFechar: () => void
}

function copiarSituacoes(estado: Estado): Record<Nacao, SituacaoTributaria> {
  return Object.fromEntries(
    NACOES.map((nacao) => [nacao, { ...estado.nacoes[nacao].situacao }]),
  ) as Record<Nacao, SituacaoTributaria>
}

export function SituacaoMapa({ estado, jogo, aberto, onFechar }: Props) {
  if (!aberto) return null

  return <SituacaoMapaAberta estado={estado} jogo={jogo} onFechar={onFechar} />
}

function SituacaoMapaAberta({ estado, jogo, onFechar }: Omit<Props, 'aberto'>) {
  const [situacoes, setSituacoes] = useState(() => copiarSituacoes(estado))

  const totalTerritorios = useMemo(
    () => NACOES.reduce((soma, nacao) => soma + situacoes[nacao].territorios, 0),
    [situacoes],
  )
  const erro = totalTerritorios > 38
    ? `Há ${totalTerritorios} territórios informados, mas o mapa possui somente 38.`
    : null

  function mudar(nacao: Nacao, campo: keyof SituacaoTributaria, valor: number) {
    setSituacoes((atual) => ({
      ...atual,
      [nacao]: { ...atual[nacao], [campo]: valor },
    }))
  }

  function salvar() {
    if (erro) return
    jogo.dispatch((e) => atualizarSituacaoMapa(e, situacoes))
    onFechar()
  }

  return (
    <AcaoModal
      titulo="Situação do mapa"
      onFechar={onFechar}
      erro={erro}
      largura="larga"
      rodape={
        <button
          type="button"
          onClick={salvar}
          disabled={!!erro}
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Salvar situação
        </button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
        <p>Informe apenas os números que afetam a próxima Tributação.</p>
        <span className={totalTerritorios > 38 ? 'text-red-300' : 'text-slate-400'}>
          Territórios: {totalTerritorios}/38
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {NACOES.map((nacao) => {
          const cor = CORES_NACAO[nacao]
          const situacao = situacoes[nacao]
          const previa = preverTributacao(estado, nacao, situacao)
          return (
            <section key={nacao} className={`rounded-xl border ${cor.borda} bg-slate-900/60 p-3`}>
              <h3 className={`mb-3 font-semibold ${cor.texto}`}>{cor.nome}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Campo
                  rotulo="Fábricas livres"
                  aria={`Fábricas tributáveis de ${cor.nome}`}
                  valor={situacao.fabricasTributaveis}
                  maximo={4}
                  onChange={(valor) => mudar(nacao, 'fabricasTributaveis', valor)}
                />
                <Campo
                  rotulo="Territórios"
                  aria={`Territórios de ${cor.nome}`}
                  valor={situacao.territorios}
                  maximo={15}
                  onChange={(valor) => mudar(nacao, 'territorios', valor)}
                />
                <Campo
                  rotulo="Unidades"
                  aria={`Unidades militares de ${cor.nome}`}
                  valor={situacao.unidadesMilitares}
                  maximo={16}
                  onChange={(valor) => mudar(nacao, 'unidadesMilitares', valor)}
                />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 border-t border-slate-700 pt-2 text-center text-xs">
                <Resumo rotulo="Tributo" valor={`+${previa.resultado.tributacao}`} />
                <Resumo rotulo="Militares" valor={`−${previa.resultado.salarios}`} />
                <Resumo rotulo="Bônus" valor={`−${previa.resultado.bonusGovernante}`} />
                <Resumo rotulo="Poder" valor={`+${previa.resultado.ganhoPP} PP`} />
              </div>
              <p className="mt-2 text-right text-xs text-slate-400">
                Tesouro projetado: <strong className="text-slate-200">{previa.tesouroFinal}</strong>
              </p>
            </section>
          )
        })}
      </div>
    </AcaoModal>
  )
}

function Campo({
  rotulo,
  aria,
  valor,
  maximo,
  onChange,
}: {
  rotulo: string
  aria: string
  valor: number
  maximo: number
  onChange: (valor: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {rotulo}
      <input
        aria-label={aria}
        type="number"
        min={0}
        max={maximo}
        value={valor}
        onChange={(e) => onChange(Math.max(0, Math.min(maximo, Number(e.target.value))))}
        className="rounded-lg bg-slate-700 p-2 text-base text-slate-100"
      />
    </label>
  )
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <span className="block text-slate-500">{rotulo}</span>
      <strong className="text-slate-200">{valor}</strong>
    </div>
  )
}
