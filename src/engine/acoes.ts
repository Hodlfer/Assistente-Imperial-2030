// Construtores das ações do rondel (docs/REGRAS.md §Regras monetárias; enunciado
// da Sessão 4). Cada ação é montada como UMA transação composta (`AcaoRondel`)
// e desfeita de uma vez. Os passos são construídos encadeando os helpers puros
// do engine sobre um estado espelho; a fatia de transações resultante vira os
// `passos` da composta — assim o preview lê os `resultado` já calculados e o
// fold reaplica exatamente os mesmos passos.

import type {
  AcaoRondel,
  Estado,
  Jogador,
  JurosPagos,
  Nacao,
  TipoAcaoRondel,
  TributacaoAplicada,
} from './types'
import { NACOES, NOMES_NACAO } from '../data/regras'
import { fatorDePoder } from './poder'
import {
  comprarObrigacao,
  movimentoBanco,
  pagarJuros,
  passarCartaInvestidor,
  aplicarTributacao,
  recalcularGovernos,
  trocarObrigacao,
} from './estado'

/** Escolha de investimento de um jogador na ação de Investidor. */
export type EscolhaInvestimento =
  | { tipo: 'comprar'; nacao: Nacao; valor: number }
  | { tipo: 'upgrade'; nacao: Nacao; valorDevolvido: number; valorNovo: number }
  | { tipo: 'passar' }

// --- Cursor de turno ---------------------------------------------------------

/** Próxima nação sugerida na ordem de turno: a seguinte, na ordem cíclica, à
 *  nação da última ação do rondel registrada. Rússia quando ainda não houve
 *  nenhuma ação (docs/REGRAS.md §Nações; enunciado Sessão 4, item 1). */
export function nacaoAtivaSugerida(estado: Estado): Nacao {
  for (let i = estado.transacoes.length - 1; i >= 0; i--) {
    const t = estado.transacoes[i]
    if (t.tipo === 'AcaoRondel') {
      const idx = NACOES.indexOf(t.nacao)
      return NACOES[(idx + 1) % NACOES.length]
    }
  }
  return NACOES[0]
}

// --- Helpers de assento / carta ----------------------------------------------

/** Jogador que porta a carta de Investidor, se houver. */
export function portadorCarta(estado: Estado): Jogador | undefined {
  return estado.jogadores.find((j) => j.temCartaInvestidor)
}

/** Próximo jogador em sentido horário (por assento) a partir de um jogador. */
export function proximoHorario(estado: Estado, jogadorId: string): Jogador {
  const ordenados = [...estado.jogadores].sort((a, b) => a.assento - b.assento)
  const idx = ordenados.findIndex((j) => j.id === jogadorId)
  return ordenados[(idx + 1) % ordenados.length]
}

/** Donos de Banco Suíço (sem a carta de Investidor) na ordem de investimento:
 *  horária a partir da esquerda do portador da carta (assento seguinte ao dele)
 *  (docs/REGRAS.md §Regras monetárias, ação de Investidor, etapa 3). */
export function ordemBancosSuicos(estado: Estado, portadorId: string): Jogador[] {
  const portador = estado.jogadores.find((j) => j.id === portadorId)
  const base = portador ? portador.assento : 0
  const total = estado.jogadores.length || 1
  const dist = (assento: number) => (((assento - base - 1) % total) + total) % total
  return estado.jogadores
    .filter((j) => j.temBancoSuico && j.id !== portadorId)
    .sort((a, b) => dist(a.assento) - dist(b.assento))
}

// --- Espaços extras ----------------------------------------------------------

/** Custo de `espacos` espaços extras: n × (1 + Fator de Poder da nação), pago
 *  pelo jogador governante (docs/REGRAS.md §Regras monetárias). */
export function custoEspacosExtras(estado: Estado, nacao: Nacao, espacos: number): number {
  return espacos * (1 + fatorDePoder(estado.nacoes[nacao].pontosPoder))
}

// --- Fábrica de AcaoRondel ---------------------------------------------------

