import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import {
  aplicarAcaoRondel,
  atualizarSituacaoMapa,
  construirTributacao,
  criarEstado,
  desfazer,
  preverTributacao,
} from './index'

const jogador: Jogador = {
  id: 'g',
  nome: 'Governo',
  assento: 0,
  dinheiro: 0,
  obrigacoes: [],
  temBancoSuico: false,
  temCartaInvestidor: false,
}

describe('situação tributária do mapa', () => {
  it('começa em 2 fábricas, 0 territórios e 0 unidades', () => {
    const estado = criarEstado([jogador])
    expect(estado.nacoes.india.situacao).toEqual({
      fabricasTributaveis: 2,
      territorios: 0,
      unidadesMilitares: 0,
    })
  })

  it('atualiza várias nações, valida limites e é desfazível', () => {
    const antes = criarEstado([jogador])
    const depois = atualizarSituacaoMapa(antes, {
      eua: { fabricasTributaveis: 4, territorios: 10, unidadesMilitares: 16 },
      brasil: { fabricasTributaveis: 1, territorios: 8, unidadesMilitares: 3 },
    })
    expect(depois.nacoes.eua.situacao.territorios).toBe(10)
    expect(desfazer(depois).nacoes).toEqual(antes.nacoes)
    expect(() => atualizarSituacaoMapa(antes, {
      eua: { fabricasTributaveis: 5, territorios: 0, unidadesMilitares: 0 },
    })).toThrow(/Fábricas/)
    expect(() => atualizarSituacaoMapa(antes, Object.fromEntries(
      ['russia', 'china', 'india'].map((nacao) => [nacao, {
        fabricasTributaveis: 2,
        territorios: 15,
        unidadesMilitares: 0,
      }]),
    ))).toThrow(/38/)
  })

  it('prevê tesouro insuficiente e segmenta o consumo militar', () => {
    const estado = criarEstado([jogador], { eua: { governanteId: 'g', tesouro: 0 } })
    const previa = preverTributacao(estado, 'eua', {
      fabricasTributaveis: 2,
      territorios: 2,
      unidadesMilitares: 9,
    })
    expect(previa.resultado.tributacao).toBe(6)
    expect(previa.resultado.salarios).toBe(6)
    expect(previa.consumoDoTributo).toBe(6)
    expect(previa.excedenteMilitar).toBe(3)
    expect(previa.excedenteCobertoPeloTesouro).toBe(0)
    expect(previa.salariosNaoPagos).toBe(3)
    expect(previa.tesouroFinal).toBe(0)
  })

  it('mostra quanto do excedente militar é coberto pelo tesouro', () => {
    const estado = criarEstado([jogador], { eua: { governanteId: 'g', tesouro: 5 } })
    const previa = preverTributacao(estado, 'eua', {
      fabricasTributaveis: 2,
      territorios: 2,
      unidadesMilitares: 9,
    })
    expect(previa.resultado.salarios).toBe(9)
    expect(previa.excedenteCobertoPeloTesouro).toBe(3)
    expect(previa.salariosNaoPagos).toBe(0)
    expect(previa.tesouroFinal).toBe(1) // 5 + 6 − 9 salários − 1 bônus
  })

  it('Tributação registra situação e efeito financeiro em um único undo', () => {
    const antes = criarEstado([jogador], { eua: { governanteId: 'g' } })
    const acao = construirTributacao(antes, 'eua', 3, 5, 3)
    expect(acao.passos.map((passo) => passo.tipo)).toEqual([
      'SituacaoMapaAtualizada',
      'TributacaoAplicada',
    ])
    const depois = aplicarAcaoRondel(antes, acao)
    expect(depois.nacoes.eua.situacao).toEqual({
      fabricasTributaveis: 3,
      territorios: 5,
      unidadesMilitares: 3,
    })
    expect(desfazer(depois).nacoes).toEqual(antes.nacoes)
  })
})
