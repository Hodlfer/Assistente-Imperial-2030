// Export/Import em JSON (enunciado da Sessão 5, item 4). Importar reprocessa
// cada transação pela engine — a mesma validação que já garante o undo
// (docs/ARQUITETURA.md §Tudo é transação) — em vez de confiar cegamente no
// `jogadores`/`nacoes` do arquivo.

import type {
  Estado,
  Nacao,
  PartidaIniciada,
  SituacaoTributaria,
  Transacao,
  TributacaoAplicada,
} from '../engine'
import { aplicarTransacao } from '../engine'
import { NACOES } from '../data/regras'
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
  | { sucesso: true; estado: Estado; migrada: boolean }
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

  return { sucesso: true, estado, migrada: false }
}

const SITUACAO_INICIAL: SituacaoTributaria = {
  fabricasTributaveis: 2,
  territorios: 0,
  unidadesMilitares: 0,
}

function tributacoesDentro(t: Transacao): TributacaoAplicada[] {
  if (t.tipo === 'TributacaoAplicada') return [t]
  if (t.tipo === 'AcaoRondel') return t.passos.flatMap(tributacoesDentro)
  return []
}

/** Migra o schema 1 sem inventar posições do mapa: usa a última Tributação de
 * cada nação como melhor fotografia disponível e os valores iniciais oficiais
 * para nações que nunca tributaram. */
function migrarTransacoesV1(transacoes: Transacao[]): Transacao[] {
  const inicioBruto = transacoes[0]
  if (!inicioBruto || inicioBruto.tipo !== 'PartidaIniciada') return transacoes

  const inicio = structuredClone(inicioBruto) as PartidaIniciada
  for (const nacao of NACOES) {
    inicio.estadoInicial.nacoes[nacao].situacao = { ...SITUACAO_INICIAL }
  }

  const ultimas: Partial<Record<Nacao, SituacaoTributaria>> = {}
  for (const t of transacoes.slice(1)) {
    for (const tributacao of tributacoesDentro(t)) {
      ultimas[tributacao.nacao] = {
        fabricasTributaveis: tributacao.fabricas,
        territorios: tributacao.bandeiras,
        unidadesMilitares: tributacao.unidades,
      }
    }
  }

  const migradas: Transacao[] = [inicio, ...structuredClone(transacoes.slice(1))]
  if (Object.keys(ultimas).length > 0) {
    migradas.push({
      tipo: 'SituacaoMapaAtualizada',
      timestamp: Math.max(Date.now(), ...migradas.map((t) => t.timestamp + 1)),
      rotulo: 'Situação do mapa estimada na migração',
      alteracoes: ultimas,
    })
  }
  return migradas
}

export type ResultadoMigracao =
  | { sucesso: true; partida: PartidaSalva; migrada: boolean }
  | { sucesso: false; erro: string }

/** Normaliza e reprocessa um save persistido, aceitando o schema anterior. */
export function migrarPartidaSalva(registro: PartidaSalva): ResultadoMigracao {
  if (registro.schemaVersion !== 1 && registro.schemaVersion !== SCHEMA_VERSION) {
    return {
      sucesso: false,
      erro: `Versão de schema desconhecida (${registro.schemaVersion}, esperada ${SCHEMA_VERSION}).`,
    }
  }
  if (!ehObjeto(registro.estado) || !Array.isArray(registro.estado.transacoes)) {
    return { sucesso: false, erro: 'Arquivo sem lista de transações válida.' }
  }

  const migrada = registro.schemaVersion === 1
  const transacoes = migrada
    ? migrarTransacoesV1(registro.estado.transacoes as Transacao[])
    : (registro.estado.transacoes as Transacao[])
  const resultado = reprocessarTransacoes(transacoes)
  if (!resultado.sucesso) return resultado
  return {
    sucesso: true,
    migrada,
    partida: {
      schemaVersion: SCHEMA_VERSION,
      salvoEm: registro.salvoEm,
      estado: resultado.estado,
    },
  }
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
  const estadoBruto = bruto.estado
  if (!ehObjeto(estadoBruto) || !Array.isArray(estadoBruto.transacoes)) {
    return { sucesso: false, erro: 'Arquivo sem lista de transações válida.' }
  }

  const migracao = migrarPartidaSalva(bruto as unknown as PartidaSalva)
  if (!migracao.sucesso) return migracao
  return {
    sucesso: true,
    estado: migracao.partida.estado,
    migrada: migracao.migrada,
  }
}
