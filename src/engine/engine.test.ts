import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import {
  aplicarTributacao,
  calcularGovernante,
  comprarObrigacao,
  criarEstado,
  desfazer,
  pagarJuros,
  recalcularGovernos,
  trocarObrigacao,
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

describe('A — controle e recálculo de governo', () => {
  it('X (Rússia 15) governa; Y compra a de 4 (16) e passa a governar', () => {
    const x = jogador({
      id: 'x',
      dinheiro: 50,
      obrigacoes: [
        { nacao: 'russia', valor: 6 },
        { nacao: 'russia', valor: 9 },
      ],
    })
    const y = jogador({
      id: 'y',
      dinheiro: 50,
      obrigacoes: [{ nacao: 'russia', valor: 12 }],
    })

    let estado = criarEstado([x, y])
    estado = recalcularGovernos(estado)
    expect(estado.nacoes.russia.governanteId).toBe('x') // 15 > 12

    // Y compra a obrigação de 4 → total 16.
    estado = comprarObrigacao(estado, 'y', 'russia', 4)
    estado = recalcularGovernos(estado)
    expect(estado.nacoes.russia.governanteId).toBe('y') // 16 > 15
  })

  it('empate → governo NÃO muda (mantém o atual)', () => {
    // 15=15 é irrealizável com cartas distintas de uma nação; usamos 18=18,
    // que exercita exatamente a mesma regra de desempate.
    const x = jogador({
      id: 'x',
      obrigacoes: [
        { nacao: 'russia', valor: 2 },
        { nacao: 'russia', valor: 16 },
      ],
    })
    const y = jogador({
      id: 'y',
      obrigacoes: [
        { nacao: 'russia', valor: 6 },
        { nacao: 'russia', valor: 12 },
      ],
    })

    const estado = criarEstado([x, y], { russia: { governanteId: 'x' } })
    expect(calcularGovernante(estado, 'russia')).toBe('x') // empate 18=18
    expect(recalcularGovernos(estado).nacoes.russia.governanteId).toBe('x')
  })
})

describe('B — upgrade de obrigação (exemplo do manual)', () => {
  it('devolver China 4 e pegar China 12: paga 8 ao tesouro; a de 4 volta à pilha', () => {
    const p = jogador({
      id: 'p',
      dinheiro: 20,
      obrigacoes: [{ nacao: 'china', valor: 4 }],
    })
    let estado = criarEstado([p])
    expect(estado.nacoes.china.obrigacoesDisponiveis).toContain(12)
    expect(estado.nacoes.china.obrigacoesDisponiveis).not.toContain(4)

    estado = trocarObrigacao(estado, 'p', 'china', 4, 12)

    const jog = estado.jogadores[0]
    expect(jog.dinheiro).toBe(12) // 20 − 8
    expect(estado.nacoes.china.tesouro).toBe(8)
    expect(jog.obrigacoes).toEqual([{ nacao: 'china', valor: 12 }])
    expect(estado.nacoes.china.obrigacoesDisponiveis).toContain(4) // voltou
    expect(estado.nacoes.china.obrigacoesDisponiveis).not.toContain(12)
  })
})

describe('C — tributação (exemplo do manual)', () => {
  it('EUA 3 fábricas + 5 bandeiras + 3 unidades: +11 tesouro, −3 salários, +2 gov, +4 PP', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { eua: { governanteId: 'g' } })

    estado = aplicarTributacao(estado, 'eua', 3, 5, 3)

    const t = estado.transacoes[estado.transacoes.length - 1]
    expect(t.tipo).toBe('TributacaoAplicada')
    if (t.tipo === 'TributacaoAplicada') {
      expect(t.resultado).toEqual({
        tributacao: 11,
        aoTesouro: 11,
        salarios: 3,
        bonusGovernante: 2,
        ganhoPP: 4,
      })
    }

    expect(estado.nacoes.eua.tesouro).toBe(6) // 0 + 11 − 3 − 2
    expect(estado.nacoes.eua.pontosPoder).toBe(4)
    expect(estado.jogadores[0].dinheiro).toBe(2) // bônus recebido
  })
})

