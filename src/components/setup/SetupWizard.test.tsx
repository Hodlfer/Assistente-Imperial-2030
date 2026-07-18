import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

/** Marca a obrigação `valor` de `nacao` para o jogador com a aba ativa. */
function marcarObrigacao(valor: number, nacao: string) {
  fireEvent.click(
    screen.getByLabelText(new RegExp(`^Obrigação ${valor} de ${nacao},`)),
  )
}

function ativarJogador(nome: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(nome) }))
}

describe('SetupWizard — critério de aceite (4 jogadores)', () => {
  it('completa o setup do início ao fim terminando no resumo com governos corretos', () => {
    render(<App />)

    // Etapa 1 — Jogadores: parte de 2, adiciona até 4.
    expect(screen.getByText('Jogadores')).toBeInTheDocument()
    fireEvent.click(screen.getByText('+ Adicionar jogador'))
    fireEvent.click(screen.getByText('+ Adicionar jogador'))
    expect(screen.getByDisplayValue('Jogador 4')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Avançar'))

    // Etapa 2 — Capital inicial: 4 jogadores → 13 milhões.
    expect(screen.getByText('13')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Avançar'))

    // Etapa 3 — Obrigações: cada jogador termina com exatamente 2 de sobra.
    // Jogador 1 (aba ativa por padrão): Rússia 2 + China 9 = 11.
    marcarObrigacao(2, 'Rússia')
    marcarObrigacao(9, 'China')

    ativarJogador('Jogador 2')
    marcarObrigacao(2, 'Índia')
    marcarObrigacao(9, 'Brasil')

    ativarJogador('Jogador 3')
    marcarObrigacao(2, 'EUA')
    marcarObrigacao(9, 'Europa')

    ativarJogador('Jogador 4')
    marcarObrigacao(2, 'China')
    marcarObrigacao(9, 'Índia')

    // Nenhum jogador deveria estar fora do alvo — avança sem aviso.
    fireEvent.click(screen.getByText('Avançar'))
    expect(
      screen.queryByText(/Nem todo jogador ficou com exatamente/),
    ).not.toBeInTheDocument()

    // Etapa 4 — Investidor: aceita a sugestão pré-selecionada.
    expect(screen.getByText('Carta de Investidor')).toBeInTheDocument()
    expect(screen.getByText('Avançar')).not.toBeDisabled()
    fireEvent.click(screen.getByText('Avançar'))

    // Etapa 5 — Resumo: governos corretos (maior soma de valores por nação).
    expect(screen.getByText('Resumo')).toBeInTheDocument()

    const linhaRussia = screen.getByText('Rússia').closest('tr')!
    expect(linhaRussia).toHaveTextContent('Jogador 1')

    const linhaChina = screen.getByText('China').closest('tr')!
    expect(linhaChina).toHaveTextContent('Jogador 1') // 9 > 2

    const linhaIndia = screen.getByText('Índia').closest('tr')!
    expect(linhaIndia).toHaveTextContent('Jogador 4') // 9 > 2

    const linhaBrasil = screen.getByText('Brasil').closest('tr')!
    expect(linhaBrasil).toHaveTextContent('Jogador 2')

    const linhaEua = screen.getByText('EUA').closest('tr')!
    expect(linhaEua).toHaveTextContent('Jogador 3')

    const linhaEuropa = screen.getByText('Europa').closest('tr')!
    expect(linhaEuropa).toHaveTextContent('Jogador 3')

    // Inicia a partida: o wizard some e o dashboard principal assume.
    fireEvent.click(screen.getByText('Iniciar partida'))
    expect(screen.getByText('Correção manual')).toBeInTheDocument()
    expect(screen.queryByText('Resumo')).not.toBeInTheDocument()
  })
})
