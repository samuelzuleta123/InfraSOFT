import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { totalFactura } from '@/lib/calc'
import { diasEntre, HOY, money } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'

/** Facturas a crédito ordenadas por fecha de vencimiento. */
export function VencimientosWidget({ compacto }: { compacto?: boolean }) {
  const facturas = useStore((s) => s.facturas)
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const lista = facturas
    .filter((f) => f.formaPago !== 'Contado' && !f.pagada)
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
    .slice(0, compacto ? 5 : undefined)

  return (
    <ul className="divide-y divide-slate-100">
      {lista.map((f) => {
        const dias = diasEntre(HOY, f.vencimiento)
        const proyecto = proyectos.find((p) => p.id === f.proyectoId)
        return (
          <li key={f.id}>
            <Link to={`/facturas?f=${f.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <div className="w-14 shrink-0 text-center">
                <div className={`num text-lg leading-none font-semibold ${dias < 0 ? 'text-red-700' : dias <= 7 ? 'text-amber-700' : 'text-slate-900'}`}>{Math.abs(dias)}</div>
                <div className="text-xs text-slate-500 uppercase">{dias < 0 ? 'días venc.' : 'días'}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{nombreProveedor(proveedores, f.proveedorId)}</div>
                <div className="text-xs text-slate-500">
                  {f.numero} · <span className="whitespace-nowrap">vence <FechaTexto iso={f.vencimiento} /></span>
                </div>
                {!compacto && <div className="truncate text-xs text-slate-500">{proyecto ? proyecto.codigo : <span className="text-amber-700">Sin asignar</span>}</div>}
              </div>
              <div className="text-right">
                <div className="num text-sm font-semibold text-slate-900">{money(totalFactura(f))}</div>
                {dias < 0 ? <Badge tone="danger">Vencida</Badge> : dias <= 7 ? <Badge tone="warn">Esta semana</Badge> : compacto && !proyecto ? <Badge tone="warn">Sin asignar</Badge> : null}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
