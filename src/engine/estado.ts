import type {
  AcaoRondel,
  AjusteManual,
  AlvoAjusteManual,
  CartaInvestidorPassada,
  Estado,
  EstadoNacao,
  Jogador,
  JurosPagos,
  MovimentoBanco,
  Nacao,
  ObrigacaoComprada,
  ObrigacaoTrocada,
  Transacao,
  TributacaoAplicada,
} from './types'
import { NACOES, PP_MAXIMO, VALORES_OBRIGACAO } from '../data/regras'
import { jurosDevidos } from './obrigacoes'
import { bonusEPontosTributacao } from './tributacao'
import { aplicarRecalculoGovernos } from './governo'

/** Parte do estado que as transações efetivamente transformam (sem histórico). */
type Substrato = Pick<Estado, 'jogadores' | 'nacoes'>

// --- Criação da partida ------------------------------------------------------

/** Cria o estado inicial e registra a transação `PartidaIniciada` com o snapshot
 *  usado para reconstruir o estado no undo (docs/ARQUITETURA.md §Tudo é transação).
 *
 *  `obrigacoesDisponiveis` de cada nação, quando não informado, é a pilha
 *  completa menos as obrigações já em mãos dos jogadores. */
export function criarEstado(
  jogadores: Jogador[],
  nacoesParciais: Partial<Record<Nacao, Partial<EstadoNacao>>> = {},
): Estado {
  const nacoes = {} as Record<Nacao, EstadoNacao>
  for (const nacao of NACOES) {
    const emMaos = jogadores.flatMap((j) =>
      j.obrigacoes.filter((o) => o.nacao === nacao).map((o) => o.valor),
    )
    const disponiveisPadrao = removerCada([...VALORES_OBRIGACAO], emMaos)
    const parcial = nacoesParciais[nacao] ?? {}
    nacoes[nacao] = {
      tesouro: parcial.tesouro ?? 0,
      pontosPoder: parcial.pontosPoder ?? 0,
      governanteId: parcial.governanteId ?? null,
      obrigacoesDisponiveis:
        parcial.obrigacoesDisponiveis ?? disponiveisPadrao,
    }
  }

  const estado: Estado = { jogadores, nacoes, transacoes: [] }
  estado.transacoes.push({
    tipo: 'PartidaIniciada',
    timestamp: Date.now(),
    rotulo: 'Partida iniciada',
    estadoInicial: structuredClone({ jogadores, nacoes }),
  })
  return estado
}

// --- Aplicação e undo --------------------------------------------------------

/** Aplica uma transação e retorna um NOVO estado (pura, sem mutar a entrada).
 *  Valida os invariantes e lança erros descritivos. */
export function aplicarTransacao(estado: Estado, t: Transacao): Estado {
  const sub = aplicarEfeito({ jogadores: estado.jogadores, nacoes: estado.nacoes }, t)
  return { ...sub, transacoes: [...estado.transacoes, t] }
}

/** Remove a última transação e reconstrói o estado por fold do snapshot inicial
 *  sobre as transações restantes (docs/ARQUITETURA.md §Tudo é transação). */
export function desfazer(estado: Estado): Estado {
  // Só há a `PartidaIniciada`: nada a desfazer.
  if (estado.transacoes.length <= 1) return estado

  const restantes = estado.transacoes.slice(0, -1)
  const inicio = estado.transacoes[0]
  if (inicio.tipo !== 'PartidaIniciada') {
    throw new Error('Estado sem snapshot inicial: não é possível desfazer')
  }

  let sub: Substrato = structuredClone(inicio.estadoInicial)
  for (const t of restantes.slice(1)) {
    sub = aplicarEfeito(sub, t)
  }
  return { ...sub, transacoes: restantes }
}

/** Núcleo puro: clona o substrato, aplica o efeito da transação e o retorna.
 *  Recalcula sempre a partir dos inputs da transação (replay-safe). */
function aplicarEfeito(base: Substrato, t: Transacao): Substrato {
  const sub: Substrato = structuredClone(base)
  aplicarEfeitoEmSub(sub, t)
  return sub
}

/** Aplica o efeito da transação MUTANDO `sub` in-place (já clonado por quem
 *  chama). Uma ação composta (`AcaoRondel`) replica cada passo em sequência
 *  sobre o mesmo substrato, o que mantém tudo replay-safe. */
