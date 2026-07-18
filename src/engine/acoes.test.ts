import { describe, expect, it } from 'vitest'
import type { Jogador } from './index'
import {
  aplicarAcaoRondel,
  construirEspacosExtras,
  construirFabrica,
  construirImportacao,
  construirInvestidorParar,
  construirInvestidorPassar,
  construirProducao,
  construirTributacao,
  criarEstado,
  custoEspacosExtras,
  desfazer,
  jurosDaAcao,
  nacaoAtivaSugerida,
  ordemBancosSuicos,
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

describe('ações simples', () => {
  it('Fábrica debita 5 do tesouro numa única transação composta', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { eua: { tesouro: 12 } })

    estado = aplicarAcaoRondel(estado, construirFabrica(estado, 'eua'))

    expect(estado.nacoes.eua.tesouro).toBe(7)
    const t = estado.transacoes[estado.transacoes.length - 1]
    expect(t.tipo).toBe('AcaoRondel')
    expect(desfazer(estado).nacoes.eua.tesouro).toBe(12) // desfeita de uma vez
  })

  it('Importação debita 1 por unidade (clamp 1–3)', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { china: { tesouro: 10 } })
    estado = aplicarAcaoRondel(estado, construirImportacao(estado, 'china', 3))
    expect(estado.nacoes.china.tesouro).toBe(7)
  })

  it('Produção não tem efeito monetário, mas registra a ação no histórico', () => {
    const g = jogador({ id: 'g' })
    const estado = criarEstado([g], { russia: { tesouro: 5 } })
    const depois = aplicarAcaoRondel(estado, construirProducao(estado, 'russia'))
    expect(depois.nacoes.russia.tesouro).toBe(5)
    expect(depois.transacoes).toHaveLength(2) // PartidaIniciada + AcaoRondel
    const t = depois.transacoes[1]
    expect(t.tipo === 'AcaoRondel' && t.acao).toBe('producao')
  })
})

describe('espaços extras', () => {
  it('custo = n × (1 + Fator de Poder) do dinheiro do governante', () => {
    const g = jogador({ id: 'g', dinheiro: 20 })
    const estado = criarEstado([g], { eua: { pontosPoder: 17, governanteId: 'g' } }) // x3

    expect(custoEspacosExtras(estado, 'eua', 2)).toBe(8) // 2 × (1 + 3)

    const depois = aplicarAcaoRondel(estado, construirEspacosExtras(estado, 'eua', 2))
    expect(depois.jogadores[0].dinheiro).toBe(12) // 20 − 8
  })

  it('lança se a nação não tem governante', () => {
    const g = jogador({ id: 'g' })
    const estado = criarEstado([g], { eua: { governanteId: null } })
    expect(() => construirEspacosExtras(estado, 'eua', 1)).toThrow()
  })
})

describe('cursor de turno', () => {
  it('sugere a próxima nação na ordem após a última ação; Rússia sem ações', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { china: { tesouro: 10 } })
    expect(nacaoAtivaSugerida(estado)).toBe('russia')

    estado = aplicarAcaoRondel(estado, construirImportacao(estado, 'china', 1))
    expect(nacaoAtivaSugerida(estado)).toBe('india') // china → india
  })
})

