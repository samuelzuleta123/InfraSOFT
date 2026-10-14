import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Drawer, Tabs } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { precioNeto, totalFactura, totalOC } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { diasEntre, HOY, money, moneyUnit } from '@/lib/format'
import { useStore } from '@/store/useStore'

type Pestana = 'precios' | 'facturas' | 'ordenes'

export function FichaProveedor({ proveedorId, onClose }: { proveedorId: string; onClose: () => void }) {
  const proveedor = useStore((s) => s.proveedores.find((p) => p.id === proveedorId))
  const todosPrecios = useStore((s) => s.precios)
  const materiales = useStore((s) => s.materiales)
  const todasFacturas = useStore((s) => s.facturas)
  const todasOrdenes = useStore((s) => s.ordenes)
  const proyectos = useStore((s) => s.proyectos)
  const [tab, setTab] = useState<Pestana>('precios')
  if (!proveedor) return null

  const precios = todosPrecios
    .filter((p) => p.proveedorId === proveedorId)
    .map((p) => ({ p, m: materiales.find((x) => x.id === p.materialId)!, mejor: Math.min(...todosPrecios.filter((x) => x.materialId === p.materialId).map(precioNeto)) }))
    .sort((a, b) => a.m.descripcion.localeCompare(b.m.descripcion))
  const facturas = todasFacturas.filter((f) => f.proveedorId === proveedorId).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ordenes = todasOrdenes.filter((o) => o.proveedorId === proveedorId).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const pendientes = facturas.filter((f) => !f.pagada && f.formaPago !== 'Contado')
  const porPagar = pendientes.reduce((a, f) => a + totalFactura(f), 0)

  return (
    <Drawer open onClose={onClose} eyebrow={<span className="num">NIT {proveedor.nit} · {proveedor.ciudad}</span>} title={proveedor.nombre}>
      <dl className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
        <div className="px-6 py-4">
          <dt className="text-xs text-slate-500">Materiales con precio</dt>
          <dd className="num mt-1 text-lg font-semibold text-slate-900">{precios.length}</dd>
        </div>
        <div className="px-6 py-4">
          <dt className="text-xs text-slate-500">Órdenes de compra</dt>
          <dd className="num mt-1 text-lg font-semibold text-slate-900">{ordenes.length}</dd>
        </div>
        <div className="px-6 py-4">
          <dt className="text-xs text-slate-500">Por pagar</dt>
          <dd className="num mt-1 text-lg font-semibold text-slate-900">{money(porPagar)}</dd>
        </div>
      </dl>

      <Tabs
        className="px-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'precios', label: 'Precios', count: precios.length },
          { id: 'facturas', label: 'Facturas', count: facturas.length },
          { id: 'ordenes', label: 'Órdenes de compra', count: ordenes.length },
        ]}
      />

      {tab === 'precios' && (
        <ul className="divide-y divide-slate-100">
          {precios.map(({ p, m, mejor }) => {
            const neto = precioNeto(p)
            return (
              <li key={p.id} className="flex items-center gap-4 px-6 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{m.descripcion}</span>
                  <span className="block text-xs text-slate-500">
                    <span className="font-mono">{m.codigo}</span> · <FechaTexto iso={p.fecha} />
                  </span>
                </span>
                <span className="num shrink-0 text-right">
                  <span className="block font-semibold text-slate-900">{moneyUnit(neto)}</span>
                  {neto === mejor ? <span className="text-xs text-emerald-700">Mejor precio</span> : <span className="text-xs text-slate-500">+{moneyUnit(neto - mejor)} vs. mejor</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'facturas' && (
        <ul className="divide-y divide-slate-100">
          {facturas.map((f) => {
            const dias = diasEntre(HOY, f.vencimiento)
            const proyecto = proyectos.find((p) => p.id === f.proyectoId)
            return (
              <li key={f.id}>
                <Link to={`/facturas?f=${f.id}`} className="flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">{f.numero}</span>
                    <span className="block truncate text-xs text-slate-500">
                      <FechaTexto iso={f.fecha} /> · {proyecto ? proyecto.codigo : 'Sin asignar'}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block font-semibold text-slate-900">{money(totalFactura(f))}</span>
                    {f.pagada || f.formaPago === 'Contado' ? (
                      <Badge tone="ok">Pagada</Badge>
                    ) : dias < 0 ? (
                      <Badge tone="danger">Vencida hace {-dias} d</Badge>
                    ) : (
                      <Badge tone={dias <= 7 ? 'warn' : 'neutral'}>Vence en {dias} d</Badge>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
          {facturas.length === 0 && <li className="p-6 text-sm text-slate-500">No hay facturas registradas.</li>}
        </ul>
      )}

      {tab === 'ordenes' && (
        <ul className="divide-y divide-slate-100">
          {ordenes.map((o) => {
            const proyecto = proyectos.find((p) => p.id === o.proyectoId)
            return (
              <li key={o.id}>
                <Link to={`/proyectos/${o.proyectoId}/oc/${o.id}`} className="flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="num block font-medium text-slate-900">OC {o.consecutivo}</span>
                    <span className="block truncate text-xs text-slate-500">
                      <FechaTexto iso={o.fecha} /> · {proyecto?.nombre}
                    </span>
                  </span>
                  <span className={cn('num shrink-0 font-semibold text-slate-900')}>{money(totalOC(o))}</span>
                </Link>
              </li>
            )
          })}
          {ordenes.length === 0 && <li className="p-6 text-sm text-slate-500">No hay órdenes de compra.</li>}
        </ul>
      )}
    </Drawer>
  )
}
