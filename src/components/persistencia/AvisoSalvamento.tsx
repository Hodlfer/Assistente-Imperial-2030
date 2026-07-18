interface Props {
  mensagem: string
}

/** Aviso persistente quando o autosave falhou (enunciado da Sessão 5, item 3
 *  — "mostrar aviso persistente"). Fica fixo no topo até a próxima gravação
 *  bem-sucedida (o hook `usePersistencia` limpa `mensagem` quando isso
 *  acontece). */
export function AvisoSalvamento({ mensagem }: Props) {
  return (
    <div className="sticky top-0 z-40 border-b border-red-700 bg-red-950 px-4 py-2 text-center text-sm text-red-100">
      ⚠ {mensagem}
    </div>
  )
}
