import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Estado, Jogador } from '../../../engine'
import { criarEstado } from '../../../engine'
import type { UseGameResult } from '../../../hooks/useGame'
import { TributacaoModal } from './TributacaoModal'
import { InvestidorModal } from './InvestidorModal'

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

/** Stub de `useGame` para os modais: a prévia só depende de `estado`; `dispatch`
 *  é espionado para verificar a confirmação. */
function jogoStub(estado: Estado): UseGameResult {
  return {
    estado,
    erro: null,
    dispatch: vi.fn(),
    desfazer: vi.fn(),
    refazer: vi.fn(),
    podeDesfazer: estado.transacoes.length > 1,
    podeRefazer: false,
    iniciarPartida: vi.fn(),
    carregarEstado: vi.fn(),
    limparErro: vi.fn(),
  }
}

describe('Critério de aceite C — tributação EUA na UI', () => {
  it('EUA 3 fábricas + 5 bandeiras + 3 unidades: preview das 4 etapas correto', () => {
    const g = jogador({ id: 'g', nome: 'Gov' })
    const estado = criarEstado([g], { eua: { governanteId: 'g' } })
    const jogo = jogoStub(estado)

    render(
      <TributacaoModal
        estado={estado}
        jogo={jogo}
        nacaoInicial="eua"
        onFechar={() => {}}
        onFimDeJogo={() => {}}
      />,
    )

    fireEvent.change(screen.getByLabelText('Fábricas não-ocup.'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Bandeiras'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Unid. militares'), { target: { value: '3' } })

    // Etapa 1: +11 ao tesouro (2×3 + 5).
    expect(
      screen.getByText('Tesouro → banco (salários):', { exact: false }).closest('p'),
    ).toHaveTextContent('−3')
    expect(
      screen.getByText('Tesouro → governante (bônus):', { exact: false }).closest('p'),
    ).toHaveTextContent('+2 a Gov')
    expect(screen.getByText('+4 PP')).toBeInTheDocument()

    // Tesouro final: 0 + 11 − 3 − 2 = 6.
    expect(screen.getByText('Tesouro EUA').parentElement).toHaveTextContent('0 → 6')

    fireEvent.click(screen.getByText('Confirmar tributação'))
    expect(jogo.dispatch).toHaveBeenCalledTimes(1)
  })
})

describe('Critério de aceite B — upgrade China na UI', () => {
  it('portador troca China 4 por China 12 pagando 8', () => {
    const ana = jogador({
      id: 'a',
      nome: 'Ana',
      assento: 0,
      dinheiro: 20,
      temCartaInvestidor: true,
      obrigacoes: [{ nacao: 'china', valor: 4 }],
    })
    const estado = criarEstado([ana])
    const jogo = jogoStub(estado)

    render(
      <InvestidorModal
        comJuros
        estado={estado}
        jogo={jogo}
        nacaoInicial="russia"
        onFechar={() => {}}
      />,
    )

    // Etapa 2: escolher Upgrade e selecionar 4→12.
    fireEvent.click(screen.getByText('Upgrade'))
    fireEvent.change(screen.getByLabelText('Upgrade de Ana'), {
      target: { value: 'china:4:12' },
    })

    // A opção mostra a diferença a pagar (mesma nação, valor maior).
    expect(screen.getByText('China 4→12 (paga 8)')).toBeInTheDocument()

    // Resumo reflete a troca.
    const resumo = screen.getByText('Resumo ao confirmar').closest('section')!
    expect(within(resumo).getByText('Ana: upgrade 4→12 de China (paga 8)')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Confirmar Investidor'))
    expect(jogo.dispatch).toHaveBeenCalledTimes(1)
  })
})
