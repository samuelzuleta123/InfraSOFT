import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { esMaterial, precioNeto } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { moneyUnit, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { ItemCotizacion, Unidad } from '@/types'

interface Sugerencia {
  clave: string
  titulo: string
  /** Texto extra para buscar (código del material). */
  busca?: string
  detalle: string
  crear: () => ItemCotizacion
}

const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const UNIDAD: Record<Unidad, string> = { Un: 'un', Mts: 'm' }

/**
 * Agregar sin salir de la tabla: se escribe, se elige de la lista con flechas y Enter, y el ítem queda al final del bloque.
 * Materiales salen del catálogo (con el precio más bajo ya cargado); mano de obra, de los kits y de cotizaciones anteriores.
 */
export function AgregarEnLinea({ tipo, onAgregar }: { tipo: 'material' | 'mo'; onAgregar: (item: ItemCotizacion) => void }) {
  const materiales = useStore((s) => s.materiales)
  const precios = useStore((s) => s.precios)
  const kits = useStore((s) => s.kits)
  const proyectos = useStore((s) => s.proyectos)
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listaId = useId()

  const base = useMemo<Sugerencia[]>(() => {
    if (tipo === 'material')
      return materiales.map((m) => {
        const pm = precios.filter((p) => p.materialId === m.id).sort((a, b) => precioNeto(a) - precioNeto(b))
        const mejor = pm[0]
        return {
          clave: m.id,
          titulo: m.descripcion,
          busca: `${m.codigo} ${m.categoria}`,
          detalle: pm.length ? `${pm.length} proveedor${pm.length === 1 ? '' : 'es'} · desde ${moneyUnit(precioNeto(mejor))}` : 'Sin precio en catálogo',
          crear: () => ({
            id: uid('it'),
            tipo: 'material',
            materialId: m.id,
            descripcion: m.descripcion,
            unidad: m.unidad,
            cantidad: 1,
            vuMO: 0,
            vuMaterial: mejor ? precioNeto(mejor) : 0,
            proveedorId: mejor?.proveedorId ?? null,
            cantInstalada: null,
          }),
        }
      })
    // Mano de obra ya usada: la más reciente gana si se repite la descripción.
    const vistas = new Map<string, { descripcion: string; unidad: Unidad; vuMO: number }>()
    for (const k of kits) for (const i of k.items) if (!i.materialId && i.vuMO > 0) vistas.set(normal(i.descripcion), i)
    for (const p of proyectos)
      for (const v of p.cotizacion.versiones)
        for (const s of v.secciones) for (const i of s.items) if (!esMaterial(i) && i.vuMO > 0) vistas.set(normal(i.descripcion), i)
    return [...vistas.values()]
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))
      .map((m) => ({
        clave: normal(m.descripcion),
        titulo: m.descripcion,
        detalle: `${moneyUnit(m.vuMO)} / ${UNIDAD[m.unidad]}`,
        crear: () => ({ id: uid('it'), tipo: 'mo', descripcion: m.descripcion, unidad: m.unidad, cantidad: 1, vuMO: m.vuMO, vuMaterial: 0, proveedorId: null, cantInstalada: null }),
      }))
  }, [tipo, materiales, precios, kits, proyectos])

  const texto = q.trim()
  const lista = useMemo(() => {
    const t = normal(texto)
    // Todas las coincidencias, con scroll: cortar la lista escondía materiales sin decir que había más.
    const filtradas = base.filter((s) => !t || normal(`${s.titulo} ${s.busca ?? ''}`).includes(t))
    if (!texto) return filtradas
    const libre: Sugerencia = {
      clave: '__libre__',
      titulo: `Crear “${texto}”`,
      detalle: tipo === 'material' ? 'Material sin catálogo' : 'Mano de obra nueva',
      crear: () => ({ id: uid('it'), tipo, descripcion: texto, unidad: 'Un', cantidad: 1, vuMO: 0, vuMaterial: 0, proveedorId: null, cantInstalada: null }),
    }
    return [...filtradas, libre]
  }, [base, texto, tipo])

  // Con flechas, la opción activa se mantiene visible dentro de la lista con scroll.
  useEffect(() => {
    if (abierto) document.getElementById(`${listaId}-${activo}`)?.scrollIntoView({ block: 'nearest' })
  }, [activo, abierto, listaId])

  const elegir = (s: Sugerencia) => {
    onAgregar(s.crear())
    setQ('')
    setAbierto(false)
    setActivo(0)
  }

  const placeholder = tipo === 'material' ? 'Agregar material…' : 'Agregar mano de obra…'

  return (
    <div className="relative w-full max-w-md">
      <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-brand-800" aria-hidden />
      <input
        ref={input}
        value={q}
        role="combobox"
        aria-expanded={abierto && lista.length > 0}
        aria-controls={listaId}
        aria-activedescendant={abierto && lista[activo] ? `${listaId}-${activo}` : undefined}
        aria-label={placeholder}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onChange={(e) => {
          setQ(e.target.value)
          setActivo(0)
          setAbierto(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setAbierto(true)
            if (lista.length) setActivo((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            if (abierto && lista[activo]) elegir(lista[activo])
          } else if (e.key === 'Escape') {
            setAbierto(false)
          }
        }}
        className="h-9 w-full rounded-md border border-dashed border-slate-300 bg-transparent pr-3 pl-8 text-sm text-slate-900 transition-colors placeholder:font-medium placeholder:text-brand-800 hover:border-brand-400 hover:bg-brand-50/40 focus:border-solid focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:outline-none"
      />
      {abierto && lista.length > 0 && (
        <ul id={listaId} role="listbox" className="absolute bottom-full left-0 z-30 mb-1.5 max-h-96 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          <li role="presentation" className="px-2.5 pt-1.5 pb-1 text-xs text-slate-500">
            {texto
              ? `${lista.length - 1} de ${base.length} coinciden`
              : `${base.length} ${tipo === 'material' ? 'materiales en el catálogo' : 'tipos de mano de obra usados antes'} · escribe para filtrar`}
          </li>
          {lista.map((s, k) => (
            <li
              key={s.clave}
              id={`${listaId}-${k}`}
              role="option"
              aria-selected={k === activo}
              // mousedown en vez de click: el input pierde el foco antes del click y cerraría la lista.
              onMouseDown={(e) => {
                e.preventDefault()
                elegir(s)
              }}
              onMouseEnter={() => setActivo(k)}
              className={cn('flex cursor-pointer items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-[13px]', k === activo && 'bg-brand-50')}
            >
              <span className={cn('min-w-0 truncate text-slate-900', s.clave === '__libre__' && 'font-medium text-brand-900')}>{s.titulo}</span>
              <span className="num shrink-0 text-xs text-slate-500">{s.detalle}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
