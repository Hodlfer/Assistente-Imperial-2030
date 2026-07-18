import { useRef, useState } from 'react'
import type { Estado } from '../../engine'
import { AcaoModal } from '../dashboard/acoes/AcaoModal'
import { exportarJSON, importarJSON, nomeArquivoExport } from '../../persistence/exportImport'

interface Props {
  /** `null` na tela inicial, antes de qualquer partida em curso — só a seção
   *  de importar aparece nesse caso. */
  estado: Estado | null
  aberto: boolean
  onFechar: () => void
  /** Substitui o estado atual pelo importado (chamada só após confirmação,
   *  quando já existe uma partida em curso). */
  onImportar: (estado: Estado) => void
}

function baixarArquivo(estado: Estado) {
  const conteudo = exportarJSON(estado)
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivoExport()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportImportModal({ estado, aberto, onFechar, onImportar }: Props) {
  const [texto, setTexto] = useState('')
  const [erroImport, setErroImport] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [importacaoPendente, setImportacaoPendente] = useState<{
    estado: Estado
    migrada: boolean
  } | null>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)

  if (!aberto) return null

  async function copiar() {
    if (!estado) return
    try {
      await navigator.clipboard.writeText(exportarJSON(estado))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErroImport('Não foi possível copiar automaticamente — selecione e copie o texto manualmente.')
    }
  }

  async function carregarArquivo(arquivo: File) {
    setTexto(await arquivo.text())
    setErroImport(null)
  }

  function tentarImportar() {
    setErroImport(null)
    const resultado = importarJSON(texto)
    if (!resultado.sucesso) {
      setErroImport(resultado.erro)
      return
    }
    if (estado || resultado.migrada) {
      // Confirma tanto a sobrescrita quanto os valores estimados de um save v1.
      setImportacaoPendente({ estado: resultado.estado, migrada: resultado.migrada })
    } else {
      onImportar(resultado.estado)
    }
  }

  function confirmarImportacao() {
    if (!importacaoPendente) return
    onImportar(importacaoPendente.estado)
    setImportacaoPendente(null)
    setTexto('')
  }

  return (
    <AcaoModal titulo="Exportar / Importar" onFechar={onFechar}>
      {estado && (
        <section className="flex flex-col gap-2 rounded-lg bg-slate-900/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Exportar
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => baixarArquivo(estado)}
              className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100"
            >
              Baixar {nomeArquivoExport()}
            </button>
            <button
              type="button"
              onClick={copiar}
              className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-lg bg-slate-900/50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Importar</h3>
        <textarea
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setErroImport(null)
          }}
          rows={5}
          placeholder="Cole aqui o JSON exportado, ou carregue um arquivo abaixo"
          className="rounded-lg bg-slate-700 p-2 font-mono text-xs text-slate-100"
        />
        <input
          ref={arquivoRef}
          type="file"
          accept="application/json"
          onChange={(e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) carregarArquivo(arquivo)
          }}
          className="text-xs text-slate-400"
        />

        {erroImport && (
          <div className="rounded-lg border border-red-600 bg-red-950/40 p-2 text-sm text-red-200">
            {erroImport}
          </div>
        )}

        {importacaoPendente ? (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-600 bg-amber-950/30 p-3">
            {estado && (
              <p className="text-sm text-red-200">
                Isso substitui a partida em curso pela importada. A partida atual será perdida se
                não tiver sido exportada.
              </p>
            )}
            {importacaoPendente.migrada && (
              <p className="text-sm text-amber-200">
                Este save v1 foi atualizado: a situação do mapa foi estimada pela última
                Tributação de cada nação. Confira fábricas, territórios e unidades antes de jogar.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportacaoPendente(null)}
                className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarImportacao}
                className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white"
              >
                {estado ? 'Substituir partida atual' : 'Importar e conferir'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={tentarImportar}
            disabled={!texto.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Importar
          </button>
        )}
      </section>
    </AcaoModal>
  )
}
