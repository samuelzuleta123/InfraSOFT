import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { EstadoCotBadge } from '@/components/dominio'
import { versionActiva } from '@/lib/calc'
import { fecha } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useStore } from '@/store/useStore'
import type { Proyecto, VersionCotizacion } from '@/types'

/**
 * Lista de versiones de la cotización con una papelera al lado de cada una.
 * No se borra la única versión, la aprobada (de ella salen las compras) ni nada con el proyecto cerrado.
 */
export function SelectorVersion({ proyecto, cerrado }: { proyecto: Proyecto; cerrado: boolean }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const eliminarVersion = useStore((s) => s.eliminarVersion)
  const notificar = useStore((s) => s.notificar)
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  const versiones = proyecto.cotizacion.versiones
  const v = versionActiva(proyecto)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    lista.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  const elegir = (id: string) => {
    editarProyecto(proyecto.id, (p) => {
      p.cotizacion.versionActivaId = id
    })
    setAbierto(false)
    boton.current?.focus()
  }

  const motivoNoBorrar = (x: VersionCotizacion) =>
    cerrado
      ? 'El proyecto ya está en entrega o cierre'
      : versiones.length < 2
        ? 'Es la única versión de la cotización'
        : x.estado === 'aprobada'
          ? 'La versión aprobada no se puede borrar'
          : null

  // Deshacer devuelve solo esta versión, en su lugar según el número, aunque se hayan borrado otras después.
  const borrar = (x: VersionCotizacion) => {
    const eraActiva = proyecto.cotizacion.versionActivaId === x.id
    eliminarVersion(proyecto.id, x.id)
    notificar(`Versión ${x.nombre} eliminada`, 'ok', () =>
      editarProyecto(proyecto.id, (p) => {
        const lista = p.cotizacion.versiones
        if (lista.some((y) => y.id === x.id)) return
        const despues = lista.findIndex((y) => numeroVersion(y) > numeroVersion(x))
        lista.splice(despues === -1 ? lista.length : despues, 0, x)
        if (eraActiva) p.cotizacion.versionActivaId = x.id
      }),
    )
  }

  // ↑/↓ recorren las versiones dentro de la lista abierta.
  const moverFoco = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const opciones = [...(lista.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])]
    const i = opciones.indexOf(document.activeElement as HTMLButtonElement)
    const j = e.key === 'ArrowDown' ? Math.min(opciones.length - 1, i + 1) : Math.max(0, i - 1)
    opciones[j]?.focus()
  }

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        id="version"
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className={cn(
          'flex h-9 min-w-36 cursor-pointer items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs transition-colors hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none',
          abierto && 'border-brand-500 ring-2 ring-brand-500/25',
        )}
      >
        <span className="num">
          {v.nombre} · {fecha(v.creada)}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-slate-500 transition-transform', abierto && 'rotate-180')} aria-hidden />
      </button>

      {abierto && (
        <ul
          ref={lista}
          role="menu"
          aria-label="Versiones de la cotización"
          onKeyDown={moverFoco}
          className="absolute top-full left-0 z-30 mt-1.5 max-h-80 w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-xl"
        >
          {versiones.map((x) => {
            const activa = x.id === v.id
            const motivo = motivoNoBorrar(x)
            return (
              <li key={x.id} className={cn('group flex items-center gap-1 rounded-md pr-1 transition-colors', activa ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={activa}
                  onClick={() => elegir(x.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none"
                >
                  <Check className={cn('size-4 shrink-0 text-brand-800', !activa && 'invisible')} aria-hidden />
                  <span className={cn('num truncate', activa ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                    {x.nombre} · {fecha(x.creada)}
                  </span>
                  <span className="ml-auto shrink-0">
                    <EstadoCotBadge estado={x.estado} />
                  </span>
                </button>
                <IconButton
                  label={motivo ?? `Eliminar versión ${x.nombre}`}
                  aria-label={`Eliminar versión ${x.nombre}`}
                  disabled={!!motivo}
                  onClick={() => borrar(x)}
                  className="hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
                >
                  <Trash2 />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const numeroVersion = (v: VersionCotizacion) => Number(v.nombre.replace(/\D/g, '')) || 0
