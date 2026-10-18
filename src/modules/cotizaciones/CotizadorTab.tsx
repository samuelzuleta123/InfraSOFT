import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyPlus, Eye, FileText } from 'lucide-react'
import { Alert, Button, Card, CardHeader, Field, NumberInput, Textarea, Toggle, Input } from '@/components/ui'
import { EstadoCotBadge } from '@/components/dominio'
import { preciosCliente, resumen, siguienteNombreVersion, todosLosItems, versionActiva } from '@/lib/calc'
import { itemsSinProveedor } from '@/lib/compras'
import { compararConUltimaCompra, posibleErrorDeCeros, textoVariacion, UMBRAL_VARIACION_PRECIO } from '@/lib/historico'
import { money, moneyUnit } from '@/lib/format'
import { useHistoricoCompras, useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'
import { TablaSeccion } from './TablaSeccion'
import { ResumenBarra } from './ResumenPanel'
import { AgregarKitModal } from './AgregarModales'
import { SelectorVersion } from './SelectorVersion'

export function CotizadorTab({ proyecto }: { proyecto: Proyecto }) {
  const editarVersion = useStore((s) => s.editarVersion)
  const editarProyecto = useStore((s) => s.editarProyecto)
  const nuevaVersion = useStore((s) => s.nuevaVersion)
  const notificar = useStore((s) => s.notificar)
  const [vistaCliente, setVistaCliente] = useState(false)
  const [kitAbierto, setKitAbierto] = useState(false)

  const v = versionActiva(proyecto)
  const r = resumen(v)
  const cliente = preciosCliente(v)
  const pendientes = itemsSinProveedor(v)
  const historico = useHistoricoCompras()
  const preciosFuera = todosLosItems(v).flatMap((item) => {
    const c = compararConUltimaCompra(historico, item, proyecto.id)
    return c?.fuera ? [{ item, c }] : []
  })
  // Una versión aprobada o rechazada es un registro: para cambiarla se crea una versión nueva.
  const cerrado = proyecto.etapa >= 4
  const bloqueada = cerrado || v.estado === 'aprobada' || v.estado === 'rechazada'
  const fijarPrecioFinal = (n: number | null) => editarVersion(proyecto.id, (ver) => void (ver.precioFinal = n))

  return (
    <div>
      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="version" className="text-[13px] font-medium text-slate-600">
            Versión
          </label>
          <SelectorVersion proyecto={proyecto} cerrado={cerrado} />
          <EstadoCotBadge estado={v.estado} />
          <Button
            size="md"
            icon={<CopyPlus />}
            disabled={cerrado}
            title={cerrado ? 'El proyecto ya está en entrega o cierre' : undefined}
            onClick={() => {
              nuevaVersion(proyecto.id)
              notificar(`Se creó la versión ${siguienteNombreVersion(proyecto)} a partir de ${v.nombre}`)
            }}
          >
            Nueva versión
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle checked={vistaCliente} onChange={setVistaCliente} labelOff="Vista interna" label="Vista cliente" />
          {v.estado === 'borrador' && (
            <Link to={`/proyectos/${proyecto.id}/cotizacion/pdf?tipo=precotizacion${vistaCliente ? '' : '&vista=interna'}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
              <FileText className="size-4" aria-hidden />
              Precotización
            </Link>
          )}
          <Link
            to={`/proyectos/${proyecto.id}/cotizacion/pdf${vistaCliente ? '' : '?vista=interna'}`}
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
      {!vistaCliente && bloqueada && (
        <Alert tone="info" className="mb-4" title={cerrado ? 'Proyecto en entrega o cierre: la cotización es de solo lectura' : `Versión ${v.nombre} ${v.estado}: solo lectura`}>
          {cerrado
            ? 'La cotización queda como registro de lo vendido. Las cantidades reales se registran en Ejecución y se comparan en la liquidación.'
            : 'Para cambiar precios, cantidades o proveedores crea una nueva versión; la anterior se conserva tal como se envió.'}
        </Alert>
      )}
      {!vistaCliente && !bloqueada && preciosFuera.length > 0 && (
        <Alert tone="warn" className="mb-4" title={`${preciosFuera.length} ítem${preciosFuera.length === 1 ? '' : 's'} con precio muy distinto a la última compra al mismo proveedor`}>
          <ul className="num space-y-0.5">
            {preciosFuera.slice(0, 5).map(({ item, c }) => (
              <li key={item.id}>
                <span className="font-medium">{item.descripcion || 'Ítem sin descripción'}</span>: {moneyUnit(item.vuMaterial)} frente a {moneyUnit(c.compra.precio)} ({textoVariacion(c.variacion)})
                {posibleErrorDeCeros(c) && ' · ¿faltan o sobran ceros?'}
              </li>
            ))}
            {preciosFuera.length > 5 && <li>y {preciosFuera.length - 5} más</li>}
          </ul>
          <p className="mt-1">
            Se avisa desde una diferencia de {UMBRAL_VARIACION_PRECIO * 100} %. Puede ser un error de digitación. Confirma el precio antes de enviar, o elige el de la última compra en la columna Proveedor.
          </p>
        </Alert>
      )}
      {!vistaCliente && !bloqueada && pendientes.length > 0 && (
        <Alert tone="warn" className="mb-4" title={`${pendientes.length} ítem${pendientes.length === 1 ? '' : 's'} con material sin proveedor`}>
          Elige el proveedor de cada material en la columna Proveedor: así se carga su precio neto. Sin proveedor no se puede enviar la cotización ni generar su orden de compra.
        </Alert>
      )}

      <fieldset disabled={bloqueada} className="m-0 min-w-0 space-y-4 border-0 p-0">
        <TablaSeccion
          proyectoId={proyecto.id}
          seccion={v.secciones[0] ?? { id: 'sec-vacia', nombre: 'Ítems', items: [] }}
          otrosCostos={v.otrosCostos}
          vistaCliente={vistaCliente}
          preciosCliente={cliente.secciones.flatMap((s) => s.items)}
          totalCliente={cliente.total}
          onAgregarKit={() => setKitAbierto(true)}
          bloqueada={bloqueada}
          historico={historico}
        />

        {!vistaCliente && (
          <Card>
            <CardHeader
              title="Cómo se calcula el precio al cliente"
              description="Costo total + utilidad + otros ajustes = precio sugerido. Vacío equivale a 0 %; el precio final se puede cambiar abajo."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field
                label="% utilidad"
                htmlFor="utilidad"
                hint={
                  <>
                    Lo que gana Infrasoft. Se calcula sobre el costo total de <span className="num">{money(r.costo)}</span>
                    {r.utilidadPct > 0 && (
                      <>
                        : <span className="num font-medium text-slate-700">{money(r.utilidadSugerida)}</span>
                      </>
                    )}
                    .
                  </>
                }
              >
                <NumberInput
                  id="utilidad"
                  value={v.utilidadPct}
                  allowEmpty
                  suffix="%"
                  placeholder="0"
                  onChange={(n) => editarVersion(proyecto.id, (ver) => void (ver.utilidadPct = n))}
                />
              </Field>
              <Field
                label="% otros ajustes"
                htmlFor="ajustes"
                hint={
                  <>
                    Lo que se descuenta del precio y no es ganancia: comisiones, retenciones o impuestos. Se suma sobre costo + utilidad
                    {r.ajustesPct > 0 && (
                      <>
                        : <span className="num font-medium text-slate-700">{money(r.ajustesSugeridos)}</span>
                      </>
                    )}
                    .
                  </>
                }
              >
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
            <p className="num flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[13px] text-slate-500">
              <span>Costo {money(r.costo)}</span>
              <span>+ utilidad {money(r.utilidadSugerida)}</span>
              <span>+ ajustes {money(r.ajustesSugeridos)}</span>
              <span>
                = precio sugerido <span className="font-semibold text-slate-900">{money(r.precioSugerido)}</span>
              </span>
            </p>
          </Card>
        )}

        <Card>
          <CardHeader title="Datos de la propuesta" description="Se imprimen en el PDF que recibe el cliente." actions={<Eye className="size-4 text-slate-500" aria-hidden />} />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Descripción del alcance" htmlFor="alcance" className="md:col-span-2">
              <Textarea
                id="alcance"
                rows={3}
                value={proyecto.cotizacion.alcance}
                onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.alcance = e.target.value))}
              />
            </Field>
            <Field label="Tiempo de entrega" htmlFor="entrega">
              <Input
                id="entrega"
                value={proyecto.cotizacion.tiempoEntrega}
                onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.tiempoEntrega = e.target.value))}
              />
            </Field>
            <Field label="Condiciones comerciales" htmlFor="condiciones">
              <Textarea
                id="condiciones"
                rows={3}
                value={proyecto.cotizacion.condiciones}
                onChange={(e) => editarProyecto(proyecto.id, (p) => void (p.cotizacion.condiciones = e.target.value))}
              />
            </Field>
          </div>
        </Card>
      </fieldset>
      <fieldset disabled={bloqueada} className="m-0 contents border-0 p-0">
        <ResumenBarra r={r} vistaCliente={vistaCliente} onPrecioFinal={fijarPrecioFinal} />
      </fieldset>

      {kitAbierto && <AgregarKitModal open onClose={() => setKitAbierto(false)} proyectoId={proyecto.id} />}
    </div>
  )
}