function aplicarEfeitoEmSub(sub: Substrato, t: Transacao): void {
  switch (t.tipo) {
    case 'PartidaIniciada':
      // Marcador; o snapshot já é o ponto de partida do fold.
      break
    case 'ObrigacaoComprada':
      efeitoCompra(sub, t)
      break
    case 'ObrigacaoTrocada':
      efeitoTroca(sub, t)
      break
    case 'TributacaoAplicada':
      mutarTributacao(sub, t.nacao, planejarTributacao(sub, t.nacao, t.fabricas, t.bandeiras, t.unidades))
      break
    case 'JurosPagos':
      mutarJuros(sub, t.nacao, planejarJuros(sub, t.nacao))
      break
    case 'GovernosRecalculados':
      aplicarRecalculoGovernos(sub as Estado, t.portadorId)
      break
    case 'MovimentoBanco':
      efeitoMovimentoBanco(sub, t)
      break
    case 'CartaInvestidorPassada':
      efeitoCartaInvestidor(sub, t)
      break
    case 'AcaoRondel':
      for (const passo of t.passos) aplicarEfeitoEmSub(sub, passo)
      break
    case 'AjusteManual':
      efeitoAjusteManual(sub, t)
      break
  }
}

// --- Helpers de substrato ----------------------------------------------------

function acharJogador(sub: Substrato, id: string): Jogador {
  const jogador = sub.jogadores.find((j) => j.id === id)
  if (!jogador) throw new Error(`Jogador não encontrado: ${id}`)
  return jogador
}

/** Remove a primeira ocorrência de `valor` do array (in-place). */
function removerPrimeiro(arr: number[], valor: number): boolean {
  const idx = arr.indexOf(valor)
  if (idx < 0) return false
  arr.splice(idx, 1)
  return true
}

/** Retorna `origem` sem a primeira ocorrência de cada item de `remover`. */
function removerCada(origem: number[], remover: number[]): number[] {
  const resultado = [...origem]
  for (const valor of remover) removerPrimeiro(resultado, valor)
  return resultado
}

// --- Compra de obrigação -----------------------------------------------------

function efeitoCompra(sub: Substrato, t: ObrigacaoComprada): void {
  const jogador = acharJogador(sub, t.jogadorId)
  const nacao = sub.nacoes[t.nacao]
  if (!nacao.obrigacoesDisponiveis.includes(t.valor)) {
    throw new Error(
      `Obrigação de ${t.valor} de ${t.nacao} não está na pilha disponível`,
    )
  }
  if (jogador.dinheiro < t.valor) {
    throw new Error(
      `${jogador.nome} não tem dinheiro (${jogador.dinheiro}) para comprar obrigação de ${t.valor}`,
    )
  }
  jogador.dinheiro -= t.valor
  nacao.tesouro += t.valor
  removerPrimeiro(nacao.obrigacoesDisponiveis, t.valor)
  jogador.obrigacoes.push({ nacao: t.nacao, valor: t.valor })
}

/** Compra uma obrigação disponível: o jogador paga o valor ao tesouro da nação. */
export function comprarObrigacao(
  estado: Estado,
  jogadorId: string,
  nacao: Nacao,
  valor: number,
): Estado {
  const t: ObrigacaoComprada = {
    tipo: 'ObrigacaoComprada',
    timestamp: Date.now(),
    rotulo: `Compra de obrigação ${valor} (${nacao})`,
    jogadorId,
    nacao,
    valor,
    resultado: { pagoAoTesouro: valor },
  }
  return aplicarTransacao(estado, t)
}

// --- Troca (upgrade) de obrigação --------------------------------------------