describe('Investidor — ponta a ponta (parar)', () => {
  // A (portador, gov. da Rússia) tem juros insuficientes na Rússia, dá upgrade
  // em China; B (Banco Suíço) investe no Brasil; governos trocam; carta passa.
  function cenario() {
    const a = jogador({
      id: 'a',
      nome: 'A',
      assento: 0,
      dinheiro: 20,
      temCartaInvestidor: true,
      obrigacoes: [
        { nacao: 'russia', valor: 6 }, // juros 3 (governante)
        { nacao: 'china', valor: 4 }, // vai virar 12
      ],
    })
    const b = jogador({
      id: 'b',
      nome: 'B',
      assento: 1,
      dinheiro: 10,
      temBancoSuico: true,
    })
    const c = jogador({
      id: 'c',
      nome: 'C',
      assento: 2,
      dinheiro: 0,
      obrigacoes: [{ nacao: 'russia', valor: 12 }], // juros 5
    })
    return criarEstado([a, b, c], {
      russia: { tesouro: 4, governanteId: 'a' },
      china: { tesouro: 0, governanteId: null },
      brasil: { tesouro: 0, governanteId: null },
    })
  }

  it('aplica juros insuficientes + upgrade + banco suíço + troca de governo + carta, tudo de uma vez', () => {
    const estado = cenario()

    expect(ordemBancosSuicos(estado, 'a').map((j) => j.id)).toEqual(['b'])

    const acao = construirInvestidorParar(
      estado,
      'russia',
      { tipo: 'upgrade', nacao: 'china', valorDevolvido: 4, valorNovo: 12 },
      { b: { tipo: 'comprar', nacao: 'brasil', valor: 6 } },
    )
    const depois = aplicarAcaoRondel(estado, acao)

    const a = depois.jogadores.find((j) => j.id === 'a')!
    const b = depois.jogadores.find((j) => j.id === 'b')!
    const c = depois.jogadores.find((j) => j.id === 'c')!

    // Juros: C recebe 5 (4 do tesouro + 1 do bolso de A); A abdica dos 3 e paga 1.
    // Dinheiro de A: 20 − 1 (bolso) + 2 (carta) − 8 (upgrade) = 13.
    expect(a.dinheiro).toBe(13)
    expect(c.dinheiro).toBe(5)
    // B investe 6 no Brasil: 10 − 6 = 4.
    expect(b.dinheiro).toBe(4)

    // Tesouros.
    expect(depois.nacoes.russia.tesouro).toBe(0) // 4 − 4
    expect(depois.nacoes.china.tesouro).toBe(8) // diferença do upgrade
    expect(depois.nacoes.brasil.tesouro).toBe(6) // compra do Banco Suíço

    // Obrigações após o upgrade.
    expect(a.obrigacoes).toContainEqual({ nacao: 'china', valor: 12 })
    expect(depois.nacoes.china.obrigacoesDisponiveis).toContain(4) // a de 4 voltou
    expect(depois.nacoes.china.obrigacoesDisponiveis).not.toContain(12)

    // Troca de governos: Rússia passa para C (12 > 6); China para A; Brasil para B.
    expect(depois.nacoes.russia.governanteId).toBe('c')
    expect(depois.nacoes.china.governanteId).toBe('a')
    expect(depois.nacoes.brasil.governanteId).toBe('b')

    // Banco Suíço redistribuído: todos governam algo → ninguém tem Banco Suíço.
    expect(depois.jogadores.every((j) => !j.temBancoSuico)).toBe(true)

    // Carta de Investidor passa de A para B (próximo assento horário).
    expect(a.temCartaInvestidor).toBe(false)
    expect(b.temCartaInvestidor).toBe(true)

    // É UMA transação composta, desfeita de uma vez.
    const t = depois.transacoes[depois.transacoes.length - 1]
    expect(t.tipo).toBe('AcaoRondel')
    const revertido = desfazer(depois)
    expect(revertido.jogadores).toEqual(estado.jogadores)
    expect(revertido.nacoes).toEqual(estado.nacoes)
  })

  it('passar por cima NÃO paga juros (só etapas 2 e 3)', () => {
    const estado = cenario()

    const acao = construirInvestidorPassar(estado, 'russia', { tipo: 'passar' }, {})
    expect(jurosDaAcao(acao)).toBeNull()

    const depois = aplicarAcaoRondel(estado, acao)
    const c = depois.jogadores.find((j) => j.id === 'c')!

    // C não recebeu juros e o tesouro da Rússia ficou intacto.
    expect(c.dinheiro).toBe(0)
    expect(depois.nacoes.russia.tesouro).toBe(4)

    // Mas o portador A ainda recebeu os +2 e a carta ainda passou.
    const a = depois.jogadores.find((j) => j.id === 'a')!
    const b = depois.jogadores.find((j) => j.id === 'b')!
    expect(a.dinheiro).toBe(22) // 20 + 2, A passou (ficou só com os +2)
    expect(b.temCartaInvestidor).toBe(true)
  })
})

describe('Fim de jogo ao PULAR o Investidor (caso especial do manual)', () => {
  // Se os 25 PP já foram atingidos e a nação apenas passou por cima do
  // Investidor, as etapas 2–3 (investimentos) NÃO acontecem — nem os juros da
  // etapa 1, que só ocorrem ao parar (docs/REGRAS.md; enunciado Sessão 6, item 1).
  function cenario() {
    const a = jogador({
      id: 'a',
      nome: 'A',
      assento: 0,
      dinheiro: 20,
      temCartaInvestidor: true,
      obrigacoes: [{ nacao: 'china', valor: 4 }],
    })
    const b = jogador({ id: 'b', nome: 'B', assento: 1, dinheiro: 10, temBancoSuico: true })
    // EUA já com 25 PP: o jogo terminou.
    return criarEstado([a, b], { eua: { pontosPoder: 25 }, china: { tesouro: 0 } })
  }

  it('passar por cima com o jogo já encerrado não faz investimentos nem passa a carta', () => {
    const estado = cenario()

    const acao = construirInvestidorPassar(
      estado,
      'russia',
      { tipo: 'upgrade', nacao: 'china', valorDevolvido: 4, valorNovo: 12 },
      { b: { tipo: 'comprar', nacao: 'brasil', valor: 6 } },
    )
    // Nenhum passo: etapas 2–3 ignoradas.
    expect(acao.passos).toHaveLength(0)

    const depois = aplicarAcaoRondel(estado, acao)
    const a = depois.jogadores.find((j) => j.id === 'a')!
    const b = depois.jogadores.find((j) => j.id === 'b')!

    // Portador NÃO recebeu os +2, carta NÃO passou, nenhum investimento aplicado.
    expect(a.dinheiro).toBe(20)
    expect(a.temCartaInvestidor).toBe(true)
    expect(a.obrigacoes).toEqual([{ nacao: 'china', valor: 4 }])
    expect(b.dinheiro).toBe(10)
    expect(depois.nacoes.brasil.tesouro).toBe(0)
  })

  it('parar no espaço ainda funciona normalmente mesmo com o jogo encerrado', () => {
    const estado = cenario()
    const acao = construirInvestidorParar(estado, 'russia', { tipo: 'passar' }, {})
    // Ao parar, o portador ainda recebe os +2 (etapas seguem).
    expect(acao.passos.length).toBeGreaterThan(0)
  })
})

describe('Tributação como ação do rondel (cenário C do manual)', () => {
  it('EUA 3 fábricas + 5 bandeiras + 3 unidades', () => {
    const g = jogador({ id: 'g' })
    let estado = criarEstado([g], { eua: { governanteId: 'g' } })
    estado = aplicarAcaoRondel(estado, construirTributacao(estado, 'eua', 3, 5, 3))

    expect(estado.nacoes.eua.tesouro).toBe(6)
    expect(estado.nacoes.eua.pontosPoder).toBe(4)
    expect(estado.jogadores[0].dinheiro).toBe(2)
  })
})
