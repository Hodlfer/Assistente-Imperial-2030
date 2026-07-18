// jsdom não implementa IndexedDB; a camada de persistência (Sessão 5) precisa
// dele mesmo em componentes que só passam por `usePersistencia` de raspão.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { limparPartidaIndexedDB } from './persistence/db'
import { limparEspelho } from './persistence/localStorageMirror'

// O IndexedDB falso é compartilhado por todos os testes do mesmo arquivo —
// sem isso, o save de um teste "vaza" para o próximo (App mostraria a tela
// de "Continuar partida" em vez do wizard).
beforeEach(async () => {
  await limparPartidaIndexedDB()
  limparEspelho()
})
