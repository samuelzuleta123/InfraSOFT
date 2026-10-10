import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyPlus, Eye, FileText, Plus } from 'lucide-react'
import { Alert, Button, Card, CardHeader, Field, NumberInput, Select, Textarea, Toggle, Input } from '@/components/ui'
import { EstadoCotBadge } from '@/components/dominio'
import { preciosCliente, resumen, versionActiva } from '@/lib/calc'
import { itemsSinProveedor } from '@/lib/compras'
import { fecha, money, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'
import { TablaSeccion } from './TablaSeccion'
import { ResumenBarra, ResumenPanel } from './ResumenPanel'
import { AgregarItemModal, AgregarKitModal } from './AgregarModales'

export function CotizadorTab({ proyecto }: { proyecto: Proyecto }) {
  const editarVersion = useStore((s) => s.editarVersion)
  const editarProyecto = useStore((s) => s.editarProyecto)
  const nuevaVersion = useStore((s) => s.nuevaVersion)
  const notificar = useStore((s) => s.notificar)
  const setCompacta = useStore((s) => s.setSidebarCompacta)
  const [vistaCliente, setVistaCliente] = useState(false)
  const [modal, setModal] = useState<{ tipo: 'item' | 'kit'; seccionId: string | null } | null>(null)

  // Modo enfoque: el cotizador necesita ancho, se contrae la barra lateral mientras está abierto.
  useEffect(() => {
    const previo = useStore.getState().sidebarCompacta
    setCompacta(true)
    return () => setCompacta(previo)
  }, [setCompacta])

  const v = versionActiva(proyecto)
  const r = resumen(v)
  const cliente = preciosCliente(v)
  const pendientes = itemsSinProveedor(v)
  const fijarPrecioFinal = (n: number | null) => editarVersion(proyecto.id, (ver) => void (ver.precioFinal = n))
  let contador = 1

  return (
    <div>
      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="version" className="text-[13px] font-medium text-slate-600">
            Versión
          </label>
          <Select
            id="version"
            value={v.id}
            onChange={(e) =>
              editarProyecto(proyecto.id, (p) => {
                p.cotizacion.versionActivaId = e.target.value
              })
            }
            className="h-9 w-auto! min-w-36"
          >
            {proyecto.cotizacion.versiones.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre} · {fecha(x.creada)}
              </option>
            ))}
          </Select>
          <EstadoCotBadge estado={v.estado} />
          <Button
            size="md"
            icon={<CopyPlus />}
            onClick={() => {
              nuevaVersion(proyecto.id)
              notificar(`Se creó la versión v${proyecto.cotizacion.versiones.length + 1} a partir de ${v.nombre}`)
            }}
          >
            Nueva versión
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle checked={vistaCliente} onChange={setVistaCliente} labelOff="Vista interna" label="Vista cliente" />
          <Link
            to={`/proyectos/${proyecto.id}/cotizacion/pdf`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-800 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <FileText className="size-4" aria-hidden />
            Vista previa PDF
          </Link>
        </div>
      </div>

      {vistaCliente && (
        <Alert tone="info" className="mb-4" title="Vista cliente">
          Se ocultan proveedores, costos internos, otros costos y utilidad. Así se presenta la propuesta al cliente.
        </Alert>
      )}
      {!vistaCliente && pendientes.length > 0 && (
        <Alert tone="warn" className="mb-4" title={`${pendientes.length} ítem${pendientes.length === 1 ? '' : 's'} con material sin proveedor`}>
          Elige el proveedor en la columna “Proveedor” para cargar su precio neto del catálogo. Los ítems sin proveedor no generan orden de compra.
        </Alert>
      )}

      <div className="grid items-start gap-5 min-[1360px]:grid-cols-[minmax(0,1fr)_288px] min-[1360px]:gap-4">
        <div className="min-w-0 space-y-4">
          {v.secciones.map((s, idx) => {
            const inicio = contador
            contador += s.items.length
            return (
              <TablaSeccion
                key={s.id}
                proyectoId={proyecto.id}
                seccion={s}
                numeroInicial={inicio}
                vistaCliente={vistaCliente}
                preciosCliente={cliente.secciones[idx]?.items}
                totalCliente={cliente.secciones[idx]?.total}
                onAgregarItem={() => setModal({ tipo: 'item', seccionId: s.id })}
                onAgregarKit={() => setModal({ tipo: 'kit', seccionId: s.id })}
                soloSeccion={v.secciones.length === 1}
              />
            )
          })}

          {!vistaCliente && (
            <button
              type="button"
              onClick={() =>
                editarVersion(proyecto.id, (ver) => {
                  ver.secciones.push({ id: uid('sec'), nombre: `Sección ${ver.secciones.length + 1}`, items: [] })
                })
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-800"
            >
              <Plus className="size-4" aria-hidden />
              Agregar sección
            </button>
          )}

          {!vistaCliente && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Card>
                <CardHeader title="Otros costos" description="Cantidad × valor unitario. Valores digitados por el usuario." />
                <table className="w-full text-[13px]">
                  <thead className="border-b border-slate-200 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Concepto</th>
                      <th className="w-24 px-2 py-2 text-right">Cantidad</th>
                      <th className="w-36 px-2 py-2 text-right">Valor unitario</th>
                      <th className="w-32 px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {v.otrosCostos.map((o, i) => (
                      <tr key={o.clave}>
                        <td className="px-4 py-1.5 font-medium text-slate-800">{o.nombre}</td>
                        <td className="px-2 py-1.5">
                          <NumberInput
                            value={o.cantidad}
                            aria-label={`Cantidad ${o.nombre}`}
                            onChange={(n) => editarVersion(proyecto.id, (ver) => void (ver.otrosCostos[i].cantidad = n ?? 0))}
                            inputClassName="h-8"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <NumberInput
                            value={o.valorUnitario}
                            prefix="$"
                            aria-label={`Valor unitario ${o.nombre}`}
                            onChange={(n) => editarVersion(proyecto.id, (ver) => void (ver.otrosCostos[i].valorUnitario = n ?? 0))}
                            inputClassName="h-8"
                          />
                        </td>
                        <td className="num px-4 py-1.5 text-right font-medium text-slate-900">{money(o.cantidad * o.valorUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50/70">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-xs text-slate-500">
                        Total otros costos
                      </td>
                      <td className="num px-4 py-2 text-right font-semibold text-slate-900">{money(r.otros)}</td>
                    </tr>
                  </tfoot>
                </table>
              </Card>

              <Card>
                <CardHeader title="Parámetros de precio" description="Los digita el usuario. Vacío equivale a 0 %." />
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                  <Field label="% utilidad" htmlFor="utilidad">
                    <NumberInput
                      id="utilidad"
                      value={v.utilidadPct}
                      allowEmpty
                      suffix="%"
                      placeholder="0"
                      onChange={(n) => editarVersion(proyecto.id, (ver) => void (ver.utilidadPct = n))}
                    />
                  </Field>
                  <Field label="% otros ajustes" htmlFor="ajustes" hint="Comisiones, retenciones u otros.">
                    <NumberInput
                      id="ajustes"
                      value={v.ajustesPct}
                      allowEmpty
                      suffix="%"
                      placeholder="0"
                      onChange={(n) => editarVersion(proyecto.id, (ver) => void (ver.ajustesPct = n))}
                    />
                  </Field>
                </div>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader title="Datos de la propuesta" description="Se imprimen en el PDF que recibe el cliente." actions={<Eye className="size-4 text-slate-400" aria-hidden />} />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Descripción del alcance" htmlFor="alcance" className="md:col-span-2">
                <Textarea
                  id="alcance"
                  rows={3}
                  value={proyecto.cotizacion.alcance}
                  readOnly={vistaCliente}
                  onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.alcance = e.target.value))}
                />
              </Field>
              <Field label="Tiempo de entrega" htmlFor="entrega">
                <Input
                  id="entrega"
                  value={proyecto.cotizacion.tiempoEntrega}
                  readOnly={vistaCliente}
                  onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.tiempoEntrega = e.target.value))}
                />
              </Field>
              <Field label="Condiciones comerciales" htmlFor="condiciones">
                <Textarea
                  id="condiciones"
                  rows={3}
                  value={proyecto.cotizacion.condiciones}
                  readOnly={vistaCliente}
                  onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.condiciones = e.target.value))}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="hidden min-[1360px]:sticky min-[1360px]:top-20 min-[1360px]:block">
          <ResumenPanel r={r} vistaCliente={vistaCliente} onPrecioFinal={fijarPrecioFinal} />
        </div>
      </div>
      <ResumenBarra r={r} vistaCliente={vistaCliente} onPrecioFinal={fijarPrecioFinal} />

      <AgregarItemModal open={modal?.tipo === 'item'} onClose={() => setModal(null)} proyectoId={proyecto.id} seccionId={modal?.seccionId ?? null} />
      {modal?.tipo === 'kit' && <AgregarKitModal open onClose={() => setModal(null)} proyectoId={proyecto.id} seccionId={modal.seccionId} />}
    </div>
  )
}