describe('E — juros insuficientes', () => {
  it('tesouro 4; gov devido 3, outro devido 5 → outro recebe 5, gov abdica e fica −1', () => {
    const gov = jogador({ id: 'g', obrigacoes: [{ nacao: 'russia', valor: 6 }] }) // juros 3
    const outro = jogador({
      id: 'o',
      obrigacoes: [{ nacao: 'russia', valor: 12 }], // juros 5
    })
    let estado = criarEstado([gov, outro], {
      russia: { tesouro: 4, governanteId: 'g' },
    })

    estado = pagarJuros(estado, 'russia')

    const g = estado.jogadores.find((j) => j.id === 'g')!
    const o = estado.jogadores.find((j) => j.id === 'o')!
    expect(o.dinheiro).toBe(5) // 4 do tesouro + 1 do bolso do governante
    expect(g.dinheiro).toBe(-1) // abdicou dos 3 e completou 1 do bolso
    expect(estado.nacoes.russia.tesouro).toBe(0)

    const t = estado.transacoes[estado.transacoes.length - 1]
    if (t.tipo === 'JurosPagos') {
      expect(t.resultado.doTesouro).toBe(4)
      expect(t.resultado.doBolsoGovernante).toBe(1)
      expect(t.resultado.governanteAbdicou).toBe(3)
    }
  })
})

describe('F — undo', () => {
  it('aplicar tributação e desfazer devolve estado idêntico', () => {
    const g = jogador({ id: 'g' })
    const antes = criarEstado([g], { eua: { governanteId: 'g' } })

    const depois = aplicarTributacao(antes, 'eua', 3, 5, 3)
    const desfeito = desfazer(depois)

    expect(desfeito.jogadores).toEqual(antes.jogadores)
    expect(desfeito.nacoes).toEqual(antes.nacoes)
    expect(desfeito.transacoes).toHaveLength(1) // só PartidaIniciada
  })
})

describe('G — nação órfã', () => {
  it('nenhuma obrigação em mãos → governanteId null', () => {
    const p = jogador({ id: 'p', obrigacoes: [{ nacao: 'russia', valor: 6 }] })
    const estado = criarEstado([p])

    expect(calcularGovernante(estado, 'brasil')).toBeNull()
    expect(recalcularGovernos(estado).nacoes.brasil.governanteId).toBeNull()
  })
})

describe('Invariantes', () => {
  it('comprar obrigação fora da pilha lança erro', () => {
    // A de 6 já está em mãos de X → não está na pilha disponível.
    const x = jogador({
      id: 'x',
      dinheiro: 50,
      obrigacoes: [{ nacao: 'russia', valor: 6 }],
    })
    const estado = criarEstado([x])
    expect(() => comprarObrigacao(estado, 'x', 'russia', 6)).toThrow()
  })

  it('troca por valor menor ou igual lança erro', () => {
    const x = jogador({
      id: 'x',
      dinheiro: 50,
      obrigacoes: [{ nacao: 'china', valor: 12 }],
    })
    const estado = criarEstado([x])
    expect(() => trocarObrigacao(estado, 'x', 'china', 12, 4)).toThrow() // menor
    expect(() => trocarObrigacao(estado, 'x', 'china', 12, 12)).toThrow() // igual
  })

  it('não muta o estado de entrada (imutabilidade)', () => {
    const x = jogador({ id: 'x', dinheiro: 50 })
    const estado = criarEstado([x])
    const antesDinheiro = estado.jogadores[0].dinheiro
    comprarObrigacao(estado, 'x', 'russia', 4)
    expect(estado.jogadores[0].dinheiro).toBe(antesDinheiro) // inalterado
    expect(estado.transacoes).toHaveLength(1)
  })
})
