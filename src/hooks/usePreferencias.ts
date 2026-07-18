import { useEffect, useState } from 'react'

export interface PreferenciasMesa {
  tema: 'claro' | 'escuro'
  ocultarDinheiro: boolean
  manterTelaLigada: boolean
}

const CHAVE = 'imperial-2030:preferencias-v1'
const padrao = (): PreferenciasMesa => ({
  tema: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro',
  ocultarDinheiro: false,
  manterTelaLigada: false,
})

function carregar(): PreferenciasMesa {
  try {
    return { ...padrao(), ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') }
  } catch { return padrao() }
}

export function usePreferencias() {
  const [preferencias, setPreferencias] = useState<PreferenciasMesa>(carregar)
  useEffect(() => { localStorage.setItem(CHAVE, JSON.stringify(preferencias)) }, [preferencias])
  return { preferencias, atualizar: (parcial: Partial<PreferenciasMesa>) => setPreferencias((p) => ({ ...p, ...parcial })) }
}
