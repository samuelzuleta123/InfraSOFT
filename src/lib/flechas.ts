// Navegación con las flechas del teclado.
import { useEffect, useRef } from 'react'

export type Flecha = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'

/**
 * Atajos con flechas para toda la página. No actúan mientras se escribe en un campo,
 * con Cmd/Ctrl/Alt/Shift, con un modal abierto, ni si un control ya atendió la tecla.
 */
export function useFlechas(onFlecha: (tecla: Flecha, e: KeyboardEvent) => void, activo = true) {
  const fn = useRef(onFlecha)
  useEffect(() => {
    fn.current = onFlecha
  })
  useEffect(() => {
    if (!activo) return
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"]') || document.querySelector('[aria-modal="true"]')) return
      fn.current(e.key as Flecha, e)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activo])
}

/** Índice al que lleva una flecha (←/→, Inicio/Fin) dentro de una fila de opciones, o null si la tecla no aplica. */
export function indiceConFlecha(tecla: string, actual: number, total: number): number | null {
  if (tecla === 'ArrowLeft') return Math.max(0, actual - 1)
  if (tecla === 'ArrowRight') return Math.min(total - 1, actual + 1)
  if (tecla === 'Home') return 0
  if (tecla === 'End') return total - 1
  return null
}
