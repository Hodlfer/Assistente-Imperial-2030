// Tipos do envelope de persistência (docs/ARQUITETURA.md §Persistência;
// enunciado da Sessão 5, item 3). `estado` já carrega o histórico completo de
// transações — reprocessá-las pela engine é o que valida um save (import,
// migração) e reconstrói jogadores/nações.

import type { Estado } from '../engine'

/** Versão atual do formato salvo. Incrementar sempre que a forma de `Estado`
 *  mudar de um jeito que quebre saves antigos. */
export const SCHEMA_VERSION = 1 as const

export interface PartidaSalva {
  schemaVersion: number
  estado: Estado
  /** Epoch ms de quando este registro foi gravado. */
  salvoEm: number
}
