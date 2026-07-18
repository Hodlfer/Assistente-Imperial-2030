import { describe, expect, it } from 'vitest'
import type { Jogador } from '../../engine'
import {
  aplicarAcaoRondel,
  aplicarAjusteManual,
  construirInvestidorParar,
  construirTributacao,
  criarEstado,
} from '../../engine'
import { construirHistorico, detalhesDaTransacao } from './modelo'

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

describe('construirHistorico', () => {
  it('formata a tributação composta como no exemplo do enunciado da Sessão 5', () => {
    const g = jogador({ id: 'g', nome: 'Ana' })
    let estado = criarEstado([g], { eua: { governanteId: 'g', pontosPoder: 12 } })
    estado = aplicarAcaoRondel(estado, construirTributacao(estado, 'eua', 3, 5, 3))

    const linhas = construirHistorico(estado)
    const linha = linhas[0] // mais recente primeiro
    expect(linha.indice).toBe(2) // #1 PartidaIniciada, #2 Tributação
    expect(linha.titulo).toBe('Tributação — EUA')
    expect(linha.flags).toEqual([
      '+11 tesouro',
      '−3 salários',
      'bônus 2 → Ana',
      '+4 PP (12→16, x3)',
    ])
  })

  it('ordena em reverso (mais recente primeiro) e inclui a Partida iniciada', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { eua: { governanteId: 'g' } })
    estado = aplicarAcaoRondel(estado, construirTributacao(estado, 'eua', 1, 0, 0))

    const linhas = construirHistorico(estado)
    expect(linhas).toHaveLength(2)
    expect(linhas[0].indice).toBe(2)
    expect(linhas[1].indice).toBe(1)
    expect(linhas[1].titulo).toBe('Partida iniciada')
  })

  it('destaca ajuste manual com o motivo', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], {})
    estado = aplicarAjusteManual(
      estado,
      { tipo: 'jogador', jogadorId: 'g', delta: 5 },
      'Correção de contagem na mesa',
    )

    const linha = construirHistorico(estado)[0]
    expect(linha.ehAjusteManual).toBe(true)
    expect(linha.motivo).toBe('Correção de contagem na mesa')
    expect(linha.flags).toEqual(['+5 g'])
  })
})

describe('detalhesDaTransacao', () => {
  it('expande os fluxos individuais de uma ação composta (Investidor)', () => {
    const a = jogador({
      id: 'a',
      nome: 'A',
      dinheiro: 20,
      temCartaInvestidor: true,
      obrigacoes: [{ nacao: 'russia', valor: 6 }],
    })
    let estado = criarEstado([a], { russia: { tesouro: 10, governanteId: 'a' } })
    estado = aplicarAcaoRondel(
      estado,
      construirInvestidorParar(estado, 'russia', { tipo: 'passar' }, {}),
    )

    const detalhes = detalhesDaTransacao(estado, estado.transacoes.length)
    expect(detalhes.length).toBeGreaterThan(0)
    // Ao menos um passo relata os juros pagos ao próprio governante A.
    expect(detalhes.some((linha) => linha.includes('Juros'))).toBe(true)
  })
})
