import { describe, expect, it } from 'vitest'
import type { Jogador } from '../../engine'
import { atualizarSituacaoMapa, criarEstado } from '../../engine'
import { controleFinanceiro, distribuicaoTerritorial } from './estatisticasModelo'

const jogadores: Jogador[] = [
  { id: 'a', nome: 'Ana', assento: 0, dinheiro: 0, obrigacoes: [{ nacao: 'china', valor: 12 }], temBancoSuico: false, temCartaInvestidor: false },
  { id: 'b', nome: 'Beto', assento: 1, dinheiro: 0, obrigacoes: [{ nacao: 'china', valor: 4 }], temBancoSuico: false, temCartaInvestidor: false },
]

describe('modelos do painel estatístico', () => {
  it('pizza territorial sempre totaliza as 38 regiões neutras', () => {
    let estado = criarEstado(jogadores)
    estado = atualizarSituacaoMapa(estado, {
      china: { fabricasTributaveis: 2, territorios: 8, unidadesMilitares: 0 },
      brasil: { fabricasTributaveis: 2, territorios: 6, unidadesMilitares: 0 },
    })
    const fatias = distribuicaoTerritorial(estado)
    expect(fatias.reduce((soma, fatia) => soma + fatia.valor, 0)).toBe(38)
    expect(fatias.find((fatia) => fatia.id === 'nao-controlados')?.valor).toBe(24)
  })

  it('controle financeiro usa somente obrigações compradas', () => {
    const fatias = controleFinanceiro(criarEstado(jogadores), 'china')
    expect(fatias.map((fatia) => fatia.valor)).toEqual([12, 4])
    expect(fatias[0].percentual).toBe(75)
    expect(fatias[1].percentual).toBe(25)
    expect(controleFinanceiro(criarEstado(jogadores), 'india')).toEqual([])
  })
})
