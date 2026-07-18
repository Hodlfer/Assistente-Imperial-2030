import { useEffect, useRef, useState } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener: (type: 'release', listener: () => void) => void }
type NavigatorWakeLock = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }

/** Mantém a tela acordada quando suportado; falhas são deliberadamente silenciosas. */
export function useWakeLock(ativo: boolean) {
  const sentinela = useRef<WakeLockSentinelLike | null>(null)
  const [suportado] = useState(() => 'wakeLock' in navigator)
  useEffect(() => {
    let cancelado = false
    const solicitar = async () => {
      if (!ativo || !suportado || document.visibilityState !== 'visible') return
      try {
        const nova = await (navigator as NavigatorWakeLock).wakeLock!.request('screen')
        if (cancelado) { await nova.release(); return }
        sentinela.current = nova
        nova.addEventListener('release', () => { if (sentinela.current === nova) sentinela.current = null })
      } catch { /* permissões/bateria: o toggle continua sendo uma preferência */ }
    }
    void solicitar()
    const aoVoltar = () => void solicitar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => { cancelado = true; document.removeEventListener('visibilitychange', aoVoltar); void sentinela.current?.release(); sentinela.current = null }
  }, [ativo, suportado])
  return suportado
}
