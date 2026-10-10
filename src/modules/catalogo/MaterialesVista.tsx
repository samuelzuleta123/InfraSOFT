import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Boxes, Check, History, Plus, Search, Trophy } from 'lucide-react'
import { Badge, Button, Card, EmptyState, NumberInput, Select } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { precioNeto, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { HOY, money, pct, uid } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { CategoriaMaterial } from '@/types'

const CATEGORIAS: CategoriaMaterial[] = ['Fibra óptica', 'Cableado', 'Canalización', 'Equipos activos']

/** Catálogo maestro-detalle: lista de materiales a la izquierda, ficha de precios a la derecha. */
export function MaterialesVista() {
  const materiales = useStore((s) => s.materiales)
  const precios = useStore((s) => s.precios)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoriaMaterial | 'todas'>('todas')
  const [sel, setSel] = useState<string>(materiales[0]?.id)
  const detalleRef = useRef<HTMLDivElement>(null)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return materiales.filter((m) => (cat === 'todas' || m.categoria === cat) && (!t || m.codigo.toLowerCase().includes(t) || m.descripcion.toLowerCase().includes(t)))
  }, [q, cat, materiales])

  const seleccionar = (id: string) => {
    setSel(id)
    // En pantallas angostas la ficha queda debajo de la lista: llevar al usuario a ella.
    if (window.matchMedia('(max-width: 1279px)').matches) detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
      <Card className="flex flex-col overflow-hidden xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6.5rem)]">
        <div className="space-y-3 border-b border-slate-200 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código o descripción"
              aria-label="Buscar material"
              className="h-9 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="radiogroup" aria-label="Filtrar por categoría">
            {(['todas', ...CATEGORIAS] as const).map((c) => {
              const n = c === 'todas' ? materiales.length : materiales.filter((m) => m.categoria === c).length
              const activo = cat === c
              return (
                <button
                  key={c}
                  role="radio"
                  aria-checked={activo}
                  onClick={() => setCat(c)}
                  className={cn(
                    'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
                    activo ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  )}
                >
                  {c === 'todas' ? 'Todas' : c}
                  <span className={cn('num', activo ? 'text-brand-200' : 'text-slate-400')}>{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          <span>Material</span>
          <span>Mejor neto</span>
        </div>
        <ul className="max-h-[60dvh] min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto xl:max-h-none" aria-label="Materiales">
          {lista.map((m) => {
            const pm = precios.filter((p) => p.materialId === m.id)
            const mejor = pm.length ? Math.min(...pm.map(precioNeto)) : null
            const activo = m.id === sel
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => seleccionar(m.id)}
                  aria-current={activo ? 'true' : undefined}
                  className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors', activo ? 'bg-brand-50' : 'hover:bg-slate-50')}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', activo ? 'font-semibold text-brand-900' : 'font-medium text-slate-900')}>{m.descripcion}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-[11px]">{m.codigo}</span>
                      <span aria-hidden>·</span>
                      <span>{m.unidad}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {pm.length} prov.
                      </span>
                    </span>
                  </span>
                  <span className={cn('num shrink-0 text-sm', mejor === null ? 'text-slate-400' : activo ? 'font-semibold text-brand-900' : 'font-medium text-slate-900')}>
                    {mejor === null ? 'Sin precio' : money(mejor)}
                  </span>
                </button>
              </li>
            )
          })}
          {lista.length === 0 && (
            <li>
              <EmptyState icon={<Boxes />} title="Sin coincidencias" description="Prueba con otro código, otra descripción u otra categoría." />
            </li>
          )}
        </ul>
      </Card>

      <div ref={detalleRef} className="scroll-mt-20">
        {sel && <FichaMaterial materialId={sel} />}
      </div>
    </div>
  )
}

