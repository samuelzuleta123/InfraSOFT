import { Navigate, useParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { liquidacion, versionVigente } from '@/lib/calc'
import { fecha, HOY, money, moneySigned, moneyUnit, num, pct } from '@/lib/format'
import { useCliente, useProyecto } from '@/store/useStore'

/** Liquidación del proyecto: cotizado frente a instalado, mano de obra real y utilidad. Documento interno. */
export function LiquidacionPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const v = versionVigente(proyecto)
  const l = liquidacion(v)
  const fc = proyecto.facturaCliente

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/cierre`} volverTexto="Volver al cierre" />

      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Liquidación de proyecto</div>
            <div className="num text-lg font-semibold text-slate-900">{proyecto.codigo}</div>
            <div className="num text-xs text-slate-500">Pereira, {fecha(HOY)}</div>
            <div className="mt-1 text-[10px] font-semibold tracking-wider text-red-700 uppercase">Documento interno</div>
          </div>
        </header>

        <section className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>
              {cliente.nombre} · {proyecto.sede}
            </div>
          </div>
          <div className="text-[12px]">
            <div>
              Cotización{' '}
              <span className="num font-medium">
                {proyecto.cotizacion.consecutivo}-{v.nombre.toUpperCase()}
              </span>
            </div>
            {proyecto.ocCliente && (
              <div>
                OC del cliente <span className="num font-medium">{proyecto.ocCliente.numero}</span>
              </div>
            )}
            {fc && (
              <div>
                Factura <span className="num font-medium">{fc.numero}</span> del {fecha(fc.fecha)}
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-px border border-slate-300 bg-slate-300 sm:grid-cols-4">
          {(
            [
              ['Mano de obra real', money(l.moReal), `Cotizada ${money(l.moCotizada)} (${moneySigned(l.moReal - l.moCotizada)})`],
              ['Costo real total', money(l.costoReal), `Material ${money(l.materialReal)} + otros`],
              ['Utilidad cotizada', money(l.utilidadEstimada), `${pct(l.margenEstimado)} del precio`],
              ['Utilidad real', money(l.utilidadRealObra), `${pct(l.margenRealObra)} del precio (${moneySigned(l.utilidadRealObra - l.utilidadEstimada)})`],
            ] as const
          ).map(([k, val, det]) => (
            <div key={k} className="bg-white p-3">
              <div className="text-[10px] tracking-wider text-slate-500 uppercase">{k}</div>
              <div className="num mt-0.5 text-[15px] font-semibold text-slate-900">{val}</div>
              <div className="num text-[10px] text-slate-500">{det}</div>
            </div>
          ))}
        </section>

        <table className="mt-5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-300 text-[9px] tracking-wider text-slate-500 uppercase">
              <th className="py-1.5 text-left font-semibold">Ítem</th>
              <th className="py-1.5 px-1.5 text-right font-semibold">Cant. cotizada</th>
              <th className="py-1.5 px-1.5 text-right font-semibold">Cant. instalada</th>
              <th className="py-1.5 px-1.5 text-right font-semibold">Diferencia</th>
              <th className="py-1.5 px-1.5 text-right font-semibold">V. unit. MO</th>
              <th className="py-1.5 text-right font-semibold">MO real</th>
            </tr>
          </thead>
          <tbody>
            {l.filas.map((f) => (
              <tr key={f.item.id} className="border-b border-slate-100">
                <td className="py-1">
                  {f.item.descripcion} <span className="text-slate-500">({f.item.unidad})</span>
                </td>
                <td className="num py-1 px-1.5 text-right">{num(f.cotizada, 2)}</td>
                <td className="num py-1 px-1.5 text-right">
                  {num(f.instalada, 2)}
                  {f.item.cantInstalada === null && <span className="text-slate-500"> (cot.)</span>}
                </td>
                <td className="num py-1 px-1.5 text-right">{f.diferencia === 0 ? '—' : `${f.diferencia > 0 ? '+' : ''}${num(f.diferencia, 2)}`}</td>
                <td className="num py-1 px-1.5 text-right">{moneyUnit(f.item.vuMO)}</td>
                <td className="num py-1 text-right font-medium">{money(f.moReal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={5} className="pt-2 text-right">
                Mano de obra real a pagar
              </td>
              <td className="num pt-2 text-right">{money(l.moReal)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 text-[10px] text-slate-500">(cot.) Ítem sin registro de obra: se toma la cantidad cotizada.</p>

        <section className="mt-14 grid grid-cols-2 gap-10">
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Elaboró</div>
            <div className="text-slate-500">Coordinación técnica</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Aprobó</div>
            <div className="text-slate-500">Gerencia</div>
          </div>
        </section>
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}
