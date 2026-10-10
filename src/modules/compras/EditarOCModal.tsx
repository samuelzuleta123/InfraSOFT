import { Button, Field, Modal, NumberInput, Select } from '@/components/ui'
import { totalCotizadoOC, totalLineaOC, totalOC } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money, moneySigned } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { OrdenCompra } from '@/types'

/** Edición en vivo de una OC: proveedor, cantidades y precios. Las diferencias contra lo cotizado se resaltan. */
export function EditarOCModal({ ocId, onClose }: { ocId: string; onClose: () => void }) {
  const oc = useStore((s) => s.ordenes.find((o) => o.id === ocId))
  const proveedores = useStore((s) => s.proveedores)
  const mutar = useStore((s) => s.mutar)
  if (!oc) return null

  const editar = (fn: (o: OrdenCompra) => void) =>
    mutar((s) => {
      const o = s.ordenes.find((x) => x.id === ocId)
      if (o) fn(o)
    })

  const total = totalOC(oc)
  const cotizado = totalCotizadoOC(oc)
  const dif = total - cotizado

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Editar OC ${oc.consecutivo}`}
      description="Las celdas resaltadas difieren de lo cotizado. Los cambios se guardan automáticamente."
      footer={
        <Button variant="primary" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <Field label="Proveedor" htmlFor="oc-prov" className="max-w-sm" hint={oc.proveedorId !== oc.proveedorOriginalId ? `Cotizado con ${proveedores.find((p) => p.id === oc.proveedorOriginalId)?.nombre}` : undefined}>
        <Select
          id="oc-prov"
          value={oc.proveedorId}
          onChange={(e) => editar((o) => void (o.proveedorId = e.target.value))}
          className={cn(oc.proveedorId !== oc.proveedorOriginalId && 'border-amber-400 bg-amber-50')}
        >
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="w-28 px-2 py-2 text-right">Cantidad</th>
              <th className="w-36 px-2 py-2 text-right">Precio unitario</th>
              <th className="w-32 px-3 py-2 text-right">Total</th>
              <th className="w-32 px-3 py-2 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {oc.lineas.map((l, i) => {
              const cantDif = l.cantidadCotizada !== null && l.cantidad !== l.cantidadCotizada
              const precioDif = l.precioCotizado !== null && l.precioUnitario !== l.precioCotizado
              const d = totalLineaOC(l) - (l.cantidadCotizada ?? 0) * (l.precioCotizado ?? 0)
              return (
                <tr key={l.id}>
                  <td className="px-3 py-2 text-slate-900">
                    {l.descripcion} <span className="text-slate-400">({l.unidad})</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberInput
                      value={l.cantidad}
                      onChange={(n) => editar((o) => void (o.lineas[i].cantidad = n ?? 0))}
                      aria-label={`Cantidad ${l.descripcion}`}
                      inputClassName={cn('h-8', cantDif && 'border-amber-400 bg-amber-50')}
                    />
                    {cantDif && <div className="num mt-0.5 text-right text-[11px] text-amber-700">Cotizado: {l.cantidadCotizada?.toLocaleString('es-CO')}</div>}
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberInput
                      value={l.precioUnitario}
                      prefix="$"
                      onChange={(n) => editar((o) => void (o.lineas[i].precioUnitario = n ?? 0))}
                      aria-label={`Precio ${l.descripcion}`}
                      inputClassName={cn('h-8', precioDif && 'border-amber-400 bg-amber-50')}
                    />
                    {precioDif && <div className="num mt-0.5 text-right text-[11px] text-amber-700">Cotizado: {money(l.precioCotizado)}</div>}
                  </td>
                  <td className="num px-3 py-2 text-right font-medium text-slate-900">{money(totalLineaOC(l))}</td>
                  <td className={cn('num px-3 py-2 text-right font-medium', d > 0 ? 'text-red-700' : d < 0 ? 'text-emerald-700' : 'text-slate-300')}>{d === 0 ? '—' : moneySigned(d)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50 font-medium">
            <tr>
              <td colSpan={3} className="px-3 py-2 text-right text-slate-500">
                Total OC · cotizado {money(cotizado)}
              </td>
              <td className="num px-3 py-2 text-right text-slate-900">{money(total)}</td>
              <td className={cn('num px-3 py-2 text-right', dif > 0 ? 'text-red-700' : dif < 0 ? 'text-emerald-700' : 'text-slate-400')}>{dif === 0 ? '—' : moneySigned(dif)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>
  )
}
