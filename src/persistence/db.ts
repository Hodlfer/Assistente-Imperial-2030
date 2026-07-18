// Wrapper fino sobre IndexedDB via `idb` (docs/ARQUITETURA.md §Persistência;
// enunciado da Sessão 5, item 3): mais durável que localStorage, sem limite
// prático de tamanho, e o storage que os navegadores despejam por último.

import { openDB, type IDBPDatabase } from 'idb'
import type { Estado } from '../engine'
import type { PartidaSalva } from './tipos'
import { SCHEMA_VERSION } from './tipos'

const NOME_DB = 'imperial-2030'
const VERSAO_DB = 1
const STORE = 'partida'
/** Uma partida por dispositivo: sempre a mesma chave. */
const CHAVE = 'atual'

let dbPromise: Promise<IDBPDatabase> | null = null

function abrirDB(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(NOME_DB, VERSAO_DB, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    },
  })
  return dbPromise
}

export async function salvarPartidaIndexedDB(estado: Estado): Promise<void> {
  const db = await abrirDB()
  const salva: PartidaSalva = { schemaVersion: SCHEMA_VERSION, estado, salvoEm: Date.now() }
  await db.put(STORE, salva, CHAVE)
}

export async function carregarPartidaIndexedDB(): Promise<PartidaSalva | undefined> {
  const db = await abrirDB()
  return db.get(STORE, CHAVE)
}

export async function limparPartidaIndexedDB(): Promise<void> {
  const db = await abrirDB()
  await db.delete(STORE, CHAVE)
}
