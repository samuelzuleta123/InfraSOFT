import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Link2, ReceiptText } from 'lucide-react'
import { Badge, Button, Card, CardHeader, DL, EmptyState, Modal, PageHeader, Tabs, td, th } from '@/components/ui'
import { AdjuntoChip, FechaTexto } from '@/components/dominio'
import { totalFactura } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { HOY, money } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { FacturaProveedor } from '@/types'
import { VencimientosWidget } from './VencimientosWidget'
import { ComparacionOC } from './ComparacionOC'
import { AsociarModal, VincularFacturaModal } from './FacturaModales'

/** Las de contado se pagan al recibirlas; las de crédito se marcan a mano. */
function EstadoPago({ f }: { f: FacturaProveedor }) {
  if (f.formaPago === 'Contado') return <Badge tone="ok">Pagada (contado)</Badge>
  if (f.pagada) return <Badge tone="ok">Pagada</Badge>
  if (f.vencimiento < HOY) return <Badge tone="danger">Vencida</Badge>
  return <Badge tone="warn">Pendiente</Badge>
}

export function FacturasPage() {
  const facturas = useStore((s) => s.facturas)
  const proyectos = useStore((s) => s.proyectos)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'sin' | 'proyecto'>(() => {
    const f = facturas.find((x) => x.id === params.get('f'))
    return f && f.proyectoId ? 'proyecto' : 'sin'
  })
  const [vincular, setVincular] = useState(false)
  const [asociar, setAsociar] = useState<string | null>(null)
  const detalleId = params.get('f')
  const sinAsignar = facturas.filter((f) => !f.proyectoId)
  const asignadas = facturas.filter((f) => f.proyectoId)
  // Las facturas nuevas siempre llevan proyecto: "Sin asignar" solo existe mientras queden facturas anteriores sin asociar.
  const tabVisible = sinAsignar.length > 0 ? tab : 'proyecto'

  const abrir = (id: string | null) => setParams(id ? { f: id } : {}, { replace: true })

  return (
    <>
      <PageHeader
        title="Facturas de proveedores"
        description="Lo que Infrasoft debe o ya pagó a sus proveedores, por proyecto y comparado contra la OC. El PDF y el XML se guardan como adjuntos."
        actions={
          <Button variant="primary" icon={<Link2 />} onClick={() => setVincular(true)}>
            Vincular factura
          </Button>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <Tabs
            className="px-3"
            value={tabVisible}
            onChange={setTab}
            tabs={[
              ...(sinAsignar.length > 0 ? [{ id: 'sin' as const, label: 'Facturas sin asignar', count: sinAsignar.length }] : []),
              { id: 'proyecto', label: 'Facturas por proyecto', count: asignadas.length },
            ]}
          />
          {tabVisible === 'sin' ? (
            <>
              <p className="px-5 pt-4 text-[13px] text-slate-600">Facturas registradas antes de que el proyecto fuera obligatorio. Asócialas a su proyecto para sacarlas de esta lista.</p>
              <TablaFacturas facturas={sinAsignar} onAbrir={abrir} onAsociar={setAsociar} />
            </>
          ) : (
            <div className="divide-y divide-slate-200">
              {proyectos
                .filter((p) => asignadas.some((f) => f.proyectoId === p.id))
                .map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between gap-3 bg-slate-50/70 px-5 py-2.5">
                      <Link to={`/proyectos/${p.id}/compras`} className="text-sm font-semibold text-slate-900 hover:text-brand-800">
                        {p.nombre}
                      </Link>
                      <span className="text-xs text-slate-500">{p.codigo}</span>
                    </div>
                    <TablaFacturas facturas={asignadas.filter((f) => f.proyectoId === p.id)} onAbrir={abrir} onAsociar={setAsociar} />
                  </div>
                ))}
              {asignadas.length === 0 && <EmptyState icon={<ReceiptText />} title="Aún no hay facturas asociadas" />}
            </div>
          )}
        </Card>

        <Card className="2xl:sticky 2xl:top-20">
          <CardHeader title="Facturas por vencer" description="Crédito, ordenadas por fecha de vencimiento." />
          <VencimientosWidget />
        </Card>
      </div>

      {detalleId && <DetalleFactura id={detalleId} onClose={() => abrir(null)} onAsociar={(id) => setAsociar(id)} />}
      {asociar && <AsociarModal facturaId={asociar} onClose={() => setAsociar(null)} onDone={() => setTab('proyecto')} />}
      {vincular && <VincularFacturaModal onClose={() => setVincular(false)} onVinculada={() => setTab('proyecto')} />}
    </>
  )
}

