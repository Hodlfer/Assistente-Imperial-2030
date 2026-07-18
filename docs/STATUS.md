# Status do projeto — Assistente Imperial 2030

Acompanhamento das sessões de desenvolvimento. Cada sessão deve atualizar
esta tabela ao terminar.

| Sessão | Descrição | Status | Notas para a próxima sessão |
|---|---|---|---|
| 0 | Setup do projeto (scaffold, docs, deploy no Pages) | ✅ Feito | Scaffold Vite+React+TS+Tailwind v4+Vitest+ESLint pronto. Estrutura de pastas criada (`src/engine`, `src/components`, `src/hooks`, `src/data`). Workflow de deploy no GitHub Pages criado em `.github/workflows/deploy.yml` (falha se `npm test` falhar) — falta confirmar com o usuário que o Pages foi habilitado em Settings → Pages (Source: GitHub Actions) e que o primeiro deploy publicou com sucesso. `docs/REGRAS.md` foi criado com os dados de referência fornecidos, mas a tabela de obrigações (valor→juros) ainda precisa ser **validada contra as cartas físicas** antes da Sessão 1 implementar o Investidor. |
| 1 | Engine puro do jogo (`src/engine/`) | ⬜ Pendente | Depende de REGRAS.md validado, especialmente a tabela de obrigações. |
| 2 | UI base / componentes principais | ⬜ Pendente | |
| 3 | (definir escopo) | ⬜ Pendente | |
| 4 | (definir escopo) | ⬜ Pendente | |
| 5 | Persistência: IndexedDB, autosave, export/import JSON | ⬜ Pendente | |
| 6 | (definir escopo) | ⬜ Pendente | |
| 7 | PWA / suporte offline | ⬜ Pendente | Requer HTTPS, já garantido pelo GitHub Pages desde a Sessão 0. |
