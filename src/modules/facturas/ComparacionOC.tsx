import { Alert } from '@/components/ui'
import { totalOC } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money, moneySigned } from '@/lib/format'
import type { FacturaProveedor, OrdenCompra } from '@/types'

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9/"]+/g, ' ')
    .trim()

function emparejar(f: FacturaProveedor, oc: OrdenCompra) {
  const usadas = new Set<string>()
  const filas = f.lineas.map((lf) => {
    const n = normal(lf.descripcion)
    const lo = oc.lineas.find((l) => !usadas.has(l.id) && (normal(l.descripcion) === n || normal(l.descripcion).includes(n) || n.includes(normal(l.descripcion))))
    if (lo) usadas.add(lo.id)
    return { descripcion: lf.descripcion, cantOC: lo?.cantidad ?? null, cantF: lf.cantidad, precioOC: lo?.precioUnitario ?? null, precioF: lf.precioUnitario }
  })
  for (const lo of oc.lineas.filter((l) => !usadas.has(l.id))) filas.push({ descripcion: lo.descripcion, cantOC: lo.cantidad, cantF: 0, precioOC: lo.precioUnitario, precioF: 0 })
  return filas
}

/** Compara una factura de proveedor contra su OC y resalta las diferencias. */
export function ComparacionOC({ factura, oc }: { factura: FacturaProveedor; oc: OrdenCompra }) {
  const totalOrden = totalOC(oc)
  const difTotal = factura.subtotal - totalOrden

  return (
    <div className="space-y-3">
      {Math.abs(difTotal) < 1 ? (
        <Alert tone="ok" title="El subtotal de la factura coincide con la OC">
          {money(factura.subtotal)} facturado frente a {money(totalOrden)} en la OC {oc.consecutivo}.
        </Alert>
      ) : (
        <Alert tone="warn" title={`Diferencia de ${moneySigned(difTotal)} contra la OC ${oc.consecutivo}`}>
          Subtotal facturado {money(factura.subtotal)} frente a {money(totalOrden)} ordenado.
        </Alert>
      )}

      {factura.lineas.length === 0 ? (
        <p className="text-[13px] text-slate-500">La factura no tiene detalle de ítems registrado; se compara solo el subtotal.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Ítem</th>
                <th className="px-2 py-2 text-right">Cant. OC</th>
                <th className="px-2 py-2 text-right">Cant. factura</th>
                <th className="px-2 py-2 text-right">Precio OC</th>
                <th className="px-2 py-2 text-right">Precio factura</th>
                <th className="px-3 py-2 text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emparejar(factura, oc).map((f, i) => {
                const cantMal = f.cantOC === null || f.cantOC !== f.cantF
                const precioMal = f.precioOC === null || Math.abs(f.precioOC - f.precioF) > 0.5
                const dif = f.cantF * f.precioF - (f.cantOC ?? 0) * (f.precioOC ?? 0)
                const marca = 'bg-amber-50 font-semibold text-amber-900'
                return (
                  <tr key={i} className={cn(Math.abs(dif) > 0.5 && 'bg-amber-50/30')}>
                    <td className="px-3 py-2 text-slate-900">
                      {f.descripcion}
                      {f.cantOC === null && <span className="ml-2 text-xs text-red-700">No está en la OC</span>}
                      {f.cantF === 0 && <span className="ml-2 text-xs text-amber-700">No facturado</span>}
                    </td>
                    <td className="num px-2 py-2 text-right">{f.cantOC?.toLocaleString('es-CO') ?? '—'}</td>
                    <td className={cn('num px-2 py-2 text-right', cantMal && marca)}>{f.cantF.toLocaleString('es-CO')}</td>
                    <td className="num px-2 py-2 text-right">{f.precioOC === null ? '—' : money(f.precioOC)}</td>
                    <td className={cn('num px-2 py-2 text-right', precioMal && marca)}>{money(f.precioF)}</td>
                    <td className={cn('num px-3 py-2 text-right font-medium', dif > 0.5 ? 'text-red-700' : dif < -0.5 ? 'text-emerald-700' : 'text-slate-500')}>
                      {Math.abs(dif) <= 0.5 ? '—' : moneySigned(dif)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
