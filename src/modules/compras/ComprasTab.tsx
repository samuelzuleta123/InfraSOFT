import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileText, Pencil, RefreshCw, Send, ShoppingCart, X } from 'lucide-react'
import { Alert, Badge, Button, Card, CardHeader, DL, EmptyState, Field, Input, Modal, NumberInput } from '@/components/ui'
import { AdjuntoChip, EstadoCotBadge, FechaTexto, SubirArchivo, nombreEstadoCot } from '@/components/dominio'
import { resumen, totalCotizadoOC, totalOC, versionVigente } from '@/lib/calc'
import { itemsSinProveedor } from '@/lib/compras'
import { cn } from '@/lib/cn'
import { HOY, money, moneySigned } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { EstadoCotizacion, OCCliente, OrdenCompra, Proyecto } from '@/types'
import { EditarOCModal } from './EditarOCModal'

export function ComprasTab({ proyecto }: { proyecto: Proyecto }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <EstadoCotizacionCard proyecto={proyecto} />
        <OCClienteCard proyecto={proyecto} />
      </div>
      <OrdenesProveedorCard proyecto={proyecto} />
    </div>
  )
}

// ── Estados de la cotización ──────────────────────────────────────────

function EstadoCotizacionCard({ proyecto }: { proyecto: Proyecto }) {
  const cambiar = useStore((s) => s.cambiarEstadoCotizacion)
  const notificar = useStore((s) => s.notificar)
  const [fechaCambio, setFechaCambio] = useState(HOY)
  const activa = proyecto.cotizacion.versiones.find((v) => v.id === proyecto.cotizacion.versionActivaId)!

  const acciones: { estado: EstadoCotizacion; label: string; icon: React.ReactNode; variant: 'primary' | 'secondary' | 'danger' }[] = [
    { estado: 'enviada', label: 'Marcar enviada', icon: <Send />, variant: 'secondary' },
    { estado: 'aprobada', label: 'Aprobada', icon: <Check />, variant: 'primary' },
    { estado: 'rechazada', label: 'Rechazada', icon: <X />, variant: 'danger' },
  ]

  return (
    <Card>
      <CardHeader title="Estado de la cotización" description={`${proyecto.cotizacion.consecutivo} · borrador → enviada → aprobada o rechazada`} />
      <div className="p-5">
        <ol className="space-y-4">
          {proyecto.cotizacion.versiones.map((v) => (
            <li key={v.id} className={cn('rounded-md border p-3.5', v.id === activa.id ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{v.nombre}</span>
                  <EstadoCotBadge estado={v.estado} />
                  {v.id === activa.id && <span className="text-xs text-brand-700">versión en edición</span>}
                </div>
                <span className="num text-sm font-medium text-slate-900">{money(resumen(v).precioVigente)}</span>
              </div>
              <ol className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                {v.historial.map((h, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className={cn('size-1.5 rounded-full', h.estado === 'aprobada' ? 'bg-emerald-500' : h.estado === 'rechazada' ? 'bg-red-500' : h.estado === 'enviada' ? 'bg-sky-500' : 'bg-slate-400')} aria-hidden />
                    {nombreEstadoCot(h.estado)} <FechaTexto iso={h.fecha} />
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="mb-2 text-[13px] font-medium text-slate-700">Registrar respuesta para {activa.nombre}</div>
          <Field label="Fecha de la respuesta" htmlFor="fecha-estado" className="w-48">
            <Input id="fecha-estado" type="date" value={fechaCambio} onChange={(e) => setFechaCambio(e.target.value)} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {acciones.map((a) => (
              <Button
                key={a.estado}
                variant={a.variant}
                icon={a.icon}
                disabled={activa.estado === a.estado}
                onClick={() => {
                  cambiar(proyecto.id, activa.id, a.estado, fechaCambio)
                  notificar(`Cotización ${activa.nombre} marcada como ${nombreEstadoCot(a.estado).toLowerCase()}`)
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── OC del cliente ─────────────────────────────────────────────────────

function OCClienteCard({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const oc = proyecto.ocCliente
  const [editando, setEditando] = useState(!oc)
  const [form, setForm] = useState<OCCliente>(oc ?? { numero: '', fecha: HOY, valor: 0, adjunto: null })
  const cotizado = Math.round(resumen(versionVigente(proyecto)).precioVigente)
  const valorActual = editando ? form.valor : (oc?.valor ?? 0)
  const diferencia = valorActual - cotizado
  const hayValor = editando ? form.valor > 0 : !!oc

  const guardar = () => {
    editarProyecto(proyecto.id, (p) => {
      p.ocCliente = form
      if (p.etapa < 2) p.etapa = 2
    })
    setEditando(false)
    notificar(`OC del cliente ${form.numero} registrada`)
  }

  return (
    <Card>
      <CardHeader
        title="Orden de compra del cliente"
        description={`Valor cotizado: ${money(cotizado)}`}
        actions={
          oc && !editando ? (
            <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => (setForm(oc), setEditando(true))}>
              Editar
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-4 p-5">
        {editando ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Número de OC" htmlFor="oc-num">
                <Input id="oc-num" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ej. LOC-0081930" />
              </Field>
              <Field label="Fecha" htmlFor="oc-fecha">
                <Input id="oc-fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </Field>
              <Field label="Valor" htmlFor="oc-valor">
                <NumberInput id="oc-valor" value={form.valor || null} allowEmpty decimals={0} prefix="$" onChange={(n) => setForm({ ...form, valor: n ?? 0 })} />
              </Field>
              <Field label="Adjunto">
                <div className="flex min-h-9 flex-wrap items-center gap-2">
                  {form.adjunto ? <AdjuntoChip adjunto={form.adjunto} onRemove={() => setForm({ ...form, adjunto: null })} /> : <SubirArchivo accept=".pdf,image/*" onFile={(a) => setForm({ ...form, adjunto: a })} />}
                </div>
              </Field>
            </div>
          </>
        ) : (
          oc && (
            <DL
              items={[
                ['Número', <span className="font-semibold">{oc.numero}</span>],
                ['Fecha', <FechaTexto iso={oc.fecha} />],
                ['Valor', <span className="num font-semibold">{money(oc.valor)}</span>],
                ['Adjunto', oc.adjunto ? <AdjuntoChip adjunto={oc.adjunto} /> : <span className="text-slate-400">Sin adjunto</span>],
              ]}
            />
          )
        )}

        {hayValor &&
          (diferencia === 0 ? (
            <Alert tone="ok" title="El valor coincide con lo cotizado" />
          ) : (
            <Alert tone="warn" title="El valor de la OC no coincide con el cotizado">
              OC {money(valorActual)} frente a cotizado {money(cotizado)}: diferencia de <strong className="num">{moneySigned(diferencia)}</strong>. Verifica con el cliente antes de comprar.
            </Alert>
          ))}

        {editando && (
          <div className="flex justify-end gap-2">
            {oc && (
              <Button variant="ghost" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            )}
            <Button variant="primary" onClick={guardar} disabled={!form.numero.trim() || !form.valor}>
              Registrar OC
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── OC a proveedores ───────────────────────────────────────────────────

function OrdenesProveedorCard({ proyecto }: { proyecto: Proyecto }) {
  const todas = useStore((s) => s.ordenes)
  const generarOCs = useStore((s) => s.generarOCs)
  const notificar = useStore((s) => s.notificar)
  const proveedores = useStore((s) => s.proveedores)
  const [confirmar, setConfirmar] = useState(false)
  const [editar, setEditar] = useState<OrdenCompra | null>(null)
  const ordenes = todas.filter((o) => o.proyectoId === proyecto.id)
  const v = versionVigente(proyecto)
  const pendientes = itemsSinProveedor(v)

  const generar = () => {
    const n = generarOCs(proyecto.id)
    setConfirmar(false)
    notificar(n ? `Se generaron ${n} órdenes de compra, una por proveedor` : 'No hay ítems con proveedor asignado', n ? 'ok' : 'error')
  }

  return (
    <Card>
      <CardHeader
        title="Órdenes de compra a proveedores"
        description={`Una orden por cada proveedor seleccionado en la cotización ${v.nombre}. Solo incluye el material.`}
        actions={
          <Button variant="primary" icon={ordenes.length ? <RefreshCw /> : <ShoppingCart />} onClick={() => (ordenes.length ? setConfirmar(true) : generar())}>
            Generar órdenes de compra
          </Button>
        }
      />
      <div className="p-5">
        {pendientes.length > 0 && (
          <Alert
            tone="warn"
            className="mb-4"
            title={`${pendientes.length} ítem${pendientes.length === 1 ? '' : 's'} sin proveedor no entrarán en ninguna orden`}
            action={
              <Link to={`/proyectos/${proyecto.id}/cotizacion`} className="shrink-0 self-center text-[13px] font-medium text-amber-900 underline">
                Asignar en el cotizador
              </Link>
            }
          >
            {pendientes
              .slice(0, 4)
              .map((i) => i.descripcion)
              .join(' · ')}
            {pendientes.length > 4 && ` y ${pendientes.length - 4} más`}
          </Alert>
        )}

        {ordenes.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="Aún no hay órdenes de compra"
            description="Al generar, se crea una orden por proveedor con sus ítems y precios de la cotización. Luego puedes editarlas."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {ordenes.map((oc) => {
              const total = totalOC(oc)
              const dif = total - totalCotizadoOC(oc)
              const cambioProveedor = oc.proveedorId !== oc.proveedorOriginalId
              return (
                <article key={oc.id} className="flex flex-col rounded-lg border border-slate-200 bg-white">
                  <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        OC <span className="num font-semibold text-slate-900">{oc.consecutivo}</span> · <FechaTexto iso={oc.fecha} />
                      </div>
                      <div className="mt-0.5 truncate font-semibold text-slate-900">{nombreProveedor(proveedores, oc.proveedorId)}</div>
                      {cambioProveedor && <div className="text-xs text-amber-700">Cotizado con {nombreProveedor(proveedores, oc.proveedorOriginalId)}</div>}
                    </div>
                    {dif !== 0 ? <Badge tone="warn">Editada</Badge> : <Badge tone="ok">Según cotización</Badge>}
                  </header>
                  <ul className="flex-1 divide-y divide-slate-100 px-4 text-[13px]">
                    {oc.lineas.map((l) => (
                      <li key={l.id} className="flex items-baseline justify-between gap-3 py-2">
                        <span className="min-w-0 text-slate-700">
                          <span className="num mr-1 text-slate-400">
                            {l.cantidad.toLocaleString('es-CO')} {l.unidad}
                          </span>
                          {l.descripcion}
                        </span>
                        <span className="num shrink-0 text-slate-900">{money(l.cantidad * l.precioUnitario)}</span>
                      </li>
                    ))}
                  </ul>
                  <footer className="mt-auto border-t border-slate-100 px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] text-slate-500">Total</span>
                      <span className="num text-base font-semibold text-slate-900">{money(total)}</span>
                    </div>
                    {dif !== 0 && (
                      <div className={cn('num mt-0.5 text-right text-xs font-medium', dif > 0 ? 'text-red-700' : 'text-emerald-700')}>{moneySigned(dif)} frente a lo cotizado</div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/proyectos/${proyecto.id}/oc/${oc.id}`}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="size-4" aria-hidden />
                        Ver PDF
                      </Link>
                      <Button size="sm" className="flex-1" icon={<Pencil />} onClick={() => setEditar(oc)}>
                        Editar
                      </Button>
                    </div>
                  </footer>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        size="sm"
        title="¿Volver a generar las órdenes?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={generar}>
              Regenerar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Se reemplazarán las {ordenes.length} órdenes actuales de este proyecto, incluidas sus ediciones, por órdenes nuevas tomadas de la cotización.</p>
      </Modal>
      {editar && <EditarOCModal ocId={editar.id} onClose={() => setEditar(null)} />}
    </Card>
  )
}
