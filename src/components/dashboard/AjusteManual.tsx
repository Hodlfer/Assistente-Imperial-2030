import { useState } from 'react'
import type { Estado, Nacao } from '../../engine'
import { aplicarAjusteManual } from '../../engine'
import { NACOES, VALORES_OBRIGACAO } from '../../data/regras'
import { CORES_NACAO } from '../../data/cores'
import type { UseGameResult } from '../../hooks/useGame'

interface Props {
  estado: Estado
  jogo: UseGameResult
  aberto: boolean
  onFechar: () => void
}

type Tipo = 'tesouro' | 'jogador' | 'moverObrigacao'

const PILHA = '' // valor do <select> que representa a pilha disponível

export function AjusteManual({ estado, jogo, aberto, onFechar }: Props) {
  const [tipo, setTipo] = useState<Tipo>('tesouro')
  const [nacao, setNacao] = useState<Nacao>(NACOES[0])
  const [delta, setDelta] = useState(0)
  const [jogadorId, setJogadorId] = useState(estado.jogadores[0]?.id ?? '')
  const [valorObrigacao, setValorObrigacao] = useState(VALORES_OBRIGACAO[0])
  const [origemId, setOrigemId] = useState(PILHA)
  const [destinoId, setDestinoId] = useState(PILHA)
  const [motivo, setMotivo] = useState('')

  if (!aberto) return null

  const motivoValido = motivo.trim().length > 0

  function aplicar() {
    if (!motivoValido) return
    if (tipo === 'tesouro') {
      jogo.dispatch((e) => aplicarAjusteManual(e, { tipo: 'tesouro', nacao, delta }, motivo))
    } else if (tipo === 'jogador') {
      jogo.dispatch((e) =>
        aplicarAjusteManual(e, { tipo: 'jogador', jogadorId, delta }, motivo),
      )
    } else {
      jogo.dispatch((e) =>
        aplicarAjusteManual(
          e,
          {
            tipo: 'moverObrigacao',
            nacao,
            valor: valorObrigacao,
            origemJogadorId: origemId || null,
            destinoJogadorId: destinoId || null,
          },
          motivo,
        ),
      )
    }
    setMotivo('')
    onFechar()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl bg-slate-800 p-5 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Correção manual</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md bg-slate-700 px-3 py-1 text-slate-300"
          >
            Fechar
          </button>
        </div>

        <p className="text-slate-400">
          Ajuste genérico para situações de mesa que o app não modela. Passa
          pelo histórico normal de transações e pode ser desfeito.
        </p>

        {jogo.erro && (
          <div className="rounded-lg border border-red-600 bg-red-950/40 p-2 text-red-200">
            {jogo.erro}
          </div>
        )}

        <div className="flex gap-2">
          {(
            [
              { valor: 'tesouro', rotulo: 'Tesouro' },
              { valor: 'jogador', rotulo: 'Jogador' },
              { valor: 'moverObrigacao', rotulo: 'Mover obrigação' },
            ] as { valor: Tipo; rotulo: string }[]
          ).map(({ valor, rotulo }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipo(valor)}
              aria-pressed={tipo === valor}
              className={`rounded-lg px-3 py-2 ${
                tipo === valor ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {tipo === 'tesouro' && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-slate-300">
              Nação
              <select
                value={nacao}
                onChange={(e) => setNacao(e.target.value as Nacao)}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                {NACOES.map((n) => (
                  <option key={n} value={n}>
                    {CORES_NACAO[n].nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Ajuste no tesouro (+/−)
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              />
            </label>
          </div>
        )}

        {tipo === 'jogador' && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-slate-300">
              Jogador
              <select
                value={jogadorId}
                onChange={(e) => setJogadorId(e.target.value)}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                {estado.jogadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Ajuste no dinheiro (+/−)
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              />
            </label>
          </div>
        )}

        {tipo === 'moverObrigacao' && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-slate-300">
              Nação
              <select
                value={nacao}
                onChange={(e) => setNacao(e.target.value as Nacao)}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                {NACOES.map((n) => (
                  <option key={n} value={n}>
                    {CORES_NACAO[n].nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Valor
              <select
                value={valorObrigacao}
                onChange={(e) => setValorObrigacao(Number(e.target.value))}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                {VALORES_OBRIGACAO.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              De
              <select
                value={origemId}
                onChange={(e) => setOrigemId(e.target.value)}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                <option value={PILHA}>Pilha disponível</option>
                {estado.jogadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Para
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="rounded-lg bg-slate-700 p-2 text-slate-100"
              >
                <option value={PILHA}>Pilha disponível</option>
                {estado.jogadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="flex flex-col gap-1 text-slate-300">
          Motivo (obrigatório)
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            required
            className="rounded-lg bg-slate-700 p-2 text-slate-100"
          />
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={aplicar}
            disabled={!motivoValido}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Aplicar correção
          </button>
        </div>
      </div>
    </div>
  )
}
