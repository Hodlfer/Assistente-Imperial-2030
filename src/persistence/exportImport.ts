// Export/Import em JSON (enunciado da Sessão 5, item 4). Importar reprocessa
// cada transação pela engine — a mesma validação que já garante o undo
// (docs/ARQUITETURA.md §Tudo é transação) — em vez de confiar cegamente no
// `jogadores`/`nacoes` do arquivo.

import type { Estado, Transacao } from '../engine'
import { aplicarTransacao } from '../engine'
import type { PartidaSalva } from './tipos'
import { SCHEMA_VERSION } from './tipos'

export function nomeArquivoExport(data: Date = new Date()): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `imperial-2030-${ano}-${mes}-${dia}.json`
}

export function exportarJSON(estado: Estado): string {
  const payload: PartidaSalva = { schemaVersion: SCHEMA_VERSION, estado, salvoEm: Date.now() }
  return JSON.stringify(payload, null, 2)
}

export type ResultadoImportacao =
  | { sucesso: true; estado: Estado }
  | { sucesso: false; erro: string }

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function mensagemDeErro(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** Reconstrói o estado a partir do zero, reaplicando cada transação pela
 *  engine (`aplicarTransacao`). Se alguma falhar, reporta qual e aborta sem
 *  produzir um estado parcial (enunciado da Sessão 5, item 4). */
function reprocessarTransacoes(transacoes: Transacao[]): ResultadoImportacao {
  const inicio = transacoes[0]
  if (!inicio || inicio.tipo !== 'PartidaIniciada') {
    return { sucesso: false, erro: 'A primeira transação precisa ser "PartidaIniciada".' }
  }

  let estado: Estado
  try {
    estado = {
      jogadores: inicio.estadoInicial.jogadores,
      nacoes: inicio.estadoInicial.nacoes,
      transacoes: [inicio],
    }
  } catch (e) {
    return { sucesso: false, erro: `Snapshot inicial inválido: ${mensagemDeErro(e)}` }
  }

  for (let i = 1; i < transacoes.length; i++) {
    try {
      estado = aplicarTransacao(estado, transacoes[i])
    } catch (e) {
      return {
        sucesso: false,
        erro: `Transação #${i + 1} (${transacoes[i].tipo}) inválida: ${mensagemDeErro(e)}`,
      }
    }
  }

  return { sucesso: true, estado }
}

/** Valida o schema do JSON colado/carregado e reprocessa as transações pela
 *  engine. Nunca lança — sempre retorna sucesso/erro para a UI decidir. */
export function importarJSON(json: string): ResultadoImportacao {
  let bruto: unknown
  try {
    bruto = JSON.parse(json)
  } catch {
    return { sucesso: false, erro: 'JSON inválido: não foi possível interpretar o arquivo.' }
  }

  if (!ehObjeto(bruto) || typeof bruto.schemaVersion !== 'number') {
    return {
      sucesso: false,
      erro: 'Arquivo sem "schemaVersion" — não parece um save do Assistente Imperial 2030.',
    }
  }
  if (bruto.schemaVersion !== SCHEMA_VERSION) {
    return {
      sucesso: false,
      erro: `Versão de schema desconhecida (${bruto.schemaVersion}, esperada ${SCHEMA_VERSION}). Guarde este arquivo como backup — a migração automática ainda não existe para essa versão.`,
    }
  }

  const estadoBruto = bruto.estado
  if (!ehObjeto(estadoBruto) || !Array.isArray(estadoBruto.transacoes)) {
    return { sucesso: false, erro: 'Arquivo sem lista de transações válida.' }
  }

  return reprocessarTransacoes(estadoBruto.transacoes as Transacao[])
}