function TablaFacturas({ facturas, onAbrir, onAsociar }: { facturas: FacturaProveedor[]; onAbrir: (id: string) => void; onAsociar: (id: string) => void }) {
  const proveedores = useStore((s) => s.proveedores)
  const ordenes = useStore((s) => s.ordenes)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-sm">
        <thead className="border-b border-slate-200">
          <tr>
            <th className={th}>Proveedor / N.°</th>
            <th className={th}>Fecha</th>
            <th className={th}>Vence</th>
            <th className={th}>Forma de pago</th>
            <th className={th}>Estado</th>
            <th className={cn(th, 'text-right')}>Subtotal</th>
            <th className={cn(th, 'text-right')}>IVA</th>
            <th className={cn(th, 'text-right')}>Total</th>
            <th className={th}>Adjuntos</th>
            <th className={th}>OC</th>
            <th className={th}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {facturas.map((f) => {
            const oc = ordenes.find((o) => o.id === f.ocId)
            return (
              <tr key={f.id} className="hover:bg-slate-50/60">
                <td className={td}>
                  <button onClick={() => onAbrir(f.id)} className="text-left">
                    <span className="block font-medium text-brand-800 hover:underline">{f.numero}</span>
                    <span className="block text-xs text-slate-500">{nombreProveedor(proveedores, f.proveedorId, 'Sin proveedor')}</span>
                  </button>
                </td>
                <td className={cn(td, 'text-slate-600')}>
                  <FechaTexto iso={f.fecha} />
                </td>
                <td className={cn(td, 'text-slate-600')}>
                  <FechaTexto iso={f.vencimiento} />
                </td>
                <td className={cn(td, 'text-slate-600')}>{f.formaPago}</td>
                <td className={td}>
                  <EstadoPago f={f} />
                </td>
                <td className={cn(td, 'num text-right')}>{money(f.subtotal)}</td>
                <td className={cn(td, 'num text-right text-slate-600')}>{money(f.iva)}</td>
                <td className={cn(td, 'num text-right font-semibold text-slate-900')}>{money(totalFactura(f))}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {f.adjuntos.map((a) => (
                      <AdjuntoChip key={a.nombre} adjunto={a} etiqueta={a.tipo.toUpperCase()} contexto={{ tipo: 'facturaProveedor', id: f.id }} />
                    ))}
                  </div>
                </td>
                <td className={td}>{oc ? <span className="num whitespace-nowrap text-slate-700">{oc.consecutivo}</span> : <span className="whitespace-nowrap text-slate-500">Sin OC</span>}</td>
                <td className={cn(td, 'text-right')}>
                  <Button size="sm" variant={f.proyectoId ? 'ghost' : 'subtle'} icon={<Link2 />} onClick={() => onAsociar(f.id)}>
                    {f.proyectoId ? 'Editar' : 'Asociar a proyecto / OC'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DetalleFactura({ id, onClose, onAsociar }: { id: string; onClose: () => void; onAsociar: (id: string) => void }) {
  const f = useStore((s) => s.facturas.find((x) => x.id === id))
  const proveedores = useStore((s) => s.proveedores)
  const proyecto = useStore((s) => s.proyectos.find((p) => p.id === f?.proyectoId))
  const oc = useStore((s) => s.ordenes.find((o) => o.id === f?.ocId))
  const mutar = useStore((s) => s.mutar)
  if (!f) return null
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Factura ${f.numero}`}
      description={nombreProveedor(proveedores, f.proveedorId, 'Sin proveedor')}
      footer={
        <>
          {f.formaPago !== 'Contado' && (
            <Button
              variant="ghost"
              className="mr-auto"
              onClick={() =>
                mutar((s) => {
                  const x = s.facturas.find((y) => y.id === f.id)
                  if (x) x.pagada = !x.pagada
                })
              }
            >
              {f.pagada ? 'Marcar como pendiente' : 'Marcar como pagada'}
            </Button>
          )}
          <Button variant="ghost" className={cn(f.formaPago === 'Contado' && 'mr-auto')} onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" icon={<Link2 />} onClick={() => onAsociar(f.id)}>
            {f.proyectoId ? 'Editar asociación' : 'Asociar a proyecto / OC'}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <DL
          items={[
            ['Fecha', <FechaTexto iso={f.fecha} />],
            ['Vencimiento', <FechaTexto iso={f.vencimiento} />],
            ['Forma de pago', f.formaPago],
            ['Estado de pago', <EstadoPago f={f} />],
            ...(f.notas ? ([['Notas', f.notas]] as [string, string][]) : []),
          ]}
        />
        <DL
          items={[
            ['Subtotal', <span className="num">{money(f.subtotal)}</span>],
            ['IVA', <span className="num">{money(f.iva)}</span>],
            ['Total', <span className="num font-semibold">{money(totalFactura(f))}</span>],
          ]}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {f.adjuntos.map((a) => (
          <AdjuntoChip key={a.nombre} adjunto={a} contexto={{ tipo: 'facturaProveedor', id: f.id }} />
        ))}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Comparación contra la orden de compra</h3>
        {proyecto ? (
          <p className="mb-3 text-[13px] text-slate-600">
            Proyecto{' '}
            <Link to={`/proyectos/${proyecto.id}/compras`} className="font-medium text-brand-800 hover:underline">
              {proyecto.codigo} · {proyecto.nombre}
            </Link>
          </p>
        ) : (
          <Badge tone="warn">Sin asignar a proyecto</Badge>
        )}
        {oc ? <ComparacionOC factura={f} oc={oc} /> : proyecto && <p className="text-[13px] text-slate-500">Asocia una OC para ver la comparación.</p>}
      </div>
    </Modal>
  )
}
