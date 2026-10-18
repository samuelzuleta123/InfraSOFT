import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FileClock, Inbox, Plus, ReceiptText } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Stat } from '@/components/ui'
import { NuevoProyectoModal } from '@/modules/proyectos/NuevoProyectoModal'
import { ETAPAS, FechaTexto } from '@/components/dominio'
import { ListaProyectos } from '@/modules/proyectos/ListaProyectos'
import { VencimientosWidget } from '@/modules/facturas/VencimientosWidget'
import { resumen } from '@/lib/calc'
import { diasEntre, fecha, HOY, money } from '@/lib/format'
import { useStore } from '@/store/useStore'

export function InicioPage() {
  const proyectos = useStore((s) => s.proyectos)
  const facturas = useStore((s) => s.facturas)
  const clientes = useStore((s) => s.clientes)
  const [nuevo, setNuevo] = useState(false)

  const porEtapa = ETAPAS.map((e) => ({ ...e, proyectos: proyectos.filter((p) => p.etapa === e.n) }))
  const max = Math.max(1, ...porEtapa.map((e) => e.proyectos.length))

  const pendientes = proyectos.flatMap((p) =>
    p.cotizacion.versiones
      .filter((v) => v.estado === 'enviada')
      .map((v) => ({ p, v, enviada: [...v.historial].reverse().find((h) => h.estado === 'enviada')?.fecha ?? v.creada })),
  )
  const porPagar = facturas.filter((f) => f.formaPago !== 'Contado' && !f.pagada)
  const proximas = porPagar.filter((f) => diasEntre(HOY, f.vencimiento) <= 30)
  const sinAsignar = facturas.filter((f) => !f.proyectoId)

  return (
    <>
      <PageHeader
        title="Inicio"
        description={`Corte al ${fecha(HOY)}: estado de los proyectos, cotizaciones por responder y obligaciones con proveedores.`}
        actions={
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo proyecto
          </Button>
        }
      />
      {nuevo && <NuevoProyectoModal onClose={() => setNuevo(false)} />}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-xs lg:grid-cols-4">
        <div className="bg-white p-5">
          <Stat label="Proyectos activos" value={proyectos.filter((p) => !p.facturaCliente).length} hint={`${proyectos.length} en total`} />
        </div>
        <div className="bg-white p-5">
          <Stat label="Cotizaciones por responder" value={pendientes.length} hint={money(pendientes.reduce((a, x) => a + resumen(x.v).precioVigente, 0)) + ' en propuestas'} />
        </div>
        <div className="bg-white p-5">
          <Stat
            label="Por pagar a proveedores (30 días)"
            value={money(proximas.reduce((a, f) => a + f.subtotal + f.iva, 0))}
            hint={`${proximas.length} factura${proximas.length === 1 ? '' : 's'}`}
            tone={proximas.length ? 'warn' : undefined}
          />
        </div>
        <Link to="/facturas" className="group bg-white p-5 transition-colors hover:bg-amber-50/50">
          <Stat label="Facturas sin asignar" value={sinAsignar.length} hint={<span className="text-brand-700 group-hover:underline">Asociar a proyecto →</span>} tone={sinAsignar.length ? 'warn' : undefined} />
        </Link>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Proyectos por etapa" />
          <ul className="space-y-3.5 p-5">
            {porEtapa.map((e) => (
              <li key={e.n}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-slate-700">
                    <span className="num mr-1.5 text-slate-500">{e.n}.</span>
                    {e.nombre}
                  </span>
                  <span className="num font-semibold text-slate-900">{e.proyectos.length}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div className="h-full rounded-full bg-brand-700 transition-[width] duration-300" style={{ width: `${(e.proyectos.length / max) * 100}%` }} />
                </div>
                {e.proyectos.length > 0 && (
                  // Se desliza de lado para leer todos los códigos sin cortarlos.
                  <div className="mt-1 overflow-x-auto pb-1 text-xs whitespace-nowrap text-slate-500">
                    {e.proyectos.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ', '}
                        <Link to={`/proyectos/${p.id}`} className="hover:text-brand-800 hover:underline">
                          {p.codigo}
                        </Link>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Cotizaciones pendientes de respuesta" actions={<Badge tone="info">{pendientes.length}</Badge>} />
          {pendientes.length === 0 ? (
            <EmptyState icon={<Inbox />} title="Sin cotizaciones por responder" description="Todas las cotizaciones enviadas ya tienen respuesta del cliente." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendientes.map(({ p, v, enviada }) => {
                const dias = diasEntre(enviada, HOY)
                return (
                  <li key={v.id}>
                    <Link to={`/proyectos/${p.id}/compras`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50">
                      <FileClock className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900">{p.nombre}</div>
                        <div className="text-xs text-slate-500">
                          {p.cotizacion.consecutivo} {v.nombre} · {clientes.find((c) => c.id === p.clienteId)?.nombre}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="size-3 shrink-0" aria-hidden />
                          <span>
                            Enviada el <FechaTexto iso={enviada} /> · hace {dias} día{dias === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                      <span className="num text-sm font-semibold text-slate-900">{money(resumen(v).precioVigente)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Facturas de proveedores por vencer"
            actions={
              <Link to="/facturas" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
                Ver todas <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {porPagar.length === 0 ? <EmptyState icon={<ReceiptText />} title="Sin facturas pendientes de pago" /> : <VencimientosWidget compacto />}
        </Card>
      </div>

      <div className="mt-5">
        <ListaProyectos titulo="Proyectos recientes" limite={6} />
      </div>
    </>
  )
}