function FichaMaterial({ materialId }: { materialId: string }) {
  const material = useStore((s) => s.materiales.find((m) => m.id === materialId))
  const todos = useStore((s) => s.precios)
  const historialTodo = useStore((s) => s.historial)
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const actualizarPrecio = useStore((s) => s.actualizarPrecio)
  const mutar = useStore((s) => s.mutar)
  const [nuevo, setNuevo] = useState('')
  if (!material) return null

  const precios = todos.filter((p) => p.materialId === materialId).sort((a, b) => precioNeto(a) - precioNeto(b))
  const netos = precios.map(precioNeto)
  const mejor = netos.length ? Math.min(...netos) : null
  const peor = netos.length ? Math.max(...netos) : null
  const diferencia = mejor !== null && peor !== null && precios.length > 1 && mejor > 0 ? ((peor - mejor) / mejor) * 100 : null
  const mejorProveedor = precios[0]
  const ultima = precios.map((p) => p.fecha).sort().at(-1)
  const sinPrecio = proveedores.filter((p) => !precios.some((x) => x.proveedorId === p.id))

  // Historial con variación frente al registro anterior del mismo proveedor.
  const historial = historialTodo
    .filter((h) => h.materialId === materialId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((h, i, arr) => {
      const previo = arr.slice(0, i).filter((x) => x.proveedorId === h.proveedorId).at(-1)
      const neto = precioNeto(h)
      return { ...h, neto, variacion: previo ? ((neto - precioNeto(previo)) / precioNeto(previo)) * 100 : null }
    })
    .reverse()

  const usos = proyectos.flatMap((p) =>
    versionVigente(p)
      .secciones.flatMap((s) => s.items)
      .filter((i) => i.materialId === materialId)
      .map((i) => ({ p, i })),
  )

  return (
    <div className="space-y-5">
      <Card>
        <header className="px-5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone="brand">{material.categoria}</Badge>
            <span className="font-mono">{material.codigo}</span>
            <span aria-hidden>·</span>
            <span>Se cotiza por {material.unidad === 'Mts' ? 'metro' : 'unidad'}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-balance text-slate-900">{material.descripcion}</h2>
        </header>
        <dl className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          <div className="px-5 py-4">
            <dt className="text-[13px] text-slate-500">Mejor precio neto</dt>
            <dd className="num mt-1 text-xl font-semibold text-slate-900">{mejor === null ? '—' : money(mejor)}</dd>
            <dd className="mt-0.5 truncate text-xs text-slate-500">{mejorProveedor ? nombreProveedor(proveedores, mejorProveedor.proveedorId) : 'Sin proveedores'}</dd>
          </div>
          <div className="border-t border-slate-200 px-5 py-4 sm:border-t-0">
            <dt className="text-[13px] text-slate-500">Diferencia entre proveedores</dt>
            <dd className="num mt-1 text-xl font-semibold text-slate-900">{diferencia === null ? '—' : pct(diferencia)}</dd>
            <dd className="mt-0.5 text-xs text-slate-500">{diferencia === null ? 'Se necesita más de un proveedor' : `${money(peor! - mejor!)} por ${material.unidad === 'Mts' ? 'metro' : 'unidad'}`}</dd>
          </div>
          <div className="border-t border-slate-200 px-5 py-4 sm:border-t-0">
            <dt className="text-[13px] text-slate-500">Última actualización</dt>
            <dd className="num mt-1 text-xl font-semibold text-slate-900">
              <FechaTexto iso={ultima} />
            </dd>
            <dd className="mt-0.5 text-xs text-slate-500">
              {precios.length} proveedor{precios.length === 1 ? '' : 'es'} con precio
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Comparativa de proveedores</h3>
            <p className="mt-0.5 text-[13px] text-slate-500">Precio neto = precio de lista × (1 − % descuento). El cotizador carga este valor.</p>
          </div>
        </div>
        {precios.length === 0 ? (
          <EmptyState icon={<Boxes />} title="Este material aún no tiene precios" description="Agrega el precio de un proveedor para poder cotizarlo con precio de catálogo." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {precios.map((p) => {
              const neto = precioNeto(p)
              const esMejor = neto === mejor && precios.length > 1
              const ancho = peor ? Math.max(4, (neto / peor) * 100) : 0
              return (
                <li key={p.id} className="grid grid-cols-1 gap-x-5 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{nombreProveedor(proveedores, p.proveedorId)}</span>
                      {esMejor && (
                        <Badge tone="ok">
                          <Trophy className="size-3" aria-hidden />
                          Mejor precio
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                        <div className={cn('h-full rounded-full transition-[width] duration-300', esMejor || precios.length === 1 ? 'bg-brand-700' : 'bg-slate-400')} style={{ width: `${ancho}%` }} />
                      </div>
                      <span className="num w-24 text-right text-base font-semibold text-slate-900">{money(neto)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Actualizado el <FechaTexto iso={p.fecha} />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:pt-0.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Precio de lista</span>
                      <NumberInput value={p.precioLista} prefix="$" onChange={(n) => actualizarPrecio(p.id, { precioLista: n ?? 0 })} className="w-36" inputClassName="h-9" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">% descuento</span>
                      <NumberInput value={p.descuentoPct} allowEmpty suffix="%" placeholder="0" onChange={(n) => actualizarPrecio(p.id, { descuentoPct: n })} className="w-24" inputClassName="h-9" />
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {sinPrecio.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
            <Select value={nuevo} onChange={(e) => setNuevo(e.target.value)} className="w-auto! min-w-64" aria-label="Proveedor a agregar">
              <option value="">Agregar precio de otro proveedor…</option>
              {sinPrecio.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
            <Button
              icon={<Plus />}
              disabled={!nuevo}
              onClick={() => {
                mutar((s) => {
                  s.precios.push({ id: uid('pp'), materialId, proveedorId: nuevo, precioLista: 0, descuentoPct: null, fecha: HOY })
                })
                setNuevo('')
              }}
            >
              Agregar
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 2xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h3 className="text-[15px] font-semibold text-slate-900">Historial de precios</h3>
            <p className="mt-0.5 text-[13px] text-slate-500">Cada cambio de precio queda registrado con su fecha.</p>
          </div>
          {historial.length === 0 ? (
            <EmptyState icon={<History />} title="Sin cambios registrados" description="Cuando edites el precio de lista o el descuento, el cambio aparecerá aquí." className="py-8" />
          ) : (
            <ol className="divide-y divide-slate-100">
              {historial.map((h) => (
                <li key={h.id} className="flex items-center gap-4 px-5 py-2.5 text-sm">
                  <span className="num w-24 shrink-0 text-slate-500">
                    <FechaTexto iso={h.fecha} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-700">{nombreProveedor(proveedores, h.proveedorId)}</span>
                  <span className="num w-24 text-right font-medium text-slate-900">{money(h.neto)}</span>
                  <span className="num w-20 text-right text-xs">
                    {h.variacion === null ? (
                      <span className="text-slate-400">Inicial</span>
                    ) : h.variacion === 0 ? (
                      <span className="text-slate-400">Sin cambio</span>
                    ) : (
                      <span className={cn('inline-flex items-center gap-0.5 font-medium', h.variacion > 0 ? 'text-red-700' : 'text-emerald-700')}>
                        {h.variacion > 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
                        {pct(Math.abs(h.variacion))}
                        <span className="sr-only">{h.variacion > 0 ? 'de aumento' : 'de reducción'}</span>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h3 className="text-[15px] font-semibold text-slate-900">Usado en cotizaciones</h3>
            <p className="mt-0.5 text-[13px] text-slate-500">Versión vigente de cada proyecto.</p>
          </div>
          {usos.length === 0 ? (
            <EmptyState icon={<Check />} title="No se ha cotizado todavía" className="py-8" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {usos.map(({ p, i }) => (
                <li key={i.id}>
                  <Link to={`/proyectos/${p.id}/cotizacion`} className="flex items-center gap-4 px-5 py-2.5 text-sm hover:bg-slate-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{p.nombre}</span>
                      <span className="block text-xs text-slate-500">
                        {p.codigo} · {nombreProveedor(proveedores, i.proveedorId)}
                      </span>
                    </span>
                    <span className="num text-right text-xs text-slate-500">
                      {i.cantidad.toLocaleString('es-CO')} {i.unidad} ×<br />
                      <span className="text-sm font-medium text-slate-900">{money(i.vuMaterial)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
