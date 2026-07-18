import { describe, expect, it } from 'vitest'
import { capitalInicial } from '../../data/regras'
import { estadoInicialComGovernos } from '../../hooks/useGame'
import {
  NACOES,
  OBRIGACAO_2_POR_CARTAO,
  construirJogadoresEngine,
  construirNacoesParciais,
  quemControla,
  sugerirPortadorInvestidor,
  sortearObrigacoesIniciais,
  totalDaNacao,
  totalEscolhidoPeloJogador,
} from './modelo'

const rngZero = () => 0

describe('sorteio oficial de obrigações iniciais', () => {
  for (const quantidade of [2, 3, 4, 5, 6]) {
    it(`${quantidade} jogadores terminam com 2 milhões e obrigações únicas`, () => {
      const jogadores = Array.from({ length: quantidade }, (_, i) => ({
        id: `j${i}`,
        nome: `Jogador ${i + 1}`,
      }))
      const obrigacoes = sortearObrigacoesIniciais(jogadores, rngZero)
      const investidorId = sugerirPortadorInvestidor(jogadores, obrigacoes)
      const engine = construirJogadoresEngine(
        jogadores,
        capitalInicial(quantidade),
        obrigacoes,
        investidorId,
      )
      const estado = estadoInicialComGovernos(engine, construirNacoesParciais(obrigacoes))

      for (const jogador of jogadores) {
        expect(capitalInicial(quantidade) - totalEscolhidoPeloJogador(obrigacoes, jogador.id)).toBe(2)
        expect(engine.find((item) => item.id === jogador.id)?.dinheiro).toBe(2)
      }
      expect(investidorId).not.toBeNull()
      expect(engine.filter((item) => item.temCartaInvestidor).map((item) => item.id)).toEqual([investidorId])
      for (const nacao of NACOES) {
        const valores = Object.keys(obrigacoes[nacao]).map(Number)
        expect(new Set(valores).size).toBe(valores.length)
        if (valores.length > 0) expect(quemControla(jogadores, obrigacoes, nacao)).not.toBeNull()
        expect(estado.nacoes[nacao].tesouro).toBe(totalDaNacao(obrigacoes, nacao))
        expect(estado.nacoes[nacao].governanteId).toBe(quemControla(jogadores, obrigacoes, nacao))
      }
    })
  }

  it('cada carta entrega 9 da própria nação e 2 da nação vinculada', () => {
    const jogadores = NACOES.map((nacao) => ({ id: nacao, nome: nacao }))
    const obrigacoes = sortearObrigacoesIniciais(jogadores, () => 0.999999)
    for (const cartao of NACOES) {
      expect(obrigacoes[cartao][9]).toBe(cartao)
      expect(obrigacoes[OBRIGACAO_2_POR_CARTAO[cartao]][2]).toBe(cartao)
    }
  })
})
