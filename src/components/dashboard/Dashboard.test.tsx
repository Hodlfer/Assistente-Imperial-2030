import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

function carregarFixture() {
  render(<App />)
  fireEvent.click(screen.getByText('Carregar exemplo (dev): 6 jogadores'))
}

/** As 6 nações aparecem tanto no cartão da nação quanto nos cartões de
 *  jogadores que têm obrigações dela — por isso `getAllByText`, não `getByText`. */
function cartaoDaNacao(ariaLabelAviso: string) {
  const aviso = screen.getByLabelText(ariaLabelAviso)
  return aviso.closest('div')!.parentElement!
}

describe('Dashboard — critério de aceite (6 jogadores, fixture de dev)', () => {
  it('mostra as 6 nações com tesouro, poder e governo', () => {
    carregarFixture()

    for (const nome of ['Rússia', 'China', 'Índia', 'Brasil', 'EUA', 'Europa']) {
      expect(screen.getAllByText(nome).length).toBeGreaterThan(0)
    }

    // Índia é órfã no fixture (governanteId null) → pula o turno.
    expect(screen.getByText('— (pula o turno)')).toBeInTheDocument()

    // Europa começa com 22 PP (≥20) → aviso de fim de jogo próximo.
    expect(screen.getByText('Fim de jogo próximo')).toBeInTheDocument()
  })

  it('sinaliza controle latente (Rússia e Brasil) sem mudar o governante exibido', () => {
    carregarFixture()

    expect(screen.getByLabelText('Controle pendente de Rússia')).toBeInTheDocument()
    expect(screen.getByLabelText('Controle pendente de Brasil')).toBeInTheDocument()
    // China, EUA e Europa não têm controle pendente no fixture.
    expect(screen.queryByLabelText('Controle pendente de China')).not.toBeInTheDocument()

    const cartaoRussia = cartaoDaNacao('Controle pendente de Rússia')
    // Governante exibido continua o atual (j1) — o aviso só sinaliza.
    expect(within(cartaoRussia).getByText('Alexandre da Silva Nogueira Filho')).toBeInTheDocument()
  })

  it('mostra os 6 jogadores, incluindo nomes longos, com badges e destaque de governo', () => {
    carregarFixture()

    for (const nome of [
      'Alexandre da Silva Nogueira Filho',
      'Beatriz',
      'Carlos Eduardo Machado de Barros Júnior',
      'Diana',
      'Elias',
      'Fernanda',
    ]) {
      expect(screen.getByTitle(nome)).toBeInTheDocument()
    }

    // Beatriz tem a carta de Investidor (💼); Diana tem Banco Suíço (🏦, não governa nada).
    expect(screen.getByTitle('Carta de Investidor')).toBeInTheDocument()
    expect(screen.getByTitle('Banco Suíço')).toBeInTheDocument()

    // Fernanda governa a Europa.
    expect(screen.getByText('Governa: Europa')).toBeInTheDocument()
  })

  it('toggle de ocultar dinheiro é por jogador, independente, e começa visível', () => {
    carregarFixture()

    fireEvent.click(screen.getByLabelText('Ocultar dinheiro de Beatriz'))

    expect(screen.getByLabelText('Mostrar dinheiro de Beatriz')).toBeInTheDocument()
    // Outro jogador continua visível — o toggle não é global.
    expect(screen.getByLabelText('Ocultar dinheiro de Diana')).toBeInTheDocument()
  })

  it('abre "Correção manual" e aplica um ajuste de tesouro pelo pipeline de transações', () => {
    carregarFixture()

    const cartaoRussiaAntes = cartaoDaNacao('Controle pendente de Rússia')
    const linhaTesouroAntes = within(cartaoRussiaAntes).getByText('Tesouro')
    expect(linhaTesouroAntes.parentElement).toHaveTextContent('25') // tesouro inicial do fixture

    fireEvent.click(screen.getByText('Correção manual'))
    expect(screen.getByRole('heading', { name: 'Correção manual' })).toBeInTheDocument()

    // Nação default do formulário já é Rússia (primeira da lista).
    fireEvent.change(screen.getByLabelText('Ajuste no tesouro (+/−)'), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByLabelText('Motivo (obrigatório)'), {
      target: { value: 'Correção de contagem na mesa' },
    })
    fireEvent.click(screen.getByText('Aplicar correção'))

    // O modal fecha após aplicar.
    expect(screen.queryByRole('heading', { name: 'Correção manual' })).not.toBeInTheDocument()

    const cartaoRussiaDepois = cartaoDaNacao('Controle pendente de Rússia')
    const linhaTesouroDepois = within(cartaoRussiaDepois).getByText('Tesouro')
    expect(linhaTesouroDepois.parentElement).toHaveTextContent('30') // 25 + 5
  })

  it('bloqueia a correção manual sem motivo', () => {
    carregarFixture()

    fireEvent.click(screen.getByText('Correção manual'))
    expect(screen.getByText('Aplicar correção')).toBeDisabled()
  })

  it('abre o menu do botão flutuante "Ações" com as ações do rondel ativas', () => {
    carregarFixture()

    fireEvent.click(screen.getByText('Ações'))
    expect(screen.getByText('Fábrica')).toBeEnabled()
    expect(screen.getByText('Tributação')).toBeEnabled()
    expect(screen.getByText('Investidor — parar')).toBeEnabled()

    // Abrir "Fábrica" leva ao modal com o seletor de nação ativa.
    fireEvent.click(screen.getByText('Fábrica'))
    expect(screen.getByRole('heading', { name: 'Fábrica' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nação ativa')).toBeInTheDocument()
  })
})
