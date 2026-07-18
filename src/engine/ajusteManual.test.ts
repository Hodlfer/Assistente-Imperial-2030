import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import { aplicarAjusteManual, criarEstado, desfazer } from './index'

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

describe('AjusteManual — correção manual (válvula de escape)', () => {
  it('exige motivo não vazio', () => {
    const estado = criarEstado([jogador({ id: 'x' })])
    expect(() =>
      aplicarAjusteManual(estado, { tipo: 'jogador', jogadorId: 'x', delta: 5 }, '  '),
    ).toThrow()
  })

  it('ajusta o tesouro de uma nação', () => {
    let estado = criarEstado([jogador({ id: 'x' })])
    estado = aplicarAjusteManual(
      estado,
      { tipo: 'tesouro', nacao: 'russia', delta: 7 },
      'Correção de contagem na mesa',
    )
    expect(estado.nacoes.russia.tesouro).toBe(7)

    estado = aplicarAjusteManual(
      estado,
      { tipo: 'tesouro', nacao: 'russia', delta: -3 },
      'Ajuste de troco',
    )
    expect(estado.nacoes.russia.tesouro).toBe(4)
  })

  it('ajusta o dinheiro de um jogador, podendo ficar negativo', () => {
    const x = jogador({ id: 'x', dinheiro: 5 })
    let estado = criarEstado([x])
    estado = aplicarAjusteManual(
      estado,
      { tipo: 'jogador', jogadorId: 'x', delta: -10 },
      'Pagamento esquecido na mesa',
    )
    expect(estado.jogadores[0].dinheiro).toBe(-5)
  })

  it('move uma obrigação da pilha disponível para um jogador', () => {
    let estado = criarEstado([jogador({ id: 'x' })])
    expect(estado.nacoes.china.obrigacoesDisponiveis).toContain(12)

    estado = aplicarAjusteManual(
      estado,
      {
        tipo: 'moverObrigacao',
        nacao: 'china',
        valor: 12,
        origemJogadorId: null,
        destinoJogadorId: 'x',
      },
      'Obrigação estava com o jogador errado',
    )

    expect(estado.jogadores[0].obrigacoes).toEqual([{ nacao: 'china', valor: 12 }])
    expect(estado.nacoes.china.obrigacoesDisponiveis).not.toContain(12)
  })

  it('move uma obrigação entre dois jogadores', () => {
    const x = jogador({ id: 'x', obrigacoes: [{ nacao: 'brasil', valor: 9 }] })
    const y = jogador({ id: 'y' })
    let estado = criarEstado([x, y])

    estado = aplicarAjusteManual(
      estado,
      {
        tipo: 'moverObrigacao',
        nacao: 'brasil',
        valor: 9,
        origemJogadorId: 'x',
        destinoJogadorId: 'y',
      },
      'Troca combinada fora do app',
    )

    expect(estado.jogadores.find((j) => j.id === 'x')!.obrigacoes).toEqual([])
    expect(estado.jogadores.find((j) => j.id === 'y')!.obrigacoes).toEqual([
      { nacao: 'brasil', valor: 9 },
    ])
  })

  it('lança erro ao mover obrigação que o jogador de origem não possui', () => {
    const estado = criarEstado([jogador({ id: 'x' })])
    expect(() =>
      aplicarAjusteManual(
        estado,
        {
          tipo: 'moverObrigacao',
          nacao: 'brasil',
          valor: 9,
          origemJogadorId: 'x',
          destinoJogadorId: null,
        },
        'motivo',
      ),
    ).toThrow()
  })

  it('aparece no histórico e é desfazível', () => {
    const antes = criarEstado([jogador({ id: 'x' })])
    const depois = aplicarAjusteManual(
      antes,
      { tipo: 'jogador', jogadorId: 'x', delta: 3 },
      'Correção de saldo',
    )
    expect(depois.transacoes.at(-1)?.tipo).toBe('AjusteManual')

    const desfeito = desfazer(depois)
    expect(desfeito.jogadores).toEqual(antes.jogadores)
    expect(desfeito.transacoes).toHaveLength(1)
  })
})
