import { useState } from 'react'
import { Card, PageHeader, Tabs, td, th } from '@/components/ui'
import { totalFactura } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'
import { MaterialesVista } from './MaterialesVista'

export function CatalogoPage() {
  const [tab, setTab] = useState<'materiales' | 'proveedores'>('materiales')
  const materiales = useStore((s) => s.materiales)
  const proveedores = useStore((s) => s.proveedores)
  return (
    <>
      <PageHeader title="Catálogo y proveedores" description="Precios de cada material por proveedor. El precio neto alimenta el cotizador al elegir el proveedor de un ítem." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'materiales', label: 'Materiales', count: materiales.length },
          { id: 'proveedores', label: 'Proveedores', count: proveedores.length },
        ]}
      />
      {tab === 'materiales' ? <MaterialesVista /> : <Proveedores />}
    </>
  )
}

function Proveedores() {
  const proveedores = useStore((s) => s.proveedores)
  const precios = useStore((s) => s.precios)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/70">
            <tr>
              <th className={th}>Proveedor</th>
              <th className={th}>NIT</th>
              <th className={th}>Ciudad</th>
              <th className={cn(th, 'text-right')}>Materiales con precio</th>
              <th className={cn(th, 'text-right')}>Órdenes de compra</th>
              <th className={cn(th, 'text-right')}>Facturado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proveedores.map((p) => (
              <tr key={p.id}>
                <td className={cn(td, 'font-medium text-slate-900')}>{p.nombre}</td>
                <td className={cn(td, 'num text-slate-600')}>{p.nit}</td>
                <td className={cn(td, 'text-slate-600')}>{p.ciudad}</td>
                <td className={cn(td, 'num text-right')}>{precios.filter((x) => x.proveedorId === p.id).length}</td>
                <td className={cn(td, 'num text-right')}>{ordenes.filter((o) => o.proveedorId === p.id).length}</td>
                <td className={cn(td, 'num text-right font-medium')}>{money(facturas.filter((f) => f.proveedorId === p.id).reduce((a, f) => a + totalFactura(f), 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
