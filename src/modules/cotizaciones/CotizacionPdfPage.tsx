import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { Alert, Select } from '@/components/ui'
import { esMaterial, itemSubtotal, preciosCliente, resumen, todosLosItems, totalOtroCosto, versionActiva } from '@/lib/calc'
import { HOY, fecha, money, moneyUnit, pct } from '@/lib/format'
import { materialesIncompletos } from '@/lib/compras'
import { useCliente, useProyecto } from '@/store/useStore'

type Nivel = 'listado' | 'items' | 'total'
type TipoDoc = 'cotizacion' | 'precotizacion'

export function CotizacionPdfPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const [params] = useSearchParams()
  // Desde la vista cliente (y el expediente) el documento sale como lo recibe el cliente: listado y valor total, sin opciones.
  // Desde la vista interna se elige entre ítems con valor unitario y solo valor total.
  const interna = params.get('vista') === 'interna'
  const [nivelInterno, setNivel] = useState<Exclude<Nivel, 'listado'>>('items')
  const nivel: Nivel = interna ? nivelInterno : 'listado'
  // La precotización es el estimado rápido que se envía antes de confirmar precios con los proveedores.
  const [tipo, setTipo] = useState<TipoDoc>(params.get('tipo') === 'precotizacion' ? 'precotizacion' : 'cotizacion')
  const nav = useNavigate()
  const { state } = useLocation()
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  // Desde el expediente o desde Compras se abre una versión concreta; si no, la del cotizador.
  const v = proyecto.cotizacion.versiones.find((x) => x.id === params.get('version')) ?? versionActiva(proyecto)
  // Una versión ya respondida queda como registro: el PDF dice si el cliente la aprobó o la rechazó y cuándo.
  const respuesta = v.estado === 'aprobada' || v.estado === 'rechazada' ? v.historial.find((h) => h.estado === v.estado) : undefined
  const pc = preciosCliente(v)
  // Vista interna con ítems: unitarios a costo (material + instalación), sin inflar, y las líneas que llevan al total.
  const r = resumen(v)
  const itemsCosto = todosLosItems(v).sort((a, b) => Number(esMaterial(b)) - Number(esMaterial(a)))
  const subtotalItems = itemsCosto.reduce((a, i) => a + itemSubtotal(i), 0)
  const otrosCostos = v.otrosCostos.filter((o) => totalOtroCosto(o) > 0)
  const ajustes = Math.round(r.ajustesReales)
  // La ganancia cierra la cuenta al peso: lo que queda del precio después de costos y ajustes.
  const ganancia = pc.total - subtotalItems - r.otros - ajustes
  const fechaDoc = v.historial.find((h) => h.estado === 'enviada')?.fecha ?? v.creada
  const precot = tipo === 'precotizacion'
  const incompletos = materialesIncompletos(v)
  let n = 1

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/cotizacion`} volverTexto="Volver al cotizador">
        <label htmlFor="tipo" className="text-[13px] font-medium text-slate-600">
          Documento
        </label>
        <Select
          id="tipo"
          value={tipo}
          onChange={(e) => (e.target.value === 'interna' ? nav(`/proyectos/${proyecto.id}/cotizacion/interna`, { replace: true, state }) : setTipo(e.target.value as TipoDoc))}
          className="w-auto!"
        >
          <option value="precotizacion">Precotización</option>
          <option value="cotizacion">Cotización</option>
          {interna && <option value="interna">Interna (con costos)</option>}
        </Select>
        {interna && (
          <>
            <label htmlFor="nivel" className="text-[13px] font-medium text-slate-600">
              Nivel de detalle
            </label>
            <Select id="nivel" value={nivelInterno} onChange={(e) => setNivel(e.target.value as Exclude<Nivel, 'listado'>)} className="w-auto!">
              <option value="items">Ítems con valor unitario</option>
              <option value="total">Solo valor total</option>
            </Select>
          </>
        )}
      </BarraDocumento>

      {/* Solo en pantalla: con costos en $0 el valor total sale más bajo de lo real. */}
      {incompletos.total > 0 && (
        <div className="no-print mx-auto mt-4 max-w-[8.5in] px-4">
          <Alert
            tone={precot ? 'warn' : 'danger'}
            title={`Materiales incompletos: ${incompletos.resumen}. El valor total está por debajo del real.`}
            action={
              <Link to={`/proyectos/${proyecto.id}/cotizacion`} className="shrink-0 self-center text-[13px] font-medium underline">
                Completar en el cotizador
              </Link>
            }
          >
            {precot ? 'Si la envías así, aclara al cliente que es un estimado parcial. ' : 'No la envíes al cliente hasta completarla. '}
            {incompletos.accion}
          </Alert>
        </div>
      )}
      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          {(interna || respuesta) && (
            <div className="flex flex-1 flex-col items-center gap-2 self-center text-center">
              {respuesta && (
                <div className={`inline-block rounded border-2 px-4 py-1.5 ${respuesta.estado === 'aprobada' ? 'border-emerald-700 text-emerald-700' : 'border-red-700 text-red-700'}`}>
                  <div className="text-base leading-tight font-bold tracking-[0.2em] uppercase">{respuesta.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}</div>
                  <div className="num text-[9px] font-semibold tracking-wider uppercase">Por el cliente · {fecha(respuesta.fecha)}</div>
                </div>
              )}
              {interna && (
                <div className="inline-block rounded border-2 border-red-700 px-4 py-1.5 text-red-700">
                  <div className="text-base leading-tight font-bold tracking-[0.2em] uppercase">Interna</div>
                  <div className="text-[9px] font-semibold tracking-wider uppercase">No entregar al cliente</div>
                </div>
              )}
            </div>
          )}
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {precot ? 'Precotización' : 'Cotización'}
              {interna && ' interna'}
            </div>
            <div className="num text-lg font-semibold text-slate-900">
              {precot && 'PRE-'}
              {proyecto.cotizacion.consecutivo}-{v.nombre.toUpperCase()}
            </div>
            <div className="num text-xs text-slate-500">Pereira, {fecha(precot ? HOY : fechaDoc)}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Cliente</div>
            <div className="mt-1 font-semibold text-slate-900">{cliente.nombre}</div>
            <div>NIT {cliente.nit}</div>
            <div>{cliente.direccion}</div>
            <div>{cliente.ciudad}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>{proyecto.sede}</div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Alcance</h2>
          <p className="mt-1 text-justify">{proyecto.cotizacion.alcance}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{precot ? 'Valor estimado' : 'Valor de la propuesta'}</h2>
          {precot && (
            <p className="mt-1 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Valores estimados, sujetos a confirmación de precios con los proveedores y a la visita técnica. Este documento no es una oferta en firme; la cotización
              definitiva se envía una vez confirmados los precios.
            </p>
          )}
          {/* Sin precios por ítem: el cliente ve qué recibe y el valor total, sin unitarios que absorban utilidad y otros costos. */}
          {nivel === 'listado' && (
            <>
              <table className="mt-2 w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px] tracking-wider text-slate-500 uppercase">
                    <th className="py-2 pr-2 text-left font-semibold">#</th>
                    <th className="py-2 text-left font-semibold">Descripción</th>
                    <th className="py-2 px-2 text-left font-semibold">Und.</th>
                    <th className="py-2 pl-2 text-right font-semibold">Cant.</th>
                  </tr>
                </thead>
                {[
                  { titulo: 'Materiales y equipos', material: true },
                  { titulo: 'Mano de obra y servicios', material: false },
                ].map((g) => {
                  const items = pc.secciones.flatMap((s) => s.items).filter((ic) => esMaterial(ic.item) === g.material)
                  if (!items.length) return null
                  return (
                    <tbody key={g.titulo}>
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-1 py-1.5 text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                          {g.titulo}
                        </td>
                      </tr>
                      {items.map((ic) => (
                        <tr key={ic.item.id} className="border-b border-slate-100">
                          <td className="num py-1.5 pr-2 text-slate-400">{n++}</td>
                          <td className="py-1.5">{ic.item.descripcion}</td>
                          <td className="py-1.5 px-2">{ic.item.unidad}</td>
                          <td className="num py-1.5 pl-2 text-right">{ic.item.cantidad.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  )
                })}
              </table>
              <div className="mt-4 flex items-baseline justify-between rounded border border-slate-300 px-4 py-3">
                <span className="font-medium">Valor total del proyecto</span>
                <span className="num text-lg font-semibold text-slate-900">{money(pc.total)}</span>
              </div>
            </>
          )}
          {nivel === 'total' && (
            <div className="mt-2 flex items-baseline justify-between rounded border border-slate-300 px-4 py-3">
              <span className="font-medium">Valor total del proyecto</span>
              <span className="num text-lg font-semibold text-slate-900">{money(pc.total)}</span>
            </div>
          )}
          {nivel === 'items' && (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] tracking-wider text-slate-500 uppercase">
                  <th className="py-2 pr-2 text-left font-semibold">#</th>
                  <th className="py-2 text-left font-semibold">Descripción</th>
                  <th className="py-2 px-2 text-left font-semibold">Und.</th>
                  <th className="py-2 px-2 text-right font-semibold">Cant.</th>
                  <th className="py-2 px-2 text-right font-semibold">V. unitario</th>
                  <th className="py-2 text-right font-semibold">V. total</th>
                </tr>
              </thead>
              <tbody>
                {itemsCosto.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="num py-1.5 pr-2 text-slate-400">{n++}</td>
                    <td className="py-1.5">{i.descripcion}</td>
                    <td className="py-1.5 px-2">{i.unidad}</td>
                    <td className="num py-1.5 px-2 text-right">{i.cantidad.toLocaleString('es-CO')}</td>
                    <td className="num py-1.5 px-2 text-right">{moneyUnit(i.vuMaterial + i.vuMO)}</td>
                    <td className="num py-1.5 text-right">{money(itemSubtotal(i))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300">
                  <td />
                  <td colSpan={4} className="pt-2.5 pb-1">
                    Subtotal ítems (material e instalación)
                  </td>
                  <td className="num pt-2.5 pb-1 text-right">{money(subtotalItems)}</td>
                </tr>
                {r.otros > 0 && (
                  <tr>
                    <td />
                    <td colSpan={4} className="py-1">
                      Otros costos ({otrosCostos.map((o) => o.nombre).join(', ')})
                    </td>
                    <td className="num py-1 text-right">{money(r.otros)}</td>
                  </tr>
                )}
                {ajustes > 0 && (
                  <tr>
                    <td />
                    <td colSpan={4} className="py-1">
                      Otros ajustes ({pct(r.ajustesPct)}: comisiones, retenciones o impuestos)
                    </td>
                    <td className="num py-1 text-right">{money(ajustes)}</td>
                  </tr>
                )}
                <tr className="bg-brand-50">
                  <td />
                  <td colSpan={4} className="py-1.5 font-semibold text-brand-900">
                    Ganancia Infrasoft
                  </td>
                  <td className={`num py-1.5 text-right font-semibold ${ganancia < 0 ? 'text-red-700' : 'text-brand-900'}`}>{money(ganancia)}</td>
                </tr>
                <tr className="border-t-2 border-brand-500">
                  <td />
                  <td colSpan={4} className="pt-2.5 font-semibold">
                    Valor total
                  </td>
                  <td className="num pt-2.5 text-right text-base font-semibold text-slate-900">{money(pc.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Tiempo de entrega</h2>
            <p className="mt-1">{proyecto.cotizacion.tiempoEntrega}</p>
          </div>
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Condiciones</h2>
            <p className="mt-1 whitespace-pre-line">{proyecto.cotizacion.condiciones}</p>
          </div>
        </section>

        {!precot && (
          <section className="mt-14 grid grid-cols-2 gap-10">
            <div>
              <div className="border-t border-slate-400 pt-1.5 text-xs">
                <div className="font-semibold">Infrasoft Services S.A.S.</div>
                <div className="text-slate-500">Gerencia de proyectos</div>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1.5 text-xs">
                <div className="font-semibold">Aceptación del cliente</div>
                <div className="text-slate-500">{cliente.nombre}</div>
              </div>
            </div>
          </section>
        )}
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}