function efeitoTroca(sub: Substrato, t: ObrigacaoTrocada): void {
  const jogador = acharJogador(sub, t.jogadorId)
  const nacao = sub.nacoes[t.nacao]
  if (t.valorNovo <= t.valorDevolvido) {
    throw new Error(
      `Upgrade exige valor maior: nova ${t.valorNovo} não é maior que devolvida ${t.valorDevolvido}`,
    )
  }
  const idx = jogador.obrigacoes.findIndex(
    (o) => o.nacao === t.nacao && o.valor === t.valorDevolvido,
  )
  if (idx < 0) {
    throw new Error(
      `${jogador.nome} não possui obrigação de ${t.valorDevolvido} de ${t.nacao} para devolver`,
    )
  }
  if (!nacao.obrigacoesDisponiveis.includes(t.valorNovo)) {
    throw new Error(
      `Obrigação de ${t.valorNovo} de ${t.nacao} não está na pilha disponível`,
    )
  }
  const diferenca = t.valorNovo - t.valorDevolvido
  if (jogador.dinheiro < diferenca) {
    throw new Error(
      `${jogador.nome} não tem dinheiro (${jogador.dinheiro}) para pagar a diferença ${diferenca}`,
    )
  }
  jogador.dinheiro -= diferenca
  nacao.tesouro += diferenca
  jogador.obrigacoes.splice(idx, 1)
  jogador.obrigacoes.push({ nacao: t.nacao, valor: t.valorNovo })
  removerPrimeiro(nacao.obrigacoesDisponiveis, t.valorNovo)
  nacao.obrigacoesDisponiveis.push(t.valorDevolvido)
  nacao.obrigacoesDisponiveis.sort((a, b) => a - b)
}

/** Upgrade: devolve uma obrigação da nação (volta à pilha) e pega outra de valor
 *  maior, pagando a diferença ao tesouro. */
export function trocarObrigacao(
  estado: Estado,
  jogadorId: string,
  nacao: Nacao,
  valorDevolvido: number,
  valorNovo: number,
): Estado {
  const t: ObrigacaoTrocada = {
    tipo: 'ObrigacaoTrocada',
    timestamp: Date.now(),
    rotulo: `Upgrade ${valorDevolvido}→${valorNovo} (${nacao})`,
    jogadorId,
    nacao,
    valorDevolvido,
    valorNovo,
    resultado: { diferencaPaga: valorNovo - valorDevolvido },
  }
  return aplicarTransacao(estado, t)
}

// --- Tributação --------------------------------------------------------------

/** Planeja os fluxos de dinheiro da tributação (docs/REGRAS.md §Regras
 *  monetárias, Tributação em 4 etapas). Bônus e salários já refletem "paga o
 *  possível" conforme o tesouro; o ganho de PP é o valor nominal da tabela. */
function planejarTributacao(
  sub: Substrato,
  nacao: Nacao,
  fabricas: number,
  bandeiras: number,
  unidades: number,
): TributacaoAplicada['resultado'] {
  const estadoNacao = sub.nacoes[nacao]
  const tributacao = 2 * fabricas + bandeiras
  const { bonus, pp } = bonusEPontosTributacao(tributacao)

  // Etapa 1: banco → tesouro.
  let tesouro = estadoNacao.tesouro + tributacao
  // Etapa 2: tesouro → banco (salários das unidades militares).
  const salarios = Math.min(unidades, tesouro)
  tesouro -= salarios
  // Etapa 3: tesouro → governante (bônus da tabela).
  const bonusGovernante = estadoNacao.governanteId ? Math.min(bonus, tesouro) : 0

  return {
    tributacao,
    aoTesouro: tributacao,
    salarios,
    bonusGovernante,
    ganhoPP: pp,
  }
}

function mutarTributacao(
  sub: Substrato,
  nacao: Nacao,
  resultado: TributacaoAplicada['resultado'],
): void {
  const estadoNacao = sub.nacoes[nacao]
  estadoNacao.tesouro += resultado.aoTesouro
  estadoNacao.tesouro -= resultado.salarios
  if (resultado.bonusGovernante > 0 && estadoNacao.governanteId) {
    const gov = acharJogador(sub, estadoNacao.governanteId)
    gov.dinheiro += resultado.bonusGovernante
    estadoNacao.tesouro -= resultado.bonusGovernante
  }
  estadoNacao.pontosPoder = Math.min(
    PP_MAXIMO,
    estadoNacao.pontosPoder + resultado.ganhoPP,
  )
}

/** Aplica a ação de tributação de uma nação. `fabricas` é o número de fábricas
 *  não-ocupadas (valem 2 cada) e `bandeiras` valem 1 cada. */
