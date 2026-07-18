import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Estado, Jogador } from '../../engine'
import { aplicarAcaoRondel, construirTributacao, criarEstado } from '../../engine'
import { useGame } from '../../hooks/useGame'
import { Dashboard } from './Dashboard'

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

/** Harness com o `useGame` real, para exercitar o fim de jogo ponta a ponta
 *  (tributação → 25 PP → placar → undo / nova partida). */
function Harness({ estadoInicial, onNovaPartida }: { estadoInicial: Estado; onNovaPartida: () => void }) {
  const jogo = useGame(estadoInicial)
  return <Dashboard jogo={jogo} onNovaPartida={onNovaPartida} />
}

/** EUA em 22 PP; uma tributação de valor 10 (+3 PP) leva a 25 e encerra. */
function estadoQuaseNoFim(): Estado {
  const g = jogador({ id: 'g', nome: 'Gov', dinheiro: 10, obrigacoes: [{ nacao: 'eua', valor: 12 }] })
  const outro = jogador({ id: 'o', nome: 'Rival', dinheiro: 4 })
  const base = criarEstado([g, outro], { eua: { pontosPoder: 22, governanteId: 'g', tesouro: 20 } })
  // 5 fábricas → tributação 10 → +3 PP → 25 (fim de jogo), com transação desfazível.
  return aplicarAcaoRondel(base, construirTributacao(base, 'eua', 5, 0, 0))
}

describe('PlacarFinal — fim de jogo ponta a ponta', () => {
  it('abre o placar automaticamente ao atingir 25 PP, com detalhamento e vencedor', () => {
    render(<Harness estadoInicial={estadoQuaseNoFim()} onNovaPartida={() => {}} />)

    expect(screen.getByRole('heading', { name: /Placar final/ })).toBeInTheDocument()
    expect(screen.getByText('EUA atingiu 25 Pontos de Poder — a partida terminou.', { exact: false }))
      .toBeInTheDocument()

    // Gov tem obrigação EUA 12 (juros 5) × Fator x5 (25 PP) = 25 pontos.
    expect(screen.getByText('EUA 12')).toBeInTheDocument()
    expect(screen.getByText('5 × 5 =', { exact: false })).toBeInTheDocument()

    // Vencedor destacado (Gov: 25 + dinheiro).
    expect(screen.getByText(/Gov venceu com/)).toBeInTheDocument()
  })

  it('bloqueia as ações do rondel no pós-jogo, mantendo desfazer', () => {
    render(<Harness estadoInicial={estadoQuaseNoFim()} onNovaPartida={() => {}} />)

    // Fecha o placar para chegar ao menu de ações.
    fireEvent.click(screen.getByText('Fechar'))
    fireEvent.click(screen.getByText('Ações'))

    expect(screen.getByText(/ações do rondel bloqueadas/)).toBeInTheDocument()
    expect(screen.queryByText('Tributação')).not.toBeInTheDocument()
    expect(screen.getByText('Desfazer última ação')).toBeEnabled()
  })

  it('desfazer o fim de jogo fecha o placar e reabilita as ações', () => {
    render(<Harness estadoInicial={estadoQuaseNoFim()} onNovaPartida={() => {}} />)

    fireEvent.click(screen.getByText('Desfazer fim de jogo'))

    // Placar sumiu; a partida voltou (EUA abaixo de 25 PP).
    expect(screen.queryByRole('heading', { name: /Placar final/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Ações'))
    expect(screen.getByText('Tributação')).toBeInTheDocument()
  })

  it('nova partida pede confirmação e chama o callback', () => {
    const onNovaPartida = vi.fn()
    render(<Harness estadoInicial={estadoQuaseNoFim()} onNovaPartida={onNovaPartida} />)

    fireEvent.click(screen.getByText('Nova partida'))
    fireEvent.click(screen.getByText('Descartar e começar nova'))
    expect(onNovaPartida).toHaveBeenCalledTimes(1)
  })
})
