import { AlertTriangle } from 'lucide-react'
import { NumberInput } from '@/components/ui'
import type { Resumen } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money, pct } from '@/lib/format'

/**
 * Resumen del cotizador en una barra fija inferior, igual en cualquier ancho de pantalla.
 * El desglose (costo + utilidad + ajustes) está en la tarjeta "Cómo se calcula el precio al cliente".
 */
export function ResumenBarra({ r, onPrecioFinal, vistaCliente }: { r: Resumen; onPrecioFinal: (n: number | null) => void; vistaCliente: boolean }) {
  const sugerido = Math.round(r.precioSugerido)
  const bajoCosto = r.precioFinal !== null && r.precioFinal < r.costo
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(15_23_42/0.18)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {vistaCliente ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] text-slate-600">Valor de la propuesta</span>
          <span className="num text-xl font-semibold text-slate-900">{money(r.precioVigente)}</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="hidden sm:block">
            <BarraDato label="Costo total" value={money(r.costo)} />
          </span>
          <span className="hidden sm:block">
            <BarraDato label="Precio sugerido" value={money(r.precioSugerido)} />
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="precio-final-barra" className="text-[13px] font-medium whitespace-nowrap text-brand-900">
              Precio final
            </label>
            <NumberInput
              id="precio-final-barra"
              value={r.precioFinal}
              onChange={onPrecioFinal}
              allowEmpty
              decimals={0}
              prefix="$"
              placeholder={sugerido.toLocaleString('es-CO')}
              className="w-40"
              inputClassName="font-semibold border-brand-300"
            />
            {r.precioFinal !== null && r.precioFinal !== sugerido && (
              <button type="button" onClick={() => onPrecioFinal(sugerido)} className="py-1 text-xs font-medium whitespace-nowrap text-brand-700 hover:text-brand-900 hover:underline">
                Usar sugerido
              </button>
            )}
          </div>
          <BarraDato
            label="Utilidad cotizada"
            value={
              <span className={cn(r.utilidadReal < 0 ? 'text-red-700' : 'text-emerald-700')}>
                {money(r.utilidadReal)} <span className="text-xs font-normal text-slate-500">({pct(r.margenReal)})</span>
              </span>
            }
          />
          {bajoCosto && (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-700">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              El precio final está por debajo del costo total.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function BarraDato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="leading-tight">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="num text-[15px] font-semibold text-slate-900">{value}</div>
    </div>
  )
}
