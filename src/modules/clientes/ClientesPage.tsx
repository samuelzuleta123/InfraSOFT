import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Cpu, Plus, Search } from 'lucide-react'
import { Badge, Button, Card, Drawer, EmptyState, Field, Input, Modal, PageHeader, Tabs } from '@/components/ui'
import { AdjuntoChip, EtapaBadge, FechaTexto } from '@/components/dominio'
import { resumen, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money, pct } from '@/lib/format'
import { filasRentabilidad, totalizar } from '@/lib/rentabilidad'
import { useStore } from '@/store/useStore'
import { NuevoProyectoModal } from '@/modules/proyectos/NuevoProyectoModal'

const thc = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'

export function ClientesPage() {
  const clientes = useStore((s) => s.clientes)
  const proyectos = useStore((s) => s.proyectos)
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const rent = useMemo(() => filasRentabilidad(proyectos), [proyectos])

  const filas = clientes
    .filter((c) => !q.trim() || `${c.nombre} ${c.nit} ${c.ciudad}`.toLowerCase().includes(q.trim().toLowerCase()))
    .map((c) => {
      const ps = proyectos.filter((p) => p.clienteId === c.id)
      const t = totalizar(rent.filter((f) => f.proyecto.clienteId === c.id))
      return { c, ps, activos: ps.filter((p) => !p.facturaCliente).length, ultimo: ps.map((p) => p.creado).sort().at(-1), ...t }
    })
    .sort((a, b) => (b.ultimo ?? '').localeCompare(a.ultimo ?? ''))

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cada cliente con sus proyectos, documentos y los equipos instalados con su serial y garantía."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo cliente
          </Button>
        }
      />
      <Card>
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, NIT o ciudad"
              aria-label="Buscar cliente"
              className="h-9 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm placeholder:text-slate-500 hover:border-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                <th className={thc}>Cliente</th>
                <th className={cn(thc, 'text-right')}>Proyectos</th>
                <th className={cn(thc, 'text-right')}>Valor aprobado</th>
                <th className={cn(thc, 'text-right')}>Utilidad real o proyectada</th>
                <th className={thc}>Último proyecto</th>
                <th className="w-10">
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.c.id} onClick={() => setAbierto(f.c.id)} className="group cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-800" aria-hidden>
                        <Building2 className="size-4" />
                      </span>
                      <div>
                        <button type="button" onClick={() => setAbierto(f.c.id)} className="text-left font-medium text-slate-900 group-hover:text-brand-800">
                          {f.c.nombre}
                        </button>
                        <div className="num text-xs text-slate-500">
                          NIT {f.c.nit} · {f.c.ciudad}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="num px-4 py-3 text-right text-slate-700">
                    {f.ps.length}
                    {f.activos > 0 && (
                      <span className="ml-1 text-xs text-slate-500">
                        · {f.activos} {f.activos === 1 ? 'activo' : 'activos'}
                      </span>
                    )}
                  </td>
                  <td className="num px-4 py-3 text-right text-slate-700">{f.precio > 0 ? money(f.precio) : <span className="text-slate-500" title="Sin cotizaciones aprobadas">—</span>}</td>
                  <td className="num px-4 py-3 text-right">
                    {f.precio > 0 ? (
                      <>
                        <div className="font-medium text-slate-900">{money(f.utilidadReal)}</div>
                        <div className="text-xs text-slate-500">{pct(f.margenReal)} de margen</div>
                      </>
                    ) : (
                      <span className="text-slate-500" title="Sin cotizaciones aprobadas">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <FechaTexto iso={f.ultimo} />
                  </td>
                  <td className="px-2 py-3 text-slate-300 group-hover:text-slate-500">
                    <ChevronRight className="size-4" aria-hidden />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {abierto && <FichaCliente clienteId={abierto} onClose={() => setAbierto(null)} />}
      {nuevo && <NuevoClienteModal onClose={() => setNuevo(false)} onCreado={setAbierto} />}
    </>
  )
}

type Pestana = 'proyectos' | 'equipos' | 'documentos'

