# Status do projeto — Assistente Imperial 2030

Acompanhamento das sessões de desenvolvimento. Cada sessão deve atualizar
esta tabela ao terminar.

| Sessão | Descrição | Status | Notas para a próxima sessão |
|---|---|---|---|
| 0 | Setup do projeto (scaffold, docs, deploy no Pages) | ✅ Feito | Scaffold Vite+React+TS+Tailwind v4+Vitest+ESLint pronto. Estrutura de pastas criada (`src/engine`, `src/components`, `src/hooks`, `src/data`). Workflow de deploy no GitHub Pages criado em `.github/workflows/deploy.yml` (falha se `npm test` falhar) — falta confirmar com o usuário que o Pages foi habilitado em Settings → Pages (Source: GitHub Actions) e que o primeiro deploy publicou com sucesso. `docs/REGRAS.md` foi criado com os dados de referência fornecidos, mas a tabela de obrigações (valor→juros) ainda precisa ser **validada contra as cartas físicas** antes da Sessão 1 implementar o Investidor. |
| 1 | Engine puro do jogo (`src/engine/`) | ✅ Feito | Engine puro em `src/engine/` (tipos, estado/transações, undo, governo, tributação, juros, pontuação) + constantes em `src/data/regras.ts`. 21 testes verdes cobrindo os cenários A–G, C2 e invariantes. **Notas para a UI:** (1) Estado é event-sourced — nunca editar direto; usar `aplicarTransacao`/`comprarObrigacao`/`trocarObrigacao`/`aplicarTributacao`/`pagarJuros`/`recalcularGovernos`, que retornam NOVO estado (imutável). `desfazer(estado)` faz o undo. (2) `governanteId` fica guardado em `EstadoNacao` e só muda ao chamar `recalcularGovernos` (fim do Investidor); comprar/trocar obrigação NÃO recalcula sozinho. (3) Toda transação carrega `resultado` com os fluxos calculados — a UI mostra essa prévia antes de confirmar. (4) Juros podem deixar o governante com dinheiro negativo (regra E). (5) `criarEstado(jogadores, nacoesParciais?)` monta o estado e a pilha de obrigações disponíveis automaticamente. ⚠️ Ainda depende da validação física da linha valor→juros das obrigações antes do fluxo completo do Investidor. |
| 2 | UI base / componentes principais | ⬜ Pendente | |
| 3 | (definir escopo) | ⬜ Pendente | |
| 4 | (definir escopo) | ⬜ Pendente | |
| 5 | Persistência: IndexedDB, autosave, export/import JSON | ⬜ Pendente | |
| 6 | (definir escopo) | ⬜ Pendente | |
| 7 | PWA / suporte offline | ⬜ Pendente | Requer HTTPS, já garantido pelo GitHub Pages desde a Sessão 0. |