export function aplicarTributacao(
  estado: Estado,
  nacao: Nacao,
  fabricas: number,
  bandeiras: number,
  unidades: number,
): Estado {
  const resultado = planejarTributacao(
    { jogadores: estado.jogadores, nacoes: estado.nacoes },
    nacao,
    fabricas,
    bandeiras,
    unidades,
  )
  const t: TributacaoAplicada = {
    tipo: 'TributacaoAplicada',
    timestamp: Date.now(),
    rotulo: `Tributação (${nacao})`,
    nacao,
    fabricas,
    bandeiras,
    unidades,
    resultado,
  }
  return aplicarTransacao(estado, t)
}

// --- Juros (etapa 1 do Investidor) -------------------------------------------

/** Planeja o pagamento de juros de uma nação. Se o tesouro não cobrir tudo, o
 *  governante primeiro abdica dos próprios juros e depois completa do próprio
 *  bolso (docs/REGRAS.md §Regras monetárias, ação de Investidor). */
function planejarJuros(sub: Substrato, nacao: Nacao): JurosPagos['resultado'] {
  const estadoNacao = sub.nacoes[nacao]
  const governanteId = estadoNacao.governanteId

  const portadores = sub.jogadores
    .map((j) => ({ jogador: j, devido: jurosDevidos(j, nacao) }))
    .filter((p) => p.devido > 0)

  const naoGovernantes = portadores.filter((p) => p.jogador.id !== governanteId)
  const naoGovDevido = naoGovernantes.reduce((s, p) => s + p.devido, 0)
  const govDevido = governanteId
    ? (portadores.find((p) => p.jogador.id === governanteId)?.devido ?? 0)
    : 0

  const tesouro = estadoNacao.tesouro
  const naoGovDoTesouro = Math.min(tesouro, naoGovDevido)
  const restanteTesouro = tesouro - naoGovDoTesouro
  const doBolsoGovernante = naoGovDevido - naoGovDoTesouro
  const govRecebido = Math.min(restanteTesouro, govDevido)

  const porJogador = portadores.map((p) => ({
    jogadorId: p.jogador.id,
    devido: p.devido,
    recebido: p.jogador.id === governanteId ? govRecebido : p.devido,
  }))

  return {
    porJogador,
    doTesouro: naoGovDoTesouro + govRecebido,
    doBolsoGovernante,
    governanteAbdicou: govDevido - govRecebido,
  }
}

function mutarJuros(
  sub: Substrato,
  nacao: Nacao,
  resultado: JurosPagos['resultado'],
): void {
  const estadoNacao = sub.nacoes[nacao]
  const governanteId = estadoNacao.governanteId
  for (const item of resultado.porJogador) {
    const jogador = acharJogador(sub, item.jogadorId)
    jogador.dinheiro += item.recebido
  }
  if (governanteId && resultado.doBolsoGovernante > 0) {
    acharJogador(sub, governanteId).dinheiro -= resultado.doBolsoGovernante
  }
  estadoNacao.tesouro -= resultado.doTesouro
}

/** Paga os juros das obrigações de uma nação (etapa 1 do Investidor). */
export function pagarJuros(estado: Estado, nacao: Nacao): Estado {
  const resultado = planejarJuros(
    { jogadores: estado.jogadores, nacoes: estado.nacoes },
    nacao,
  )
  const t: JurosPagos = {
    tipo: 'JurosPagos',
    timestamp: Date.now(),
    rotulo: `Juros (${nacao})`,
    nacao,
    resultado,
  }
  return aplicarTransacao(estado, t)
}

// --- Recálculo de governos (fim do Investidor) -------------------------------

/** Recalcula o governo das 6 nações e redistribui o Banco Suíço, registrando a
 *  transação. Só deve ser chamada ao fim da ação de Investidor. `portadorId`
 *  habilita o desempate horário a partir do portador da carta de Investidor. */
export function recalcularGovernos(estado: Estado, portadorId?: string): Estado {
  const t: Transacao = {
    tipo: 'GovernosRecalculados',
    timestamp: Date.now(),
    rotulo: 'Recálculo de governos',
    ...(portadorId ? { portadorId } : {}),
  }
  return aplicarTransacao(estado, t)
}

// --- Movimento de banco (Fábrica, Importação, +2, espaços extras) ------------

function efeitoMovimentoBanco(sub: Substrato, t: MovimentoBanco): void {
  if (t.alvo.tipo === 'tesouro') {
    sub.nacoes[t.alvo.nacao].tesouro += t.delta
  } else {
    acharJogador(sub, t.alvo.jogadorId).dinheiro += t.delta
  }
}

