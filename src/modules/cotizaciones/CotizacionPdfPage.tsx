import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { Alert, Select } from '@/components/ui'
import { preciosCliente, versionActiva } from '@/lib/calc'
import { HOY, fecha, money, moneyUnit } from '@/lib/format'
import { useCliente, useProyecto } from '@/store/useStore'

type Nivel = 'total' | 'secciones' | 'items'
type TipoDoc = 'cotizacion' | 'precotizacion'

export function CotizacionPdfPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const [nivel, setNivel] = useState<Nivel>('secciones')
  // La precotización es el estimado rápido que se envía antes de confirmar precios con los proveedores.
  const [params] = useSearchParams()
  const [tipo, setTipo] = useState<TipoDoc>(params.get('tipo') === 'precotizacion' ? 'precotizacion' : 'cotizacion')
  const nav = useNavigate()
  const { state } = useLocation()
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const v = versionActiva(proyecto)
  const pc = preciosCliente(v)
  const fechaDoc = v.historial.find((h) => h.estado === 'enviada')?.fecha ?? v.creada
  const precot = tipo === 'precotizacion'
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
          <option value="interna">Interna (con costos)</option>
        </Select>
        <label htmlFor="nivel" className="text-[13px] font-medium text-slate-600">
          Nivel de detalle
        </label>
        <Select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)} className="w-auto!">
          <option value="total">Solo valor total</option>
          <option value="secciones">Totales por sección</option>
          <option value="items">Ítems sin costos internos</option>
        </Select>
      </BarraDocumento>

      {!pc.cuadra && (
        <div className="no-print mx-auto mt-4 max-w-[8.5in] px-4">
          <Alert tone="danger" title="Este documento no cuadra al peso">
            La suma de los ítems no da exactamente {money(pc.total)}. Vuelve al cotizador y usa el precio final sugerido antes de enviarlo.
          </Alert>
        </div>
      )}
      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{precot ? 'Precotización' : 'Cotización'}</div>
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
          {nivel === 'total' && (
            <div className="mt-2 flex items-baseline justify-between rounded border border-slate-300 px-4 py-3">
              <span className="font-medium">Valor total del proyecto</span>
              <span className="num text-lg font-semibold text-slate-900">{money(pc.total)}</span>
            </div>
          )}
          {nivel === 'secciones' && (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] tracking-wider text-slate-500 uppercase">
                  <th className="py-2 text-left font-semibold">Capítulo</th>
                  <th className="py-2 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pc.secciones.map((s) => (
                  <tr key={s.seccion.id} className="border-b border-slate-200">
                    <td className="py-2">{s.seccion.nombre}</td>
                    <td className="num py-2 text-right">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-semibold">Valor total</td>
                  <td className="num pt-3 text-right text-base font-semibold text-slate-900">{money(pc.total)}</td>
                </tr>
              </tfoot>
            </table>
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
              {pc.secciones.map((s) => (
                <tbody key={s.seccion.id}>
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="py-1.5 pl-1 font-semibold text-slate-900">
                      {s.seccion.nombre}
                    </td>
                    <td className="num py-1.5 text-right font-semibold">{money(s.total)}</td>
                  </tr>
                  {s.items.map((ic) => (
                    <tr key={ic.item.id} className="border-b border-slate-100">
                      <td className="num py-1.5 pr-2 text-slate-400">{n++}</td>
                      <td className="py-1.5">{ic.item.descripcion}</td>
                      <td className="py-1.5 px-2">{ic.item.unidad}</td>
                      <td className="num py-1.5 px-2 text-right">{ic.item.cantidad.toLocaleString('es-CO')}</td>
                      <td className="num py-1.5 px-2 text-right">{moneyUnit(ic.unitario)}</td>
                      <td className="num py-1.5 text-right">{money(ic.total)}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-3 font-semibold">
                    Valor total
                  </td>
                  <td className="num pt-3 text-right text-base font-semibold text-slate-900">{money(pc.total)}</td>
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
