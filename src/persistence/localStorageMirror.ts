// Espelho leve em localStorage do último save (docs/ARQUITETURA.md
// §Persistência; enunciado da Sessão 5, item 3): redundância barata — se o
// IndexedDB falhar ao carregar, o app cai para este espelho e avisa.

import type { Estado } from '../engine'
import type { PartidaSalva } from './tipos'
import { SCHEMA_VERSION } from './tipos'

const CHAVE = 'imperial-2030:espelho'

export function salvarEspelho(estado: Estado): void {
  try {
    const salva: PartidaSalva = { schemaVersion: SCHEMA_VERSION, estado, salvoEm: Date.now() }
    localStorage.setItem(CHAVE, JSON.stringify(salva))
  } catch {
    // localStorage indisponível/cheio — o IndexedDB continua sendo a fonte
    // principal, o espelho é só uma rede de segurança.
  }
}

export function carregarEspelho(): PartidaSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as PartidaSalva) : null
  } catch {
    return null
  }
}

export function limparEspelho(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignora — não há nada mais a fazer se localStorage está indisponível.
  }
}
