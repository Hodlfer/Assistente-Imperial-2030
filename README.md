# Assistente Imperial 2030

Livro-caixa digital para acompanhar partidas físicas do jogo de tabuleiro
**Imperial 2030**. O app rastreia dinheiro, obrigações (títulos), controle de
nações e Pontos de Poder — **não** rastreia o mapa, unidades ou bandeiras
(isso fica no tabuleiro físico).

Veja `docs/REGRAS.md` para os dados de referência do jogo, `docs/ARQUITETURA.md`
para as decisões técnicas e `docs/STATUS.md` para o progresso do projeto por
sessão.

## Desenvolvimento

```bash
npm install
npm run dev     # servidor de desenvolvimento
npm test        # testes unitários (Vitest)
npm run lint    # ESLint
npm run build   # build de produção em dist/
```

## Deploy no GitHub Pages

O deploy é automático via GitHub Actions (`.github/workflows/deploy.yml`): a
cada push na branch `main`, o workflow roda `npm ci`, `npm test`,
`npm run build` e publica o conteúdo de `dist/` no GitHub Pages. **O deploy
falha se os testes falharem.**

Para habilitar o Pages neste repositório (uma vez só):

1. Vá em **Settings → Pages**.
2. Em **Source**, selecione **GitHub Actions**.
3. Faça um push na `main` (ou rode o workflow manualmente em **Actions**) para
   disparar o primeiro deploy.

URL final esperada:

```
https://hodlfer.github.io/Assistente-Imperial-2030/
```

O app é 100% estático (sem backend) — os dados da partida ficam salvos
apenas no dispositivo (IndexedDB), o que também é necessário para o suporte
a PWA/offline.

## Instalar no tablet (PWA)

Abra a URL pública em um navegador conectado à internet uma primeira vez; depois
ela continua disponível offline, inclusive durante a partida.

- **Android (Chrome/Edge):** abra o menu do navegador e escolha **Adicionar à tela inicial** (ou **Instalar app**).
- **iPad (Safari):** toque em **Compartilhar** → **Adicionar à Tela de Início**.

No iOS, instalar o app também ajuda a proteger a partida contra a limpeza
automática de dados que o Safari pode fazer em sites usados só no navegador.
Quando um deploy trouxer uma atualização, o app mostra um aviso para recarregar:
faça isso apenas em um momento seguro, pois ele **nunca recarrega sozinho** no
meio de uma partida.