/** Encapsula os passos gerados por `construir` numa única `AcaoRondel`. */
function comporAcao(
  estadoBase: Estado,
  acao: TipoAcaoRondel,
  nacao: Nacao,
  rotulo: string,
  construir: (estado: Estado) => Estado,
): AcaoRondel {
  const depois = construir(estadoBase)
  const passos = depois.transacoes.slice(estadoBase.transacoes.length)
  return {
    tipo: 'AcaoRondel',
    timestamp: Date.now(),
    rotulo,
    acao,
    nacao,
    passos,
  }
}

const nomeNacao = (nacao: Nacao) => NOMES_NACAO[nacao]

// --- Ações simples -----------------------------------------------------------

/** Fábrica: tesouro paga 5 ao banco (docs/REGRAS.md §Regras monetárias). */
export function construirFabrica(estado: Estado, nacao: Nacao): AcaoRondel {
  return comporAcao(estado, 'fabrica', nacao, `Fábrica (${nomeNacao(nacao)})`, (e) =>
    movimentoBanco(e, { tipo: 'tesouro', nacao }, -5, `Fábrica: tesouro −5 (${nomeNacao(nacao)})`),
  )
}

/** Importação: tesouro paga 1 por unidade (1–3) ao banco. */
export function construirImportacao(
  estado: Estado,
  nacao: Nacao,
  unidades: number,
): AcaoRondel {
  const n = Math.max(1, Math.min(3, unidades))
  return comporAcao(
    estado,
    'importacao',
    nacao,
    `Importação ${n} (${nomeNacao(nacao)})`,
    (e) =>
      movimentoBanco(
        e,
        { tipo: 'tesouro', nacao },
        -n,
        `Importação: tesouro −${n} (${nomeNacao(nacao)})`,
      ),
  )
}

/** Produção: sem efeito monetário — registrada como log do turno. */
export function construirProducao(estado: Estado, nacao: Nacao): AcaoRondel {
  return comporAcao(estado, 'producao', nacao, `Produção (${nomeNacao(nacao)})`, (e) => e)
}

/** Manobra: sem efeito monetário — registrada como log do turno. */
export function construirManobra(estado: Estado, nacao: Nacao): AcaoRondel {
  return comporAcao(estado, 'manobra', nacao, `Manobra (${nomeNacao(nacao)})`, (e) => e)
}

/** Espaços extras: n × (1 + Fator de Poder), do dinheiro pessoal do governante. */
export function construirEspacosExtras(
  estado: Estado,
  nacao: Nacao,
  espacos: number,
): AcaoRondel {
  const governanteId = estado.nacoes[nacao].governanteId
  if (!governanteId) {
    throw new Error(`${nomeNacao(nacao)} não tem governante para pagar os espaços extras`)
  }
  const custo = custoEspacosExtras(estado, nacao, espacos)
  return comporAcao(
    estado,
    'espacosExtras',
    nacao,
    `Espaços extras ${espacos} (${nomeNacao(nacao)})`,
    (e) =>
      movimentoBanco(
        e,
        { tipo: 'jogador', jogadorId: governanteId },
        -custo,
        `Espaços extras: governante −${custo} (${nomeNacao(nacao)})`,
      ),
  )
}

// --- Tributação --------------------------------------------------------------

/** Tributação (4 etapas) como ação composta. */
export function construirTributacao(
  estado: Estado,
  nacao: Nacao,
  fabricas: number,
  bandeiras: number,
  unidades: number,
): AcaoRondel {
  return comporAcao(estado, 'tributacao', nacao, `Tributação (${nomeNacao(nacao)})`, (e) =>
    aplicarTributacao(e, nacao, fabricas, bandeiras, unidades),
  )
}

// --- Investidor --------------------------------------------------------------

/** Aplica a escolha de investimento de um jogador (compra/upgrade/passar).
 *  Exportada para o preview incremental do Investidor na UI. */
export function aplicarEscolhaInvestimento(
  estado: Estado,
  jogadorId: string,
  escolha: EscolhaInvestimento,
): Estado {
  switch (escolha.tipo) {
    case 'comprar':
      return comprarObrigacao(estado, jogadorId, escolha.nacao, escolha.valor)
    case 'upgrade':
      return trocarObrigacao(
        estado,
        jogadorId,
        escolha.nacao,
        escolha.valorDevolvido,
        escolha.valorNovo,
      )
    case 'passar':
      return estado
  }
}

