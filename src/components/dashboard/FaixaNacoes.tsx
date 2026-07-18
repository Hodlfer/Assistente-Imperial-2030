import type { Estado } from '../../engine'
import { NACOES, PP_MAXIMO } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import { CartaoNacao } from './CartaoNacao'
import { nacaoLider } from './modelo'

interface Props {
  estado: Estado
}

const AVISO_FIM_DE_JOGO = 20

export function FaixaNacoes({ estado }: Props) {
  const lider = nacaoLider(estado)
  const corLider = CORES_NACAO[lider.nacao]
  const proximoDoFim = lider.pontosPoder >= AVISO_FIM_DE_JOGO
  const corBarra = corLider.bg.split(' ')[0]

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:text-sm">
        <span className="shrink-0">
          Líder: <span className={corLider.texto}>{corLider.nome}</span>
        </span>
        <div
          role="progressbar"
          aria-valuenow={lider.pontosPoder}
          aria-valuemin={0}
          aria-valuemax={PP_MAXIMO}
          aria-label={`Progresso de ${corLider.nome} rumo a ${PP_MAXIMO} PP`}
          className="h-3 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-800"
        >
          <div
            className={`h-full ${proximoDoFim ? 'bg-amber-500' : corBarra}`}
            style={{ width: `${Math.min(100, (lider.pontosPoder / PP_MAXIMO) * 100)}%` }}
          />
        </div>
        <span className="shrink-0">
          {lider.pontosPoder}/{PP_MAXIMO} PP
        </span>
        {proximoDoFim && (
          <span className="shrink-0 rounded-full bg-amber-900/60 px-2 py-1 font-semibold text-amber-200">
            Fim de jogo próximo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {NACOES.map((nacao) => (
          <CartaoNacao key={nacao} estado={estado} nacao={nacao} />
        ))}
      </div>
    </section>
  )
}
