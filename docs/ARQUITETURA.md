# Arquitetura — Assistente Imperial 2030

Decisões técnicas registradas na Sessão 0, para orientar as sessões
seguintes de implementação.

## Tudo é transação

O estado do jogo nunca é editado diretamente (sem `saldo = novoValor`). Toda
mudança — pagamento de juros, compra de obrigação, tributação, etc. — é
registrada como uma transação imutável. O estado atual é sempre o resultado
de aplicar (fold/reduce) a lista de transações sobre o estado inicial da
partida, no estilo de event sourcing simplificado.

Isso torna o histórico completo da partida auditável e reconstruível a
qualquer momento, e viabiliza o undo: desfazer uma ação composta significa
remover sua(s) transação(ões) e reprocessar o fold — ou, alternativamente,
restaurar a partir de uma pilha de snapshots tirados antes de cada ação.

## Engine separado da UI

Toda a lógica de regras do jogo vive em `src/engine/`, como funções e tipos
puros em TypeScript, sem nenhuma dependência de React. A UI (`src/components/`)
nunca implementa regra de jogo diretamente; ela consome o engine através de um
hook (`useGame`) que expõe o estado atual e as ações disponíveis.

Essa separação permite testar o engine inteiro com Vitest sem precisar
renderizar nada, e mantém a lógica de regras num único lugar auditável contra
`REGRAS.md`.

## O app sugere, o usuário confirma

Para ações compostas (ex.: tributação, ação de Investidor), o app calcula e
mostra ao usuário uma prévia de todos os fluxos de dinheiro envolvidos antes
de efetivamente aplicar a transação. O usuário sempre confirma antes de
qualquer mudança de estado — o app nunca aplica uma ação composta
silenciosamente.

## Banco sem saldo

O banco é modelado como uma fonte/destino de dinheiro ilimitada. Não existe
"saldo do banco" no estado da aplicação; transações de/para o banco apenas
debitam ou creditam o outro lado (tesouro de uma nação ou dinheiro de um
jogador).

## Persistência

- **Autosave**: cada transação aplicada é salva imediatamente no IndexedDB.
- `navigator.storage.persist()` é solicitado para reduzir o risco do
  navegador limpar os dados automaticamente.
- **Export/Import** em JSON permite backup manual e transferência entre
  dispositivos (Sessão 5).
- **Hospedagem**: GitHub Pages — site inteiramente estático, sem backend. Os
  dados de uma partida vivem exclusivamente no dispositivo que a joga; não há
  sincronização entre dispositivos.

## Idioma e plataforma alvo

Toda a UI é em português (pt-BR). O alvo principal é tablet: interações por
toque, fontes grandes, elementos com área de toque generosa.

## Constantes de regras

Valores fixos das regras (tabela de obrigações, fator de poder, tabela de
tributação, capital inicial etc.) ficam centralizados em `src/data/`, cada
constante comentada com a seção correspondente de `docs/REGRAS.md` de onde
veio — para facilitar auditoria e atualização caso uma regra seja corrigida.
