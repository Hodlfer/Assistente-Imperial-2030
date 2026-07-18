import type { Nacao } from '../../../engine'
import { NACOES, NOMES_NACAO } from '../../../data/regras'

interface Props {
  valor: Nacao
  onChange: (nacao: Nacao) => void
  /** Rótulo do campo (default: "Nação ativa"). */
  rotulo?: string
}

/** Seletor da nação ativa — primeira pergunta de toda ação (enunciado Sessão 4,
 *  item 1). O default (cursor de turno) é definido por quem usa o seletor. */
export function SeletorNacao({ valor, onChange, rotulo = 'Nação ativa' }: Props) {
  return (
    <label className="flex flex-col gap-1 text-slate-300">
      {rotulo}
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value as Nacao)}
        className="rounded-lg bg-slate-700 p-2 text-base text-slate-100"
      >
        {NACOES.map((n) => (
          <option key={n} value={n}>
            {NOMES_NACAO[n]}
          </option>
        ))}
      </select>
    </label>
  )
}
