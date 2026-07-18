// Helpers de apresentação das ações do rondel: opções válidas de compra/upgrade
// para os seletores e formatação dos fluxos de dinheiro. Puros (sem React) para
// poderem ser testados sem renderizar (mesmo padrão de dashboard/modelo.ts).

import type { EscolhaInvestimento, Estado, Jogador, Nacao } from '../../../engine'
import { jurosDaObrigacao } from '../../../engine'
import { NACOES } from '../../../data/regras'

/** Formata um delta de dinheiro com sinal (usa − tipográfico). */
export function formatarDelta(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `−${Math.abs(n)}`
  return '0'
}

export interface OpcaoCompra {
  nacao: Nacao
  valor: number
}

/** Obrigações disponíveis (em qualquer nação) que cabem em `dinheiro`. */
export function comprasDisponiveis(estado: Estado, dinheiro: number): OpcaoCompra[] {
  const opcoes: OpcaoCompra[] = []
  for (const nacao of NACOES) {
    for (const valor of estado.nacoes[nacao].obrigacoesDisponiveis) {
      if (valor <= dinheiro) opcoes.push({ nacao, valor })
    }
  }
  return opcoes
}

export interface OpcaoUpgrade {
  nacao: Nacao
  valorDevolvido: number
  valorNovo: number
  diferenca: number
}

/** Upgrades válidos para um jogador: para cada obrigação em mãos, cada valor
 *  disponível MAIOR da mesma nação cuja diferença cabe em `dinheiro`
 *  (docs/REGRAS.md §Regras monetárias, upgrade). */
export function upgradesDisponiveis(
  estado: Estado,
  jogador: Jogador,
  dinheiro: number,
): OpcaoUpgrade[] {
  const opcoes: OpcaoUpgrade[] = []
  for (const obrigacao of jogador.obrigacoes) {
    for (const valorNovo of estado.nacoes[obrigacao.nacao].obrigacoesDisponiveis) {
      const diferenca = valorNovo - obrigacao.valor
      if (valorNovo > obrigacao.valor && diferenca <= dinheiro) {
        opcoes.push({
          nacao: obrigacao.nacao,
          valorDevolvido: obrigacao.valor,
          valorNovo,
          diferenca,
        })
      }
    }
  }
  return opcoes
}

/** Descrição curta de uma escolha de investimento, para o preview/resumo. */
export function descreverEscolha(
  escolha: EscolhaInvestimento,
  nomeNacao: (n: Nacao) => string,
): string {
  switch (escolha.tipo) {
    case 'comprar':
      return `compra ${escolha.valor} de ${nomeNacao(escolha.nacao)} (juros ${jurosDaObrigacao(escolha.valor)})`
    case 'upgrade':
      return `upgrade ${escolha.valorDevolvido}→${escolha.valorNovo} de ${nomeNacao(escolha.nacao)} (paga ${escolha.valorNovo - escolha.valorDevolvido})`
    case 'passar':
      return 'passa'
  }
}
