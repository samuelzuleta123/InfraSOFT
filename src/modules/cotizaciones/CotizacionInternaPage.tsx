import { Navigate, useParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { nombreEstadoCot } from '@/components/dominio'
import { itemMaterial, itemMO, itemSubtotal, resumen, totalesSeccion, totalOtroCosto, versionActiva } from '@/lib/calc'
import { fecha, HOY, money, moneyUnit, pct } from '@/lib/format'
import { nombreProveedor, useCliente, useProyecto, useStore } from '@/store/useStore'

const th = 'py-1.5 px-1.5 font-semibold'
const td = 'num py-1 px-1.5 text-right'

/** Cotización con costos internos: proveedor por ítem, mano de obra, material, otros costos y utilidad. Nunca se entrega al cliente. */
export function CotizacionInternaPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const proveedores = useStore((s) => s.proveedores)
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const v = versionActiva(proyecto)
  const r = resumen(v)
  let n = 1

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/cotizacion`} volverTexto="Volver al cotizador" />

      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-red-700 uppercase">Documento interno · no entregar al cliente</div>
            <div className="num text-lg font-semibold text-slate-900">
              {proyecto.cotizacion.consecutivo}-{v.nombre.toUpperCase()}
            </div>
            <div className="num text-xs text-slate-500">
              Estado: {nombreEstadoCot(v.estado).toLowerCase()} · Impreso {fecha(HOY)}
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Cliente</div>
            <div className="mt-1 font-semibold text-slate-900">{cliente.nombre}</div>
            <div>NIT {cliente.nit}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>
              {proyecto.codigo} · {proyecto.sede}
            </div>
          </div>
        </section>

        <table className="mt-5 w-full border-collapse text-[10.5px] leading-snug">
          <thead>
            <tr className="border-b border-slate-300 text-[9px] tracking-wider text-slate-500 uppercase">
              <th className={`${th} pl-0 text-left`}>#</th>
              <th className={`${th} text-left`}>Descripción</th>
              <th className={`${th} text-right`}>Cant.</th>
              <th className={`${th} text-right`}>V. unit. MO</th>
              <th className={`${th} text-right`}>V. total MO</th>
              <th className={`${th} text-right`}>V. unit. mat.</th>
              <th className={`${th} text-right`}>V. total mat.</th>
              <th className={`${th} text-left`}>Proveedor</th>
              <th className={`${th} pr-0 text-right`}>Subtotal</th>
            </tr>
          </thead>
          {v.secciones.map((s) => {
            const t = totalesSeccion(s)
            return (
              <tbody key={s.id}>
                <tr className="bg-slate-50">
                  <td colSpan={9} className="py-1.5 pl-1 font-semibold text-slate-900">
                    {s.nombre}
                  </td>
                </tr>
                {s.items.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100 align-top">
                    <td className="num py-1 pr-1.5 text-slate-400">{n++}</td>
                    <td className="py-1 px-1.5">{i.descripcion}</td>
                    <td className={td}>
                      {i.cantidad.toLocaleString('es-CO')} {i.unidad}
                    </td>
                    <td className={td}>{moneyUnit(i.vuMO)}</td>
                    <td className={td}>{money(itemMO(i))}</td>
                    <td className={td}>{moneyUnit(i.vuMaterial)}</td>
                    <td className={td}>{money(itemMaterial(i))}</td>
                    <td className="py-1 px-1.5">{i.vuMaterial > 0 ? nombreProveedor(proveedores, i.proveedorId) : '—'}</td>
                    <td className={`${td} pr-0 font-medium`}>{money(itemSubtotal(i))}</td>
                  </tr>
                ))}
                <tr className="border-b border-slate-300 font-semibold">
                  <td colSpan={4} className="py-1 px-1.5 text-right text-slate-500">
                    Total sección
                  </td>
                  <td className={td}>{money(t.mo)}</td>
                  <td />
                  <td className={td}>{money(t.material)}</td>
                  <td />
                  <td className={`${td} pr-0`}>{money(t.subtotal)}</td>
                </tr>
              </tbody>
            )
          })}
        </table>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Otros costos</h2>
            <table className="mt-1 w-full text-[11px]">
              <tbody>
                {v.otrosCostos.map((o) => (
                  <tr key={o.clave} className="border-b border-slate-100">
                    <td className="py-1">{o.nombre}</td>
                    <td className="num py-1 text-right text-slate-500">
                      {o.cantidad} × {moneyUnit(o.valorUnitario)}
                    </td>
                    <td className="num py-1 text-right">{money(totalOtroCosto(o))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Resumen de precio</h2>
            <dl className="mt-1 text-[12px]">
              {(
                [
                  ['Mano de obra', money(r.mo)],
                  ['Materiales', money(r.material)],
                  ['Otros costos', money(r.otros)],
                  ['Costo total', money(r.costo), true],
                  [`Utilidad (${pct(r.utilidadPct)})`, money(r.utilidadSugerida)],
                  [`Otros ajustes (${pct(r.ajustesPct)})`, money(r.ajustesSugeridos)],
                  ['Precio sugerido', money(r.precioSugerido)],
                  ['Precio final cotizado', r.precioFinal === null ? 'Sin digitar' : money(r.precioFinal), true],
                  ['Utilidad real', `${money(r.utilidadReal)} · ${pct(r.margenReal)} del precio`, true],
                ] as [string, string, boolean?][]
              ).map(([k, val, fuerte]) => (
                <div key={k} className={`flex justify-between py-0.5 ${fuerte ? 'border-t border-slate-200 font-semibold text-slate-900' : ''}`}>
                  <dt>{k}</dt>
                  <dd className="num">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}
