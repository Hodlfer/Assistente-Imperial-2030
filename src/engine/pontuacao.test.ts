import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import {
  classificacaoFinal,
  criarEstado,
  detalharPontuacaoJogador,
  jogoTerminou,
  nacoesEncerrando,
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

describe('fim de jogo', () => {
  it('dispara quando alguma nação atinge 25 PP', () => {
    const p = jogador({ id: 'p' })
    expect(jogoTerminou(criarEstado([p], { eua: { pontosPoder: 24 } }))).toBe(false)
    const encerrado = criarEstado([p], { eua: { pontosPoder: 25 } })
    expect(jogoTerminou(encerrado)).toBe(true)
    expect(nacoesEncerrando(encerrado)).toEqual(['eua'])
  })
})

describe('D — pontuação final detalhada (exemplo do manual)', () => {
  it('Índia 17 PP (x3): obrigação de 12 (juros 5) vale 15, e soma com o dinheiro', () => {
    const p = jogador({
      id: 'p',
      dinheiro: 3,
      obrigacoes: [{ nacao: 'india', valor: 12 }],
    })
    const estado = criarEstado([p], { india: { pontosPoder: 17 } })

    const detalhe = detalharPontuacaoJogador(estado, estado.jogadores[0])
    expect(detalhe.obrigacoes).toEqual([
      { nacao: 'india', valor: 12, juros: 5, fator: 3, pontos: 15 },
    ])
    expect(detalhe.subtotalObrigacoes).toBe(15)
    expect(detalhe.dinheiro).toBe(3)
    expect(detalhe.total).toBe(18) // 15 + 3
  })
})

describe('desempate', () => {
  it('desempata em duas camadas: a primeira nação (maior PP) empata, a segunda decide', () => {
    // Índia 20 PP (x4), China 15 PP (x3); demais 0.
    const a = jogador({
      id: 'a',
      nome: 'A',
      dinheiro: 0,
      obrigacoes: [
        { nacao: 'india', valor: 6 }, // juros 3 × x4 = 12
        { nacao: 'china', valor: 6 }, // juros 3 × x3 = 9
      ],
    })
    const b = jogador({
      id: 'b',
      nome: 'B',
      dinheiro: 3,
      obrigacoes: [
        { nacao: 'india', valor: 6 }, // 12
        { nacao: 'china', valor: 4 }, // juros 2 × x3 = 6
      ],
    })
    const estado = criarEstado([a, b], {
      india: { pontosPoder: 20 },
      china: { pontosPoder: 15 },
    })

    const classificacao = classificacaoFinal(estado)

    // Totais empatados em 21 (A: 21+0; B: 18+3).
    expect(classificacao.map((e) => e.detalhe.total)).toEqual([21, 21])

    // 1ª camada (Índia, 20 PP): somas iguais (6 e 6) → não decide.
    // 2ª camada (China, 15 PP): A (6) > B (4) → A vence.
    expect(classificacao[0].jogador.id).toBe('a')
    expect(classificacao[0].posicao).toBe(1)
    expect(classificacao[0].desempate).toEqual({ nacao: 'china', pontosPoder: 15 })
    expect(classificacao[0].empateReal).toBe(false)

    expect(classificacao[1].jogador.id).toBe('b')
    expect(classificacao[1].posicao).toBe(2)
  })

  it('declara empate real quando total e somas em todas as nações são iguais', () => {
    const a = jogador({ id: 'a', nome: 'A', dinheiro: 5, obrigacoes: [{ nacao: 'india', valor: 6 }] })
    const b = jogador({ id: 'b', nome: 'B', dinheiro: 5, obrigacoes: [{ nacao: 'india', valor: 6 }] })
    const estado = criarEstado([a, b], { india: { pontosPoder: 20 } })

    const classificacao = classificacaoFinal(estado)

    expect(classificacao.every((e) => e.empateReal)).toBe(true)
    // Empatados compartilham a colocação.
    expect(classificacao.map((e) => e.posicao)).toEqual([1, 1])
    expect(classificacao.every((e) => e.desempate === null)).toBe(true)
  })
})
