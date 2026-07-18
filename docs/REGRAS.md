# Dados de referência — Imperial 2030
(Fonte: manual oficial PT-BR, Pensamento Coletivo, v1.0)

## Nações (ordem de turno, cíclica)
Rússia → China → Índia → Brasil → EUA → Europa
Cores: Rússia roxo, China amarelo, Índia cinza-escuro, Brasil verde, EUA vermelho, Europa azul.

## Obrigações (9 por nação, 54 no total)
| Valor  | 2 | 4 | 6 | 9 | 12 | 16 | 20 | 25 | 30 |
| Juros  | 1 | 2 | 3 | 4 | 5  | 6  | 7  | 8  | 9  |
Âncoras confirmadas no manual: valor 12 → juros 5; valor 16 → juros 6.
⚠️ VALIDAR a linha completa contra as cartas físicas antes de implementar o Investidor.

## Fator de Poder (trilha 0–25)
0–4→x0 | 5–9→x1 | 10–14→x2 | 15–19→x3 | 20–24→x4 | 25→x5
(Exemplos do manual: 17 pontos→x3; 11 pontos→x2.)

## Tabela de Tributação COMPLETA (bônus ao governante / Pontos de Poder)
Fonte: tabuleiro físico (transcrita pelo usuário).

| Tributação | 0–5 | 6 | 8 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 18+ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bônus (mil.) | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 |
| Ganho de PP | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 |

⚠️ **Tabela por FAIXAS/degraus, não por inteiro consecutivo.** As colunas listadas
são os "degraus" (breakpoints); os valores de tributação não listados (7, 9, 17,
e qualquer valor entre os degraus) usam o degrau **imediatamente igual ou
inferior** — ex: tributação 7 usa a linha do degrau 6; tributação 9 usa a linha
do degrau 8; tributação 17 usa a linha do degrau 16; qualquer valor ≥18 usa a
linha "18+". Implementar como busca do maior degrau ≤ valor, nunca como tabela
indexada por número inteiro. Máximo teórico de tributação: 23 (4 fábricas ×2 +
15 bandeiras ×1), coberto pela faixa "18+".

## Regras monetárias essenciais
- Tesouros das nações e dinheiro pessoal dos jogadores são SEPARADOS.
- Controle de uma nação: jogador com maior soma de VALORES de obrigações dela.
  Empate NÃO muda o governo atual. Controle é recalculado apenas ao final da
  ação de Investidor. Nação sem obrigações em mãos de jogadores → pula o turno.
- Rondel: 1–3 espaços grátis; cada extra (máx +3) custa (1 + Fator de Poder),
  pago pelo JOGADOR governante (dinheiro pessoal) ao banco.
- Fábrica: tesouro paga 5 ao banco.
- Importação: tesouro paga 1 por unidade (máx 3) ao banco.
- Tributação (4 etapas):
  1. banco→tesouro: 2×fábricas não-ocupadas + 1×bandeiras
  2. tesouro→banco: 1×unidade militar (paga o possível se faltar)
  3. tesouro→governante: bônus da tabela (paga o possível; resto perdido)
  4. nação ganha PP da tabela; 25 PP → fim de jogo
- Investidor (parar): (1) juros: tesouro→cada portador de obrigação da nação.
  Se faltar dinheiro: o governante primeiro ABDICA dos próprios juros, depois
  completa do próprio bolso. (2) portador da carta de Investidor: +2 do banco,
  pode comprar obrigação disponível ou fazer upgrade (devolve uma da mesma
  nação e paga a diferença; a nova deve valer MAIS). (3) cada dono de Banco
  Suíço (sem a carta de Investidor) pode investir igual, sem os +2; ordem:
  horário a partir da esquerda do portador da carta.
  Ao final: recalcular governos; quem não governa nada ganha Banco Suíço;
  quem passou a governar devolve; carta de Investidor passa em sentido horário.
- Investidor (apenas passar por cima): etapas 2 e 3 apenas.
- Fim aos 25 PP: se ocorrer ao PULAR o Investidor, ignorar etapas 2–3.

## Capital inicial
6/5/4 jogadores: 13 | 3 jogadores: 24 | 2 jogadores: 35
Após compra das obrigações iniciais, cada jogador deve sobrar com exatamente 2.
(Regra opcional avançada: 6→13, 5→15, 4→19, 3→25, 2→37 — backlog.)

## Pontuação final
Por jogador: Σ(juros da obrigação × Fator de Poder da nação) + dinheiro restante.
Desempate: maior soma de obrigações na nação com mais PP; persiste → próxima nação.
