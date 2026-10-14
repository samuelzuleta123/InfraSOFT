import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react'
import { Badge, Button, Drawer, NumberInput, Select, Tabs } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { precioNeto, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { HOY, moneyUnit, pct, uid } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'

type Pestana = 'precios' | 'historial' | 'uso'

export function FichaMaterial({ materialId, onClose }: { materialId: string; onClose: () => void }) {
  const material = useStore((s) => s.materiales.find((m) => m.id === materialId))
  const todos = useStore((s) => s.precios)
  const historialTodo = useStore((s) => s.historial)
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const actualizarPrecio = useStore((s) => s.actualizarPrecio)
  const mutar = useStore((s) => s.mutar)
  const [tab, setTab] = useState<Pestana>('precios')
  const [nuevo, setNuevo] = useState('')
  if (!material) return null

  const precios = todos.filter((p) => p.materialId === materialId).sort((a, b) => precioNeto(a) - precioNeto(b))
  const mejor = precios[0]
  const sinPrecio = proveedores.filter((p) => !precios.some((x) => x.proveedorId === p.id))

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
    <Drawer
      open
      onClose={onClose}
      eyebrow={
        <>
          <Badge tone="brand">{material.categoria}</Badge>
          <span className="font-mono">{material.codigo}</span>
          <span aria-hidden>·</span>
          <span>Se cotiza {material.unidad === 'Mts' ? 'por metro' : 'por unidad'}</span>
        </>
      }
      title={material.descripcion}
      description={
        mejor ? (
          <>
            Mejor precio neto <strong className="num font-semibold text-slate-900">{moneyUnit(precioNeto(mejor))}</strong> con {nombreProveedor(proveedores, mejor.proveedorId)}
          </>
        ) : (
          'Aún no tiene precios de proveedor.'
        )
      }
    >
      <Tabs
        className="px-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'precios', label: 'Precios', count: precios.length },
          { id: 'historial', label: 'Historial', count: historial.length },
          { id: 'uso', label: 'Uso en proyectos', count: usos.length },
        ]}
      />

      {tab === 'precios' && (
        <div className="space-y-3 p-6">
          {precios.length === 0 && <p className="text-sm text-slate-500">Agrega el precio de un proveedor para poder cotizar este material con precio de catálogo.</p>}
          {precios.map((p) => {
            const neto = precioNeto(p)
            const esMejor = p.id === mejor?.id && precios.length > 1
            return (
              <section key={p.id} className={cn('rounded-lg border p-4', esMejor ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-slate-900">{nombreProveedor(proveedores, p.proveedorId)}</h3>
                    <p className="text-xs text-slate-500">
                      Actualizado el <FechaTexto iso={p.fecha} />
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="num text-lg font-semibold text-slate-900">{moneyUnit(neto)}</div>
                    {esMejor ? <Badge tone="ok">Mejor precio</Badge> : precios.length > 1 && mejor && <span className="num text-xs text-slate-500">+{moneyUnit(neto - precioNeto(mejor))}</span>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-slate-700">Precio de lista</span>
                    <NumberInput value={p.precioLista} prefix="$" onChange={(n) => actualizarPrecio(p.id, { precioLista: n ?? 0 })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-slate-700">% descuento</span>
                    <NumberInput value={p.descuentoPct} allowEmpty suffix="%" placeholder="0" onChange={(n) => actualizarPrecio(p.id, { descuentoPct: n })} />
                  </label>
                </div>
              </section>
            )
          })}
          {sinPrecio.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Select value={nuevo} onChange={(e) => setNuevo(e.target.value)} className="flex-1" aria-label="Proveedor a agregar">
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
          <p className="pt-1 text-xs text-slate-500">Precio neto = precio de lista × (1 − % descuento). Cada cambio queda en el historial con la fecha del día.</p>
        </div>
      )}

      {tab === 'historial' &&
        (historial.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Sin cambios registrados. Cuando edites el precio de lista o el descuento, el cambio aparecerá aquí.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {historial.map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-6 py-3 text-sm">
                <span className="num w-24 shrink-0 text-slate-500">
                  <FechaTexto iso={h.fecha} />
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-700">{nombreProveedor(proveedores, h.proveedorId)}</span>
                <span className="num w-24 text-right font-medium text-slate-900">{moneyUnit(h.neto)}</span>
                <span className="num w-20 text-right text-xs">
                  {h.variacion === null ? (
                    <span className="text-slate-500">Inicial</span>
                  ) : h.variacion === 0 ? (
                    <span className="text-slate-500">Igual</span>
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
        ))}

      {tab === 'uso' &&
        (usos.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Este material todavía no aparece en ninguna cotización.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {usos.map(({ p, i }) => (
              <li key={i.id}>
                <Link to={`/proyectos/${p.id}/cotizacion`} className="flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{p.nombre}</span>
                    <span className="block text-xs text-slate-500">
                      {p.codigo} · {nombreProveedor(proveedores, i.proveedorId)}
                    </span>
                  </span>
                  <span className="num shrink-0 text-right">
                    <span className="block font-medium text-slate-900">{moneyUnit(i.vuMaterial)}</span>
                    <span className="block text-xs text-slate-500">
                      × {i.cantidad.toLocaleString('es-CO')} {i.unidad}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </Drawer>
  )
}
