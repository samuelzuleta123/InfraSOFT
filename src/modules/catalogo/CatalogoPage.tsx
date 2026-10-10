import { useMemo, useState } from 'react'
import { Boxes, ChevronRight, Plus, Search, Truck } from 'lucide-react'
import { Badge, Button, Card, EmptyState, PageHeader, Select, Tabs } from '@/components/ui'
import { NuevoMaterialModal, NuevoProveedorModal } from './NuevosModales'
import { FechaTexto } from '@/components/dominio'
import { precioNeto, totalFactura } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { CategoriaMaterial } from '@/types'
import { FichaMaterial } from './FichaMaterial'
import { FichaProveedor } from './FichaProveedor'

const CATEGORIAS: CategoriaMaterial[] = ['Fibra óptica', 'Cableado', 'Canalización', 'Equipos activos', 'Inalámbrico', 'Racks y gabinetes', 'Energía']

/** Nombre corto para listas densas: sin la razón social. */
const nombreCorto = (nombre: string) => nombre.replace(/\s+S\.A\.S?\.?$/, '')

const thc = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'

export function CatalogoPage() {
  const [tab, setTab] = useState<'materiales' | 'proveedores'>('materiales')
  const materiales = useStore((s) => s.materiales)
  const proveedores = useStore((s) => s.proveedores)
  return (
    <>
      <PageHeader title="Catálogo y proveedores" description="Precios de cada material por proveedor. Al elegir el proveedor de un ítem, el cotizador carga su precio neto." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'materiales', label: 'Materiales', count: materiales.length },
          { id: 'proveedores', label: 'Proveedores', count: proveedores.length },
        ]}
      />
      {tab === 'materiales' ? <TablaMateriales /> : <TablaProveedores />}
    </>
  )
}

function TablaMateriales() {
  const materiales = useStore((s) => s.materiales)
  const precios = useStore((s) => s.precios)
  const proveedores = useStore((s) => s.proveedores)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoriaMaterial | ''>('')
  const [abierto, setAbierto] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const corto = (id: string) => nombreCorto(proveedores.find((x) => x.id === id)?.nombre ?? '')

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return materiales
      .filter((m) => (!cat || m.categoria === cat) && (!t || m.codigo.toLowerCase().includes(t) || m.descripcion.toLowerCase().includes(t)))
      .map((m) => {
        const pm = precios.filter((p) => p.materialId === m.id).sort((a, b) => precioNeto(a) - precioNeto(b))
        return { m, pm, mejor: pm[0], ultima: pm.map((p) => p.fecha).sort().at(-1) }
      })
  }, [q, cat, materiales, precios])

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código o descripción"
              aria-label="Buscar material"
              className="h-9 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm placeholder:text-slate-500 hover:border-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
            />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value as CategoriaMaterial | '')} aria-label="Categoría" className="sm:w-56!">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <span className="ml-auto text-[13px] text-slate-500">
            {filas.length} de {materiales.length} materiales
          </span>
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo material
          </Button>
        </div>

        {filas.length === 0 ? (
          <EmptyState icon={<Boxes />} title="Ningún material coincide" description="Prueba con otro código, otra descripción u otra categoría." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className={thc}>Material</th>
                  <th className={thc}>Categoría</th>
                  <th className={thc}>Proveedores</th>
                  <th className={cn(thc, 'text-right')}>Mejor precio neto</th>
                  <th className={thc}>Actualizado</th>
                  <th className="w-10">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map(({ m, pm, mejor, ultima }) => (
                  <tr key={m.id} onClick={() => setAbierto(m.id)} className="group cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setAbierto(m.id)} className="text-left font-medium text-slate-900 group-hover:text-brand-800">
                        {m.descripcion}
                      </button>
                      <div className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono">{m.codigo}</span> · {m.unidad === 'Mts' ? 'por metro' : 'por unidad'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.categoria}</td>
                    <td className="px-4 py-3 text-slate-600">{pm.length === 0 ? <Badge tone="warn">Sin precio</Badge> : pm.map((p) => corto(p.proveedorId)).join(', ')}</td>
                    <td className="num px-4 py-3 text-right">
                      {mejor ? (
                        <>
                          <div className="font-semibold text-slate-900">{money(precioNeto(mejor))}</div>
                          {pm.length > 1 && <div className="text-xs text-slate-500">{corto(mejor.proveedorId)}</div>}
                        </>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <FechaTexto iso={ultima} />
                    </td>
                    <td className="px-2 py-3 text-slate-300 group-hover:text-slate-500">
                      <ChevronRight className="size-4" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {abierto && <FichaMaterial materialId={abierto} onClose={() => setAbierto(null)} />}
      {nuevo && <NuevoMaterialModal onClose={() => setNuevo(false)} onCreado={(id) => setAbierto(id)} />}
    </>
  )
}

function TablaProveedores() {
  const proveedores = useStore((s) => s.proveedores)
  const precios = useStore((s) => s.precios)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <span className="text-[13px] text-slate-500">{proveedores.length} proveedores</span>
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo proveedor
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                <th className={thc}>Proveedor</th>
                <th className={cn(thc, 'text-right')}>Materiales</th>
                <th className={cn(thc, 'text-right')}>Órdenes de compra</th>
                <th className={cn(thc, 'text-right')}>Facturado</th>
                <th className={cn(thc, 'text-right')}>Por pagar</th>
                <th className="w-10">
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map((p) => {
                const fp = facturas.filter((f) => f.proveedorId === p.id)
                const porPagar = fp.filter((f) => !f.pagada && f.formaPago !== 'Contado').reduce((a, f) => a + totalFactura(f), 0)
                return (
                  <tr key={p.id} onClick={() => setAbierto(p.id)} className="group cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-800" aria-hidden>
                          <Truck className="size-4" />
                        </span>
                        <div>
                          <button type="button" onClick={() => setAbierto(p.id)} className="text-left font-medium text-slate-900 group-hover:text-brand-800">
                            {p.nombre}
                          </button>
                          <div className="num text-xs text-slate-500">
                            NIT {p.nit} · {p.ciudad}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num px-4 py-3.5 text-right text-slate-700">{precios.filter((x) => x.proveedorId === p.id).length}</td>
                    <td className="num px-4 py-3.5 text-right text-slate-700">{ordenes.filter((o) => o.proveedorId === p.id).length}</td>
                    <td className="num px-4 py-3.5 text-right text-slate-700">{money(fp.reduce((a, f) => a + totalFactura(f), 0))}</td>
                    <td className={cn('num px-4 py-3.5 text-right font-semibold', porPagar > 0 ? 'text-slate-900' : 'text-slate-500')}>{money(porPagar)}</td>
                    <td className="px-2 py-3.5 text-slate-300 group-hover:text-slate-500">
                      <ChevronRight className="size-4" aria-hidden />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {abierto && <FichaProveedor proveedorId={abierto} onClose={() => setAbierto(null)} />}
      {nuevo && <NuevoProveedorModal onClose={() => setNuevo(false)} />}
    </>
  )
}
