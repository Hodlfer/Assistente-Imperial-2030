// Helpers puros para o painel de histórico (Sessão 5, item 1). Formata cada
// transação (composta ou primitiva) numa linha legível e — sob demanda — nos
// fluxos individuais expandidos. Nenhum componente React aqui, mesmo padrão
// de src/components/dashboard/modelo.ts.

import type {
  AcaoRondel,
  AjusteManual,
  CartaInvestidorPassada,
  Estado,
  JurosPagos,
  MovimentoBanco,
  Nacao,
  Transacao,
  TipoAcaoRondel,
  TributacaoAplicada,
} from '../../engine'
import { aplicarTransacao, fatorDePoder } from '../../engine'
import { NACOES, NOMES_NACAO } from '../../data/regras'

export interface LinhaHistorico {
  /** Posição na lista `estado.transacoes` (1-based) — o "#N" exibido. */
  indice: number
  tipo: Transacao['tipo']
  timestamp: number
  /** Título legível da transação composta, ex. "Tributação — EUA". */
  titulo: string
  /** Badges curtos com os fluxos principais, ex. "+11 tesouro", "bônus 2 → Ana". */
  flags: string[]
  ehAjusteManual: boolean
  motivo?: string
}

type BuscaNome = (jogadorId: string) => string

function construirBuscaNome(estado: Estado): BuscaNome {
  const mapa = new Map(estado.jogadores.map((j) => [j.id, j.nome]))
  return (id: string) => mapa.get(id) ?? '—'
}

