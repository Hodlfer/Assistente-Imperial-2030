import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import {
  bonusEPontosTributacao,
  criarEstado,
  fatorDePoder,
  jurosDaObrigacao,
  pontuacaoJogador,
  valorPontuacaoObrigacao,
} from './index'

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

describe('jurosDaObrigacao', () => {
  it('deriva juros dos valores de obrigação', () => {
    expect(jurosDaObrigacao(12)).toBe(5) // âncora do manual
    expect(jurosDaObrigacao(16)).toBe(6) // âncora do manual
    expect(jurosDaObrigacao(2)).toBe(1)
    expect(jurosDaObrigacao(30)).toBe(9)
  })

  it('lança erro para valor inexistente', () => {
    expect(() => jurosDaObrigacao(7)).toThrow()
  })
})

describe('fatorDePoder', () => {
  it('usa os degraus da trilha de poder', () => {
    expect(fatorDePoder(17)).toBe(3) // exemplo do manual
    expect(fatorDePoder(11)).toBe(2) // exemplo do manual
    expect(fatorDePoder(0)).toBe(0)
    expect(fatorDePoder(4)).toBe(0)
    expect(fatorDePoder(5)).toBe(1)
    expect(fatorDePoder(25)).toBe(5)
  })
})

describe('C2 — bonusEPontosTributacao por degraus', () => {
  it('7 usa o degrau 6', () => {
    expect(bonusEPontosTributacao(7)).toEqual(bonusEPontosTributacao(6))
    expect(bonusEPontosTributacao(7)).toEqual({ bonus: 1, pp: 1 })
  })

  it('9 usa o degrau 8', () => {
    expect(bonusEPontosTributacao(9)).toEqual(bonusEPontosTributacao(8))
    expect(bonusEPontosTributacao(9)).toEqual({ bonus: 1, pp: 2 })
  })

  it('17 usa o degrau 16', () => {
    expect(bonusEPontosTributacao(17)).toEqual(bonusEPontosTributacao(16))
    expect(bonusEPontosTributacao(17)).toEqual({ bonus: 5, pp: 9 })
  })

  it('23 cai na faixa 18+', () => {
    expect(bonusEPontosTributacao(23)).toEqual({ bonus: 5, pp: 10 })
  })

  it('0–5 não pontua', () => {
    expect(bonusEPontosTributacao(0)).toEqual({ bonus: 0, pp: 0 })
    expect(bonusEPontosTributacao(5)).toEqual({ bonus: 0, pp: 0 })
  })
})

describe('D — pontuação final', () => {
  it('Índia 17 PP (x3): obrigação de 12 (juros 5) vale 15', () => {
    const p = jogador({ id: 'p', obrigacoes: [{ nacao: 'india', valor: 12 }] })
    const estado = criarEstado([p], { india: { pontosPoder: 17 } })

    expect(valorPontuacaoObrigacao(estado, { nacao: 'india', valor: 12 })).toBe(
      15,
    )
  })

  it('soma obrigações pontuadas + dinheiro restante', () => {
    const p = jogador({
      id: 'p',
      dinheiro: 3,
      obrigacoes: [{ nacao: 'india', valor: 12 }],
    })
    const estado = criarEstado([p], { india: { pontosPoder: 17 } })

    expect(pontuacaoJogador(estado, estado.jogadores[0])).toBe(18) // 15 + 3
  })
})
