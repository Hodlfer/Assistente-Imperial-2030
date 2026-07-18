import type { Estado, Nacao } from '../../engine'
import { somaObrigacoes } from '../../engine'
import { CORES_NACAO } from '../../data/cores'
import { NACOES } from '../../data/regras'

const CORES_JOGADOR = ['#38bdf8', '#f472b6', '#a3e635', '#fb923c', '#c084fc', '#2dd4bf']
const TOTAL_TERRITORIOS = 38

export interface FatiaGrafico {
  id: string
  nome: string
  valor: number
  percentual: number
  cor: string
}

export function distribuicaoTerritorial(estado: Estado): FatiaGrafico[] {
  const controlados = NACOES.reduce(
    (soma, nacao) => soma + estado.nacoes[nacao].situacao.territorios,
    0,
  )
  const naoControlados = Math.max(0, TOTAL_TERRITORIOS - controlados)
  return [
    ...NACOES.map((nacao) => ({
      id: nacao,
      nome: CORES_NACAO[nacao].nome,
      valor: estado.nacoes[nacao].situacao.territorios,
      percentual: (estado.nacoes[nacao].situacao.territorios / TOTAL_TERRITORIOS) * 100,
      cor: CORES_NACAO[nacao].hex,
    })),
    {
      id: 'nao-controlados',
      nome: 'Não controlados',
      valor: naoControlados,
      percentual: (naoControlados / TOTAL_TERRITORIOS) * 100,
      cor: '#475569',
    },
  ]
}

export function controleFinanceiro(estado: Estado, nacao: Nacao): FatiaGrafico[] {
  const valores = estado.jogadores
    .map((jogador, indice) => ({
      id: jogador.id,
      nome: jogador.nome,
      valor: somaObrigacoes(jogador, nacao),
      cor: CORES_JOGADOR[indice % CORES_JOGADOR.length],
    }))
    .filter((item) => item.valor > 0)
  const total = valores.reduce((soma, item) => soma + item.valor, 0)
  return valores.map((item) => ({
    ...item,
    percentual: total > 0 ? (item.valor / total) * 100 : 0,
  }))
}
