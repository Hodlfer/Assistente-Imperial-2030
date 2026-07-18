import { useState } from 'react'
import type { UseGameResult } from '../../hooks/useGame'
import { FaixaNacoes } from './FaixaNacoes'
import { CartoesJogadores } from './CartoesJogadores'
import { AjusteManual } from './AjusteManual'
import { AcoesFlutuante } from './AcoesFlutuante'

interface Props {
  jogo: UseGameResult
}

/** Tela principal, aberta durante a partida inteira: exibição fiel do estado
 *  + ajustes manuais de emergência. Ações do rondel chegam na Sessão 4. */
export function Dashboard({ jogo }: Props) {
  const [ajusteAberto, setAjusteAberto] = useState(false)
  const estado = jogo.estado
  if (!estado) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3 pb-28 sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-100 sm:text-2xl">
          Assistente Imperial 2030
        </h1>
        <button
          type="button"
          onClick={() => setAjusteAberto(true)}
          className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200"
        >
          Correção manual
        </button>
      </header>

      <FaixaNacoes estado={estado} />
      <CartoesJogadores estado={estado} />

      <AjusteManual
        estado={estado}
        jogo={jogo}
        aberto={ajusteAberto}
        onFechar={() => setAjusteAberto(false)}
      />
      <AcoesFlutuante jogo={jogo} />
    </div>
  )
}
