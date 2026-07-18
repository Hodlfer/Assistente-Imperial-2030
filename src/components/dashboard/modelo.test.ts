import { describe, expect, it } from 'vitest'
import type { Jogador } from '../../engine'
import { criarEstado } from '../../engine'
import {
  controleLatente,
  nacaoLider,
  nacoesGovernadasPor,
  obrigacoesAgrupadasPorNacao,
} from './modelo'

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

describe('obrigacoesAgrupadasPorNacao', () => {
  it('agrupa por nação, somando valores e juros, e ignora nações sem obrigação', () => {
    const x = jogador({
      id: 'x',
      obrigacoes: [
        { nacao: 'russia', valor: 6 },
        { nacao: 'russia', valor: 9 },
        { nacao: 'china', valor: 12 },
      ],
    })
    const estado = criarEstado([x])

    const grupos = obrigacoesAgrupadasPorNacao(estado, 'x')

    expect(grupos).toContainEqual({ nacao: 'russia', soma: 15, juros: 7 }) // juros 3+4
    expect(grupos).toContainEqual({ nacao: 'china', soma: 12, juros: 5 })
    expect(grupos.find((g) => g.nacao === 'brasil')).toBeUndefined()
  })
})

describe('nacoesGovernadasPor', () => {
  it('retorna as nações cujo governanteId é o jogador', () => {
    const x = jogador({ id: 'x' })
    const estado = criarEstado([x], {
      russia: { governanteId: 'x' },
      brasil: { governanteId: 'x' },
      china: { governanteId: null },
    })

    expect(nacoesGovernadasPor(estado, 'x')).toEqual(['russia', 'brasil'])
    expect(nacoesGovernadasPor(estado, 'inexistente')).toEqual([])
  })
})

describe('nacaoLider', () => {
  it('encontra a nação com mais Pontos de Poder', () => {
    const estado = criarEstado([jogador({ id: 'x' })], {
      russia: { pontosPoder: 10 },
      europa: { pontosPoder: 22 },
      china: { pontosPoder: 5 },
    })

    expect(nacaoLider(estado)).toEqual({ nacao: 'europa', pontosPoder: 22 })
  })
})

describe('controleLatente', () => {
  it('null quando o governante atual já tem a maior soma', () => {
    const gov = jogador({ id: 'g', obrigacoes: [{ nacao: 'russia', valor: 20 }] })
    const outro = jogador({ id: 'o', obrigacoes: [{ nacao: 'russia', valor: 6 }] })
    const estado = criarEstado([gov, outro], { russia: { governanteId: 'g' } })

    expect(controleLatente(estado, 'russia')).toBeNull()
  })

  it('aponta o jogador cuja soma já supera a do governante atual', () => {
    const gov = jogador({ id: 'g', obrigacoes: [{ nacao: 'russia', valor: 6 }] }) // soma 6
    const outro = jogador({ id: 'o', obrigacoes: [{ nacao: 'russia', valor: 20 }] }) // soma 20
    const estado = criarEstado([gov, outro], { russia: { governanteId: 'g' } })

    expect(controleLatente(estado, 'russia')).toEqual({ jogadorId: 'o', soma: 20 })
    // Não deve mudar o governo — só sinalizar.
    expect(estado.nacoes.russia.governanteId).toBe('g')
  })

  it('nação sem governante: qualquer soma > 0 já é um candidato pendente', () => {
    const p = jogador({ id: 'p', obrigacoes: [{ nacao: 'brasil', valor: 4 }] })
    const estado = criarEstado([p], { brasil: { governanteId: null } })

    expect(controleLatente(estado, 'brasil')).toEqual({ jogadorId: 'p', soma: 4 })
  })
})
