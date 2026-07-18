import { beforeEach, describe, expect, it } from 'vitest'
import type { Estado, Jogador, MovimentoBanco } from '../engine'
import { aplicarAcaoRondel, construirTributacao, criarEstado } from '../engine'
import { carregarPartidaIndexedDB, limparPartidaIndexedDB, salvarPartidaIndexedDB } from './db'
import { carregarEspelho, limparEspelho, salvarEspelho } from './localStorageMirror'
import { exportarJSON, importarJSON, nomeArquivoExport } from './exportImport'
import { SCHEMA_VERSION } from './tipos'

function jogador(over: Partial<Jogador> & { id: string }): Jogador {
  return {
    nome: over.id,
    assento: 0,
    dinheiro: 0,
    obrigacoes: [],
    temBancoSuico: false,
    temCartaInvestidor: false,
    ...over,
  }
}

function estadoDeExemplo() {
  const g = jogador({ id: 'g', nome: 'Ana', dinheiro: 10 })
  let estado = criarEstado([g], { eua: { governanteId: 'g', pontosPoder: 12 } })
  estado = aplicarAcaoRondel(estado, construirTributacao(estado, 'eua', 3, 5, 3))
  return estado
}

beforeEach(async () => {
  await limparPartidaIndexedDB()
  limparEspelho()
})

describe('camada IndexedDB', () => {
  it('salva e carrega deep equal', async () => {
    const estado = estadoDeExemplo()
    await salvarPartidaIndexedDB(estado)

    const salva = await carregarPartidaIndexedDB()
    expect(salva?.schemaVersion).toBe(SCHEMA_VERSION)
    expect(salva?.estado).toEqual(estado)
  })

  it('retorna undefined quando não há save', async () => {
    await expect(carregarPartidaIndexedDB()).resolves.toBeUndefined()
  })
})

describe('espelho localStorage', () => {
  it('salva e carrega deep equal', () => {
    const estado = estadoDeExemplo()
    salvarEspelho(estado)

    const salva = carregarEspelho()
    expect(salva?.estado).toEqual(estado)
  })

  it('serve de fallback quando o IndexedDB "retorna vazio"', async () => {
    const estado = estadoDeExemplo()
    salvarEspelho(estado)

    const doIndexedDB = await carregarPartidaIndexedDB()
    expect(doIndexedDB).toBeUndefined()

    const doEspelho = carregarEspelho()
    expect(doEspelho?.estado).toEqual(estado)
  })
})

describe('export/import JSON', () => {
  it('round-trip: exportar → importar → deep equal', () => {
    const estado = estadoDeExemplo()
    const json = exportarJSON(estado)

    const resultado = importarJSON(json)
    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.estado).toEqual(estado)
    }
  })

  it('migra schema 1 usando a última Tributação como fotografia do mapa', () => {
    const estado = estadoDeExemplo()
    const legado = structuredClone(estado) as unknown as Record<string, unknown>
    const estadoLegado = legado as unknown as Estado
    const inicio = estadoLegado.transacoes[0]
    if (inicio.tipo === 'PartidaIniciada') {
      for (const nacao of Object.values(inicio.estadoInicial.nacoes)) {
        delete (nacao as unknown as { situacao?: unknown }).situacao
      }
    }
    const acao = estadoLegado.transacoes[1]
    if (acao?.tipo === 'AcaoRondel') {
      acao.passos = acao.passos.filter((passo) => passo.tipo !== 'SituacaoMapaAtualizada')
    }

    const resultado = importarJSON(JSON.stringify({
      schemaVersion: 1,
      salvoEm: Date.now(),
      estado: estadoLegado,
    }))
    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.migrada).toBe(true)
      expect(resultado.estado.nacoes.eua.situacao).toEqual({
        fabricasTributaveis: 3,
        territorios: 5,
        unidadesMilitares: 3,
      })
      expect(resultado.estado.nacoes.india.situacao).toEqual({
        fabricasTributaveis: 2,
        territorios: 0,
        unidadesMilitares: 0,
      })
    }
  })

  it('preserva o resultado de desfazer após serializar/desserializar', async () => {
    const { desfazer } = await import('../engine')
    const estado = estadoDeExemplo()
    const desfeito = desfazer(estado)

    const resultado = importarJSON(exportarJSON(desfeito))
    expect(resultado.sucesso).toBe(true)
    if (resultado.sucesso) {
      expect(resultado.estado).toEqual(desfeito)
      expect(resultado.estado.transacoes).toHaveLength(1) // só a PartidaIniciada
    }
  })

  it('nome do arquivo segue imperial-2030-AAAA-MM-DD.json', () => {
    const data = new Date(2026, 6, 18) // mês 0-based: julho
    expect(nomeArquivoExport(data)).toBe('imperial-2030-2026-07-18.json')
  })

  it('rejeita JSON malformado sem tocar em nada', () => {
    const resultado = importarJSON('{ isso não é json')
    expect(resultado.sucesso).toBe(false)
  })

  it('rejeita schemaVersion desconhecida com mensagem clara', () => {
    const resultado = importarJSON(JSON.stringify({ schemaVersion: 999, estado: estadoDeExemplo() }))
    expect(resultado.sucesso).toBe(false)
    if (!resultado.sucesso) {
      expect(resultado.erro).toMatch(/999/)
    }
  })

  it('rejeita e reporta qual transação falha ao reprocessar', () => {
    const estado = estadoDeExemplo()
    const passoCorrompido: MovimentoBanco = {
      tipo: 'MovimentoBanco',
      timestamp: Date.now(),
      rotulo: 'Passo corrompido',
      alvo: { tipo: 'jogador', jogadorId: 'inexistente' },
      delta: -5,
    }
    const corrompido: Estado = {
      ...estado,
      transacoes: [estado.transacoes[0], passoCorrompido],
    }
    const resultado = importarJSON(exportarJSON(corrompido))
    expect(resultado.sucesso).toBe(false)
    if (!resultado.sucesso) {
      expect(resultado.erro).toMatch(/Transação #2/)
    }
  })
})
