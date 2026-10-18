import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { precioNeto } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { textoVariacion, UMBRAL_VARIACION_PRECIO, type CompraMaterial } from '@/lib/historico'
import { fecha, moneyUnit, r3 } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { ItemCotizacion } from '@/types'

const corto = (nombre: string) => nombre.replace(/ S\.A\.S?\.?$/, '')

/**
 * Columna Proveedor del material: un clic abre el catálogo de cada proveedor y la última compra real, ordenados por
 * precio. Elegir una opción asigna proveedor y precio a la vez; elegir un proveedor sin precio vacía el costo para digitarlo.
 */
export function SelectorPrecio({
  item,
  compra,
  bloqueada,
  onElegir,
  onNuevoProveedor,
}: {
  item: ItemCotizacion
  compra?: CompraMaterial
  bloqueada?: boolean
  onElegir: (proveedorId: string | null, precio?: number) => void
  onNuevoProveedor: () => void
}) {
  const proveedores = useStore((s) => s.proveedores)
  const precios = useStore((s) => s.precios)
  const proyectoCompra = useStore((s) => s.proyectos.find((p) => p.id === compra?.proyectoId))
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)

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
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  const catalogo = (item.materialId ? precios.filter((p) => p.materialId === item.materialId) : [])
    .map((p) => ({ proveedorId: p.proveedorId, precio: r3(precioNeto(p)), fecha: p.fecha }))
    .sort((a, b) => a.precio - b.precio)
  const otros = proveedores.filter((p) => !catalogo.some((c) => c.proveedorId === p.id))
  const vu = r3(item.vuMaterial)
  const delCatalogo = catalogo.find((c) => c.proveedorId === item.proveedorId)
  const opciones = catalogo.length + (compra ? 1 : 0)

  // El disparador muestra el proveedor elegido, o qué falta.
  const falta = !item.proveedorId
  const texto = item.proveedorId
    ? corto(nombreProveedor(proveedores, item.proveedorId))
    : opciones > 0
      ? `Elegir · ${opciones} precio${opciones === 1 ? '' : 's'}`
      : 'Elegir proveedor'

  const elegir = (proveedorId: string | null, precio?: number) => {
    onElegir(proveedorId, precio)
    setAbierto(false)
    boton.current?.focus()
  }

  if (bloqueada)
    return <div className="truncate px-2 py-[7px] text-[13px] text-slate-700">{item.proveedorId ? texto : 'Sin proveedor'}</div>

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={`Proveedor de ${item.descripcion}: ${texto}`}
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          'flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none',
          falta
            ? 'border-amber-300 bg-amber-50 font-medium text-amber-900 hover:border-amber-400'
            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
          abierto && 'border-brand-500 ring-2 ring-brand-500/25',
        )}
      >
        <span className="truncate">{texto}</span>
        <ChevronDown className={cn('size-3.5 shrink-0', falta ? 'text-amber-700' : 'text-slate-400')} aria-hidden />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label={`Precio de ${item.descripcion}`}
          className="absolute top-full left-0 z-30 mt-1.5 w-80 rounded-lg border border-slate-200 bg-white p-1.5 text-[13px] shadow-xl"
        >
          {catalogo.length > 0 && (
            <Grupo titulo="Catálogo de proveedores">
              {catalogo.map((c, k) => (
                <Opcion
                  key={c.proveedorId}
                  activa={item.proveedorId === c.proveedorId && vu === c.precio}
                  titulo={corto(nombreProveedor(proveedores, c.proveedorId))}
                  detalle={`Precio neto · ${fecha(c.fecha)}`}
                  precio={c.precio}
                  marca={k === 0 && catalogo.length > 1 ? 'Más bajo' : undefined}
                  onClick={() => elegir(c.proveedorId, c.precio)}
                />
              ))}
            </Grupo>
          )}
          {compra && (
            <Grupo titulo="Última compra real">
              <Opcion
                activa={item.proveedorId === compra.proveedorId && vu === r3(compra.precio) && !(delCatalogo && delCatalogo.precio === vu)}
                titulo={corto(nombreProveedor(proveedores, compra.proveedorId))}
                detalle={`${compra.factura ? `Factura ${compra.factura}` : `OC ${compra.ocConsecutivo}`} · ${proyectoCompra?.codigo ?? ''} · ${fecha(compra.fecha)}`}
                precio={compra.precio}
                onClick={() => elegir(compra.proveedorId, r3(compra.precio))}
              />
            </Grupo>
          )}
          <Grupo titulo={catalogo.length ? 'Otro proveedor · sin precio' : 'Proveedor · sin precio'}>
            <div className="max-h-36 overflow-y-auto">
              {/* Misma fila que las opciones con precio: si no, parecen texto y no se ve que se pueden elegir. */}
              {otros.map((p) => (
                <Opcion
                  key={p.id}
                  activa={item.proveedorId === p.id}
                  titulo={corto(p.nombre)}
                  detalle="Sin precio · lo digitas en la tabla"
                  onClick={() => elegir(p.id)}
                />
              ))}
            </div>
          </Grupo>
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-100 px-1 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                onNuevoProveedor()
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-brand-800 hover:bg-brand-50"
            >
              <Plus className="size-3.5" aria-hidden />
              Proveedor nuevo
            </button>
            {item.proveedorId && (
              <button type="button" onClick={() => elegir(null)} className="cursor-pointer rounded-md px-1.5 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                Quitar proveedor
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Bajo el costo unitario: de dónde sale el precio y si se aleja de la última compra. */
export function FuentePrecio({ item, compra }: { item: ItemCotizacion; compra?: CompraMaterial }) {
  const precios = useStore((s) => s.precios)
  const vu = r3(item.vuMaterial)
  if (vu <= 0) return null
  const delCatalogo = item.materialId && item.proveedorId ? precios.find((p) => p.materialId === item.materialId && p.proveedorId === item.proveedorId) : undefined
  const origen =
    delCatalogo && r3(precioNeto(delCatalogo)) === vu
      ? 'Precio de catálogo'
      : compra && compra.proveedorId === item.proveedorId && r3(compra.precio) === vu
        ? 'Precio de la última compra'
        : 'Precio digitado'
  // Solo se compara con lo que cobró este mismo proveedor; otro proveedor puede tener otro precio sin que sea un error.
  const mismoProveedor = compra && compra.proveedorId === item.proveedorId
  const variacion = mismoProveedor && compra.precio > 0 ? (vu - compra.precio) / compra.precio : 0
  const fuera = Boolean(mismoProveedor) && Math.abs(variacion) >= UMBRAL_VARIACION_PRECIO
  // El catálogo es lo normal: solo se dice el origen cuando es otro, para no repetir lo mismo en cada fila.
  if (origen === 'Precio de catálogo' && !fuera) return null
  return (
    <div className="mt-1 px-1 text-right text-xs leading-[18px]">
      {origen !== 'Precio de catálogo' && <p className="text-slate-500">{origen}</p>}
      {compra && fuera && (
        <p className="num text-amber-800" title={`Última compra ${moneyUnit(compra.precio)}`}>
          {textoVariacion(variacion)} frente a la última compra
        </p>
      )}
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{titulo}</p>
      {children}
    </div>
  )
}

function Opcion({ activa, titulo, detalle, precio, marca, onClick }: { activa: boolean; titulo: string; detalle: string; precio?: number; marca?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={activa}
      onClick={onClick}
      className={cn('grid w-full cursor-pointer grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors', activa ? 'bg-brand-50' : 'hover:bg-slate-50')}
    >
      <span className={cn('size-3.5 rounded-full border', activa ? 'border-4 border-brand-800' : 'border-slate-300')} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-900">{titulo}</span>
        <span className="block truncate text-xs text-slate-500">{detalle}</span>
      </span>
      <span className="text-right">
        {precio === undefined ? (
          <span className="block font-medium text-slate-400" aria-hidden>
            —
          </span>
        ) : (
          <span className="num block font-semibold text-slate-900">{moneyUnit(precio)}</span>
        )}
        {marca && <span className="block text-[11px] font-semibold text-emerald-700">{marca}</span>}
      </span>
    </button>
  )
}
