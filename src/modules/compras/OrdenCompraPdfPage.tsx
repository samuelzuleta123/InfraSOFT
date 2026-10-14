import { Navigate, useParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { totalLineaOC, totalOC } from '@/lib/calc'
import { fecha, money, moneyUnit } from '@/lib/format'
import { useProyecto, useStore } from '@/store/useStore'

export function OrdenCompraPdfPage() {
  const { id, ocId } = useParams()
  const proyecto = useProyecto(id)
  const oc = useStore((s) => s.ordenes.find((o) => o.id === ocId))
  const proveedor = useStore((s) => s.proveedores.find((p) => p.id === oc?.proveedorId))
  if (!proyecto || !oc || !proveedor) return <Navigate to={`/proyectos/${id}/compras`} replace />

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/compras`} volverTexto="Volver a compras" />
      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Orden de compra</div>
            <div className="num text-lg font-semibold text-slate-900">N.° {oc.consecutivo}</div>
            <div className="num text-xs text-slate-500">Pereira, {fecha(oc.fecha)}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proveedor</div>
            <div className="mt-1 font-semibold text-slate-900">{proveedor.nombre}</div>
            <div>NIT {proveedor.nit}</div>
            <div>{proveedor.ciudad}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>
              {proyecto.codigo} · {proyecto.sede}
            </div>
          </div>
        </section>

        <table className="mt-6 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-300 text-[10px] tracking-wider text-slate-500 uppercase">
              <th className="py-2 pr-2 text-left font-semibold">#</th>
              <th className="py-2 text-left font-semibold">Descripción</th>
              <th className="px-2 py-2 text-left font-semibold">Und.</th>
              <th className="px-2 py-2 text-right font-semibold">Cant.</th>
              <th className="px-2 py-2 text-right font-semibold">V. unitario</th>
              <th className="py-2 text-right font-semibold">V. total</th>
            </tr>
          </thead>
          <tbody>
            {oc.lineas.map((l, i) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="num py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2">{l.descripcion}</td>
                <td className="px-2 py-2">{l.unidad}</td>
                <td className="num px-2 py-2 text-right">{l.cantidad.toLocaleString('es-CO')}</td>
                <td className="num px-2 py-2 text-right">{moneyUnit(l.precioUnitario)}</td>
                <td className="num py-2 text-right">{money(totalLineaOC(l))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-3 font-semibold">
                Valor total
              </td>
              <td className="num pt-3 text-right text-base font-semibold text-slate-900">{money(totalOC(oc))}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-6 text-xs text-slate-500">
          Favor referenciar el número de esta orden en la factura y en la remisión. Entregar en Infrasoft Services S.A.S., Pereira, o en el sitio de obra según coordinación.
        </p>

        <section className="mt-16 grid grid-cols-2 gap-10">
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Elaboró</div>
            <div className="text-slate-500">Compras · Infrasoft Services S.A.S.</div>
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
