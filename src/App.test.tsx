import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('abre no wizard de setup quando não há partida em curso', () => {
    render(<App />)
    expect(screen.getByText('Jogadores')).toBeInTheDocument()
  })
})
