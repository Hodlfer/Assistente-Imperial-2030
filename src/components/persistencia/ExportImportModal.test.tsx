import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { criarEstado, type Jogador } from '../../engine'
import { exportarJSON } from '../../persistence/exportImport'
import { ExportImportModal } from './ExportImportModal'

const jogador: Jogador = {
  id: 'ana',
  nome: 'Ana',
  assento: 0,
  dinheiro: 2,
  obrigacoes: [],
  temBancoSuico: false,
  temCartaInvestidor: true,
}

describe('ExportImportModal', () => {
  it('avisa que a situação migrada de um save v1 precisa ser conferida', () => {
    const onImportar = vi.fn()
    const saveV1 = exportarJSON(criarEstado([jogador])).replace(
      '"schemaVersion": 2',
      '"schemaVersion": 1',
    )
    render(
      <ExportImportModal
        estado={null}
        aberto
        onFechar={() => undefined}
        onImportar={onImportar}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText(/Cole aqui o JSON/), {
      target: { value: saveV1 },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))

    expect(onImportar).not.toHaveBeenCalled()
    expect(screen.getByText(/situação do mapa foi estimada/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Importar e conferir' }))
    expect(onImportar).toHaveBeenCalledOnce()
  })
})