/** Núcleo comum das duas variantes do Investidor. `comJuros=false` é o "passar
 *  por cima" (só etapas 2 e 3), que NÃO paga juros (docs/REGRAS.md §Regras
 *  monetárias, ação de Investidor; enunciado Sessão 4, itens 4 e 5). */
function construirInvestidor(
  estado: Estado,
  nacaoAtiva: Nacao,
  comJuros: boolean,
  escolhaPortador: EscolhaInvestimento,
  investimentosBanco: Record<string, EscolhaInvestimento>,
): AcaoRondel {
  const portador = portadorCarta(estado)
  if (!portador) {
    throw new Error('Nenhum jogador tem a carta de Investidor')
  }
  const bancos = ordemBancosSuicos(estado, portador.id)
  const acao: TipoAcaoRondel = comJuros ? 'investidor' : 'investidorPassar'
  const rotulo = comJuros
    ? `Investidor — parou (${nomeNacao(nacaoAtiva)})`
    : `Investidor — passou (${nomeNacao(nacaoAtiva)})`

  return comporAcao(estado, acao, nacaoAtiva, rotulo, (e0) => {
    let e = e0
    // Etapa 1 (só ao parar): juros da nação ativa.
    if (comJuros) e = pagarJuros(e, nacaoAtiva)
    // Etapa 2: portador recebe +2 do banco e escolhe seu investimento.
    e = movimentoBanco(
      e,
      { tipo: 'jogador', jogadorId: portador.id },
      2,
      `Carta de Investidor: +2 do banco (${portador.nome})`,
    )
    e = aplicarEscolhaInvestimento(e, portador.id, escolhaPortador)
    // Etapa 3: cada Banco Suíço investe na ordem horária a partir do portador.
    for (const banco of bancos) {
      e = aplicarEscolhaInvestimento(e, banco.id, investimentosBanco[banco.id] ?? { tipo: 'passar' })
    }
    // Recalcular governos (desempate horário a partir do portador) e passar a carta.
    e = recalcularGovernos(e, portador.id)
    e = passarCartaInvestidor(e, portador.id, proximoHorario(e, portador.id).id)
    return e
  })
}

/** Investidor — parar no espaço: etapas 1–3 + recálculo + passagem da carta. */
export function construirInvestidorParar(
  estado: Estado,
  nacaoAtiva: Nacao,
  escolhaPortador: EscolhaInvestimento,
  investimentosBanco: Record<string, EscolhaInvestimento> = {},
): AcaoRondel {
  return construirInvestidor(estado, nacaoAtiva, true, escolhaPortador, investimentosBanco)
}

/** Investidor — apenas passar por cima: etapas 2 e 3, sem juros. */
export function construirInvestidorPassar(
  estado: Estado,
  nacaoAtiva: Nacao,
  escolhaPortador: EscolhaInvestimento,
  investimentosBanco: Record<string, EscolhaInvestimento> = {},
): AcaoRondel {
  return construirInvestidor(estado, nacaoAtiva, false, escolhaPortador, investimentosBanco)
}

// --- Seletores sobre uma AcaoRondel construída (para preview) -----------------

/** Extrai o resultado do pagamento de juros de uma ação, se houver. */
export function jurosDaAcao(acao: AcaoRondel): JurosPagos | null {
  return (acao.passos.find((p) => p.tipo === 'JurosPagos') as JurosPagos) ?? null
}

/** Extrai a transação de tributação de uma ação, se houver. */
export function tributacaoDaAcao(acao: AcaoRondel): TributacaoAplicada | null {
  return (
    (acao.passos.find((p) => p.tipo === 'TributacaoAplicada') as TributacaoAplicada) ?? null
  )
}

export interface TrocaGoverno {
  nacao: Nacao
  de: string | null
  para: string | null
}

/** Nações cujo governante mudou entre dois estados (para o resumo do Investidor). */
export function governosTrocados(antes: Estado, depois: Estado): TrocaGoverno[] {
  const trocas: TrocaGoverno[] = []
  for (const nacao of NACOES) {
    const de = antes.nacoes[nacao].governanteId
    const para = depois.nacoes[nacao].governanteId
    if (de !== para) trocas.push({ nacao, de, para })
  }
  return trocas
}