/** `+n`/`−n` com o sinal explícito (menos tipográfico, como no tabuleiro). */
function fmtDelta(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`
}

const TITULOS_ACAO: Record<TipoAcaoRondel, string> = {
  fabrica: 'Fábrica',
  importacao: 'Importação',
  producao: 'Produção',
  manobra: 'Manobra',
  tributacao: 'Tributação',
  investidor: 'Investidor (parou)',
  investidorPassar: 'Investidor (passou)',
  espacosExtras: 'Espaços extras',
}

function tituloDe(t: Transacao, nomes: BuscaNome): string {
  switch (t.tipo) {
    case 'PartidaIniciada':
      return 'Partida iniciada'
    case 'ObrigacaoComprada':
      return `Compra de obrigação ${t.valor} (${NOMES_NACAO[t.nacao]}) — ${nomes(t.jogadorId)}`
    case 'ObrigacaoTrocada':
      return `Upgrade ${t.valorDevolvido}→${t.valorNovo} (${NOMES_NACAO[t.nacao]}) — ${nomes(t.jogadorId)}`
    case 'TributacaoAplicada':
      return `Tributação — ${NOMES_NACAO[t.nacao]}`
    case 'JurosPagos':
      return `Juros — ${NOMES_NACAO[t.nacao]}`
    case 'GovernosRecalculados':
      return 'Recálculo de governos'
    case 'SituacaoMapaAtualizada':
      return 'Situação do mapa atualizada'
    case 'MovimentoBanco':
      return t.rotulo
    case 'CartaInvestidorPassada':
      return `Carta de Investidor: ${nomes(t.deJogadorId)} → ${nomes(t.paraJogadorId)}`
    case 'AjusteManual':
      return `Correção manual: ${t.motivo}`
    case 'AcaoRondel':
      return `${TITULOS_ACAO[t.acao]} — ${NOMES_NACAO[t.nacao]}`
  }
}

function flagsTributacao(
  t: TributacaoAplicada,
  antes: Estado,
  depois: Estado,
  nomes: BuscaNome,
): string[] {
  const r = t.resultado
  const flags: string[] = []
  if (r.aoTesouro > 0) flags.push(`+${r.aoTesouro} tesouro`)
  if (r.salarios > 0) flags.push(`−${r.salarios} salários`)
  const governanteId = antes.nacoes[t.nacao].governanteId
  if (r.bonusGovernante > 0 && governanteId) {
    flags.push(`bônus ${r.bonusGovernante} → ${nomes(governanteId)}`)
  }
  if (r.ganhoPP > 0) {
    const antesPP = antes.nacoes[t.nacao].pontosPoder
    const depoisPP = depois.nacoes[t.nacao].pontosPoder
    flags.push(`+${r.ganhoPP} PP (${antesPP}→${depoisPP}, x${fatorDePoder(depoisPP)})`)
  }
  return flags
}

function flagsJuros(t: JurosPagos, antes: Estado, nomes: BuscaNome): string[] {
  const r = t.resultado
  const flags: string[] = []
  if (r.doTesouro > 0) flags.push(`−${r.doTesouro} tesouro`)
  for (const item of r.porJogador) {
    if (item.recebido > 0) flags.push(`+${item.recebido} ${nomes(item.jogadorId)}`)
  }
  const governanteId = antes.nacoes[t.nacao].governanteId
  if (governanteId && r.doBolsoGovernante > 0) {
    flags.push(`−${r.doBolsoGovernante} ${nomes(governanteId)} (bolso)`)
  }
  if (governanteId && r.governanteAbdicou > 0) {
    flags.push(`${nomes(governanteId)} abdicou de ${r.governanteAbdicou}`)
  }
  return flags
}

function flagsGovernos(antes: Estado, depois: Estado, nomes: BuscaNome): string[] {
  const flags: string[] = []
  for (const nacao of NACOES) {
    const de = antes.nacoes[nacao].governanteId
    const para = depois.nacoes[nacao].governanteId
    if (de !== para) {
      flags.push(`${NOMES_NACAO[nacao]}: ${de ? nomes(de) : '—'} → ${para ? nomes(para) : '—'}`)
    }
  }
  for (const jogador of depois.jogadores) {
    const antesJogador = antes.jogadores.find((j) => j.id === jogador.id)
    if (antesJogador && antesJogador.temBancoSuico !== jogador.temBancoSuico) {
      flags.push(jogador.temBancoSuico ? `🏦 +${nomes(jogador.id)}` : `🏦 −${nomes(jogador.id)}`)
    }
  }
  return flags
}

function flagMovimento(t: MovimentoBanco, nomes: BuscaNome): string {
  if (t.alvo.tipo === 'tesouro') {
    return `${fmtDelta(t.delta)} tesouro (${NOMES_NACAO[t.alvo.nacao]})`
  }
  return `${fmtDelta(t.delta)} ${nomes(t.alvo.jogadorId)}`
}

function flagsAjusteManual(t: AjusteManual, nomes: BuscaNome): string[] {
  const alvo = t.alvo
  switch (alvo.tipo) {
    case 'tesouro':
      return [`${fmtDelta(alvo.delta)} tesouro (${NOMES_NACAO[alvo.nacao]})`]
    case 'jogador':
      return [`${fmtDelta(alvo.delta)} ${nomes(alvo.jogadorId)}`]
    case 'moverObrigacao': {
      const origem = alvo.origemJogadorId
        ? nomes(alvo.origemJogadorId)
        : `pilha (${NOMES_NACAO[alvo.nacao]})`
      const destino = alvo.destinoJogadorId
        ? nomes(alvo.destinoJogadorId)
        : `pilha (${NOMES_NACAO[alvo.nacao]})`
      return [`Obrigação ${alvo.valor}: ${origem} → ${destino}`]
    }
  }
}

function flagsDe(t: Transacao, antes: Estado, depois: Estado, nomes: BuscaNome): string[] {
  switch (t.tipo) {
    case 'PartidaIniciada':
      return []
    case 'ObrigacaoComprada':
      return [`−${t.valor} ${nomes(t.jogadorId)}`, `+${t.valor} tesouro (${NOMES_NACAO[t.nacao]})`]
    case 'ObrigacaoTrocada': {
      const flags = [`${t.valorDevolvido}→${t.valorNovo}`]
      if (t.resultado.diferencaPaga > 0) {
        flags.push(
          `−${t.resultado.diferencaPaga} ${nomes(t.jogadorId)}`,
          `+${t.resultado.diferencaPaga} tesouro (${NOMES_NACAO[t.nacao]})`,
        )
      }
      return flags
    }
    case 'TributacaoAplicada':
      return flagsTributacao(t, antes, depois, nomes)
    case 'JurosPagos':
      return flagsJuros(t, antes, nomes)
    case 'GovernosRecalculados':
      return flagsGovernos(antes, depois, nomes)
    case 'SituacaoMapaAtualizada':
      return Object.entries(t.alteracoes).map(([nacao, situacao]) =>
        `${NOMES_NACAO[nacao as Nacao]}: ${situacao!.fabricasTributaveis} fábr. · ${situacao!.territorios} terr. · ${situacao!.unidadesMilitares} unid.`,
      )
    case 'MovimentoBanco':
      return [flagMovimento(t, nomes)]
    case 'CartaInvestidorPassada':
      return [`${nomes(t.deJogadorId)} → ${nomes(t.paraJogadorId)}`]
    case 'AjusteManual':
      return flagsAjusteManual(t, nomes)
    case 'AcaoRondel':
      return flagsAcaoRondel(t, antes, depois, nomes)
  }
}

function flagsAcaoRondel(t: AcaoRondel, antes: Estado, depois: Estado, nomes: BuscaNome): string[] {
  if (t.acao === 'tributacao') {
    const passo = t.passos.find(
      (p): p is TributacaoAplicada => p.tipo === 'TributacaoAplicada',
    )
    return passo ? flagsTributacao(passo, antes, depois, nomes) : []
  }

  if (t.acao === 'investidor' || t.acao === 'investidorPassar') {
    const flags: string[] = []
    const juros = t.passos.find((p): p is JurosPagos => p.tipo === 'JurosPagos')
    if (juros) flags.push(...flagsJuros(juros, antes, nomes))
    const cartaPassada = t.passos.find(
      (p): p is CartaInvestidorPassada => p.tipo === 'CartaInvestidorPassada',
    )
    if (cartaPassada) flags.push(`+2 ${nomes(cartaPassada.deJogadorId)}`)
    const investimentos = t.passos.filter(
      (p) => p.tipo === 'ObrigacaoComprada' || p.tipo === 'ObrigacaoTrocada',
    ).length
    if (investimentos > 0) {
      flags.push(`${investimentos} investimento${investimentos > 1 ? 's' : ''}`)
    }
    flags.push(...flagsGovernos(antes, depois, nomes))
    if (cartaPassada) flags.push(`carta → ${nomes(cartaPassada.paraJogadorId)}`)
    return flags
  }

  // Fábrica / Importação / Produção / Manobra / Espaços extras: no máximo um
  // passo com efeito monetário (ou nenhum, para Produção/Manobra).
  if (t.passos.length === 0) return []
  if (t.passos.length === 1) return flagsDe(t.passos[0], antes, depois, nomes)

  // Fallback defensivo para composições futuras com mais de um passo.
  const flags: string[] = []
  let atual = antes
  for (const passo of t.passos) {
    const depoisPasso = aplicarTransacao(atual, passo)
    flags.push(...flagsDe(passo, atual, depoisPasso, nomes))
    atual = depoisPasso
  }
  return flags
}

/** Reconstrói o estado após cada transação (fold incremental), para servir de
 *  "antes"/"depois" de cada linha do histórico. */
function estadosAcumulados(estado: Estado): Estado[] {
  const transacoes = estado.transacoes
  const inicio = transacoes[0]
  if (!inicio || inicio.tipo !== 'PartidaIniciada') {
    throw new Error('Histórico requer PartidaIniciada como primeira transação')
  }
  const estados: Estado[] = [
    {
      jogadores: inicio.estadoInicial.jogadores,
      nacoes: inicio.estadoInicial.nacoes,
      transacoes: [inicio],
    },
  ]
  for (let i = 1; i < transacoes.length; i++) {
    estados.push(aplicarTransacao(estados[i - 1], transacoes[i]))
  }
  return estados
}

/** Monta o log de transações em ordem reversa (mais recente primeiro), uma
 *  linha por transação composta (docs da Sessão 5, item 1). */
export function construirHistorico(estado: Estado): LinhaHistorico[] {
  const estados = estadosAcumulados(estado)
  const nomes = construirBuscaNome(estado)
  const linhas: LinhaHistorico[] = []
  for (let i = 0; i < estado.transacoes.length; i++) {
    const t = estado.transacoes[i]
    const antes = i === 0 ? estados[0] : estados[i - 1]
    const depois = estados[i]
    linhas.push({
      indice: i + 1,
      tipo: t.tipo,
      timestamp: t.timestamp,
      titulo: tituloDe(t, nomes),
      flags: t.tipo === 'PartidaIniciada' ? [] : flagsDe(t, antes, depois, nomes),
      ehAjusteManual: t.tipo === 'AjusteManual',
      motivo: t.tipo === 'AjusteManual' ? t.motivo : undefined,
    })
  }
  return linhas.reverse()
}

/** Fluxos individuais de uma transação (expansão sob demanda de uma linha do
 *  histórico) — para uma `AcaoRondel`, um item por passo interno. */
export function detalhesDaTransacao(estado: Estado, indice: number): string[] {
  const estados = estadosAcumulados(estado)
  const nomes = construirBuscaNome(estado)
  const t = estado.transacoes[indice - 1]
  const antes = indice === 1 ? estados[0] : estados[indice - 2]

  if (t.tipo === 'AcaoRondel') {
    const linhas: string[] = []
    let atual = antes
    for (const passo of t.passos) {
      const depoisPasso = aplicarTransacao(atual, passo)
      const flags = flagsDe(passo, atual, depoisPasso, nomes)
      linhas.push(
        flags.length > 0 ? `${tituloDe(passo, nomes)}: ${flags.join(' · ')}` : tituloDe(passo, nomes),
      )
      atual = depoisPasso
    }
    return linhas.length > 0 ? linhas : ['Sem fluxos monetários']
  }

  const depois = estados[indice - 1]
  const flags = flagsDe(t, antes, depois, nomes)
  return flags.length > 0 ? flags : ['Sem fluxos monetários']
}

/** Resumo textual do que uma transação reverteria — usado na confirmação do
 *  desfazer (docs da Sessão 5, item 2). */
export function resumoParaDesfazer(estado: Estado): LinhaHistorico | null {
  if (estado.transacoes.length <= 1) return null
  const linhas = construirHistorico(estado)
  return linhas[0] ?? null
}