function FichaCliente({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const cliente = useStore((s) => s.clientes.find((c) => c.id === clienteId))
  const todos = useStore((s) => s.proyectos)
  const [tab, setTab] = useState<Pestana>('proyectos')
  const [nuevoProyecto, setNuevoProyecto] = useState(false)
  if (!cliente) return null
  const proyectos = todos.filter((p) => p.clienteId === clienteId).sort((a, b) => b.creado.localeCompare(a.creado))
  const t = totalizar(filasRentabilidad(proyectos))
  const equipos = proyectos.flatMap((p) => p.seriales.map((s) => ({ s, p })))

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        eyebrow={
          <span className="num">
            NIT {cliente.nit} · {cliente.ciudad}
          </span>
        }
        title={cliente.nombre}
        description={cliente.direccion}
        footer={
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevoProyecto(true)}>
            Nuevo proyecto para este cliente
          </Button>
        }
      >
        <dl className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
          <div className="px-6 py-4">
            <dt className="text-xs text-slate-500">Proyectos</dt>
            <dd className="num mt-1 text-lg font-semibold text-slate-900">{proyectos.length}</dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-xs text-slate-500">Valor aprobado</dt>
            <dd className="num mt-1 text-lg font-semibold text-slate-900">{t.precio ? money(t.precio) : '—'}</dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-xs text-slate-500">Margen</dt>
            <dd className="num mt-1 text-lg font-semibold text-slate-900">{t.precio ? pct(t.margenReal) : '—'}</dd>
          </div>
        </dl>
        <Tabs
          className="px-4"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'proyectos', label: 'Proyectos', count: proyectos.length },
            { id: 'equipos', label: 'Equipos y garantías', count: equipos.length },
            { id: 'documentos', label: 'Documentos' },
          ]}
        />
        {tab === 'proyectos' &&
          (proyectos.length ? (
            <ul className="divide-y divide-slate-100">
              {proyectos.map((p) => (
                <li key={p.id}>
                  <Link to={`/proyectos/${p.id}/historial`} className="flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{p.nombre}</span>
                      <span className="block text-xs text-slate-500">
                        {p.codigo} · <FechaTexto iso={p.creado} />
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="num block text-sm font-medium text-slate-900">{money(resumen(versionVigente(p)).precioVigente)}</span>
                      <EtapaBadge etapa={p.etapa} cerrado={!!p.facturaCliente} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Building2 />} title="Sin proyectos todavía" description="Crea el primer proyecto para este cliente." />
          ))}
        {tab === 'equipos' &&
          (equipos.length ? (
            <ul className="divide-y divide-slate-100">
              {equipos.map(({ s, p }) => (
                <li key={s.id} className="px-6 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-slate-900">
                      {s.equipo} {s.referencia}
                    </span>
                    <span className="font-mono text-xs text-slate-700">S/N {s.serial}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    <Link to={`/proyectos/${p.id}/ejecucion`} className="hover:text-brand-800 hover:underline">
                      {p.codigo}
                    </Link>
                    {p.entrega.fechaEntrega && (
                      <>
                        {' '}
                        · entregado el <FechaTexto iso={p.entrega.fechaEntrega} />
                      </>
                    )}
                  </div>
                  {p.entrega.garantia && <div className="mt-1 text-xs text-slate-600">{p.entrega.garantia}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Cpu />} title="Sin equipos con serial registrados" />
          ))}
        {tab === 'documentos' && (
          <ul className="divide-y divide-slate-100">
            {proyectos
              .filter((p) => p.ocCliente || p.facturaCliente || p.entrega.actaFirmada)
              .map((p) => (
                <li key={p.id} className="px-6 py-3">
                  <div className="text-sm font-medium text-slate-900">{p.nombre}</div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {p.ocCliente && <AdjuntoChip adjunto={p.ocCliente.adjunto ?? { nombre: `${p.ocCliente.numero}.pdf`, tipo: 'pdf' }} etiqueta={`OC ${p.ocCliente.numero}`} contexto={{ tipo: 'ocCliente', proyectoId: p.id }} />}
                    {p.facturaCliente && <AdjuntoChip adjunto={{ nombre: `${p.facturaCliente.numero}.pdf`, tipo: 'pdf' }} etiqueta={`Factura ${p.facturaCliente.numero}`} contexto={{ tipo: 'facturaCliente', proyectoId: p.id }} />}
                    {p.entrega.actaFirmada && <AdjuntoChip adjunto={p.entrega.actaFirmada} etiqueta="Acta firmada" contexto={{ tipo: 'acta', proyectoId: p.id }} />}
                  </div>
                </li>
              ))}
            {!proyectos.some((p) => p.ocCliente || p.facturaCliente || p.entrega.actaFirmada) && <li className="p-6 text-sm text-slate-500">Aún no hay órdenes de compra, actas ni facturas de este cliente.</li>}
          </ul>
        )}
      </Drawer>
      {nuevoProyecto && <NuevoProyectoModal clienteInicial={clienteId} onClose={() => setNuevoProyecto(false)} />}
    </>
  )
}

function NuevoClienteModal({ onClose, onCreado }: { onClose: () => void; onCreado: (id: string) => void }) {
  const crearCliente = useStore((s) => s.crearCliente)
  const notificar = useStore((s) => s.notificar)
  const [c, setC] = useState({ nombre: '', nit: '', direccion: '', ciudad: '' })
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Nuevo cliente"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!c.nombre.trim() || !c.nit.trim()}
            onClick={() => {
              const id = crearCliente(c)
              notificar(`Cliente ${c.nombre} creado`)
              onClose()
              onCreado(id)
            }}
          >
            Crear cliente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Razón social" htmlFor="ncl-nom">
          <Input id="ncl-nom" autoFocus value={c.nombre} onChange={(e) => setC({ ...c, nombre: e.target.value })} />
        </Field>
        <Field label="NIT" htmlFor="ncl-nit">
          <Input id="ncl-nit" value={c.nit} onChange={(e) => setC({ ...c, nit: e.target.value })} placeholder="000.000.000-0" />
        </Field>
        <Field label="Dirección" htmlFor="ncl-dir" optional>
          <Input id="ncl-dir" value={c.direccion} onChange={(e) => setC({ ...c, direccion: e.target.value })} />
        </Field>
        <Field label="Ciudad" htmlFor="ncl-ciu" optional>
          <Input id="ncl-ciu" value={c.ciudad} onChange={(e) => setC({ ...c, ciudad: e.target.value })} />
        </Field>
      </div>
      <Badge tone="neutral" className="mt-4">
        Los proyectos se asocian al cliente desde “Nuevo proyecto”.
      </Badge>
    </Modal>
  )
}