/** Débito/crédito simples contra o banco (docs/REGRAS.md §Banco sem saldo).
 *  `delta` já embute a direção (negativo = paga ao banco). */
export function movimentoBanco(
  estado: Estado,
  alvo: MovimentoBanco['alvo'],
  delta: number,
  rotulo: string,
): Estado {
  const t: MovimentoBanco = {
    tipo: 'MovimentoBanco',
    timestamp: Date.now(),
    rotulo,
    alvo,
    delta,
  }
  return aplicarTransacao(estado, t)
}

// --- Passagem da carta de Investidor -----------------------------------------

function efeitoCartaInvestidor(sub: Substrato, t: CartaInvestidorPassada): void {
  acharJogador(sub, t.deJogadorId).temCartaInvestidor = false
  acharJogador(sub, t.paraJogadorId).temCartaInvestidor = true
}

/** Passa a carta de Investidor de um jogador ao próximo (docs/REGRAS.md
 *  §Regras monetárias, ação de Investidor). */
export function passarCartaInvestidor(
  estado: Estado,
  deJogadorId: string,
  paraJogadorId: string,
): Estado {
  const t: CartaInvestidorPassada = {
    tipo: 'CartaInvestidorPassada',
    timestamp: Date.now(),
    rotulo: 'Carta de Investidor passada',
    deJogadorId,
    paraJogadorId,
  }
  return aplicarTransacao(estado, t)
}

// --- Ação composta do rondel -------------------------------------------------

/** Registra uma ação do rondel como UMA transação composta (desfazível de uma
 *  vez). `passos` é a lista de transações primitivas já construída sobre um
 *  estado espelho (ver src/engine/acoes.ts). */
export function aplicarAcaoRondel(estado: Estado, acao: AcaoRondel): Estado {
  return aplicarTransacao(estado, acao)
}

// --- Ajuste manual (válvula de escape) ---------------------------------------

function efeitoAjusteManual(sub: Substrato, t: AjusteManual): void {
  const alvo = t.alvo
  switch (alvo.tipo) {
    case 'tesouro':
      sub.nacoes[alvo.nacao].tesouro += alvo.delta
      break
    case 'jogador':
      acharJogador(sub, alvo.jogadorId).dinheiro += alvo.delta
      break
    case 'moverObrigacao': {
      const nacao = sub.nacoes[alvo.nacao]
      if (alvo.origemJogadorId) {
        const origem = acharJogador(sub, alvo.origemJogadorId)
        const idx = origem.obrigacoes.findIndex(
          (o) => o.nacao === alvo.nacao && o.valor === alvo.valor,
        )
        if (idx < 0) {
          throw new Error(
            `${origem.nome} não possui obrigação de ${alvo.valor} de ${alvo.nacao} para mover`,
          )
        }
        origem.obrigacoes.splice(idx, 1)
      } else if (!removerPrimeiro(nacao.obrigacoesDisponiveis, alvo.valor)) {
        throw new Error(
          `Obrigação de ${alvo.valor} de ${alvo.nacao} não está na pilha disponível`,
        )
      }

      if (alvo.destinoJogadorId) {
        acharJogador(sub, alvo.destinoJogadorId).obrigacoes.push({
          nacao: alvo.nacao,
          valor: alvo.valor,
        })
      } else {
        nacao.obrigacoesDisponiveis.push(alvo.valor)
        nacao.obrigacoesDisponiveis.sort((a, b) => a - b)
      }
      break
    }
  }
}

/** Correção manual: transação genérica de ajuste (+/− em tesouro ou jogador,
 *  ou mover uma obrigação), com motivo obrigatório. Saída para situações de
 *  mesa que o app não modela (docs/ARQUITETURA.md). */
export function aplicarAjusteManual(
  estado: Estado,
  alvo: AlvoAjusteManual,
  motivo: string,
): Estado {
  if (!motivo.trim()) {
    throw new Error('Correção manual exige um motivo')
  }
  const t: AjusteManual = {
    tipo: 'AjusteManual',
    timestamp: Date.now(),
    rotulo: `Correção manual: ${motivo}`,
    motivo,
    alvo,
  }
  return aplicarTransacao(estado, t)
}
