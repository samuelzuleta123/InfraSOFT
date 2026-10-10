import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, NumberInput } from '@/components/ui'
import type { Resumen } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money, pct } from '@/lib/format'

function Fila({ label, value, strong, muted, className }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; muted?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 py-1', className)}>
      <dt className={cn('text-[13px]', strong ? 'font-semibold text-slate-900' : muted ? 'text-slate-400' : 'text-slate-600')}>{label}</dt>
      <dd className={cn('num text-right', strong ? 'text-[15px] font-semibold text-slate-900' : muted ? 'text-[13px] text-slate-400' : 'text-[13px] text-slate-800')}>{value}</dd>
    </div>
  )
}

export function ResumenPanel({ r, onPrecioFinal, vistaCliente }: { r: Resumen; onPrecioFinal: (n: number | null) => void; vistaCliente: boolean }) {
  if (vistaCliente) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs" aria-label="Resumen para el cliente">
        <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Valor de la propuesta</div>
        <div className="num mt-2 text-3xl font-semibold text-slate-900">{money(r.precioVigente)}</div>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          Así ve el cliente la cotización: sin proveedores, costos internos ni utilidad. Los valores por ítem reparten el precio cotizado en proporción a cada ítem.
        </p>
      </aside>
    )
  }

  const bajoCosto = r.precioFinal !== null && r.precioFinal < r.costo
  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-xs [[role=dialog]_&]:border-0 [[role=dialog]_&]:shadow-none" aria-label="Resumen de la cotización">
      <div className="border-b border-slate-200 px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900">Resumen</h2>
      </div>
      <dl className="px-5 py-3">
        <Fila label="Mano de obra" value={money(r.mo)} />
        <Fila label="Materiales" value={money(r.material)} />
        <Fila label="Otros costos" value={money(r.otros)} />
        <Fila label="Costo total" value={money(r.costo)} strong className="mt-1 border-t border-slate-200 pt-2" />
      </dl>

      <dl className="border-t border-dashed border-slate-200 px-5 py-3">
        <Fila label={`Utilidad (${pct(r.utilidadPct, 1)})`} value={money(r.utilidadSugerida)} muted={r.utilidadPct === 0} />
        <Fila label={`Otros ajustes (${pct(r.ajustesPct, 1)})`} value={money(r.ajustesSugeridos)} muted={r.ajustesPct === 0} />
        <Fila label="Precio sugerido" value={money(r.precioSugerido)} strong className="mt-1" />
        <p className="text-[11px] leading-snug text-slate-400">Costo × (1 + % utilidad), más % de otros ajustes.</p>
      </dl>

      <div className="border-t border-slate-200 bg-brand-50/60 px-5 py-4">
        <label htmlFor="precio-final" className="text-xs font-semibold tracking-wide text-brand-900 uppercase">
          Precio final cotizado
        </label>
        <NumberInput
          id="precio-final"
          value={r.precioFinal}
          onChange={onPrecioFinal}
          allowEmpty
          decimals={0}
          prefix="$"
          placeholder={Math.round(r.precioSugerido).toLocaleString('es-CO')}
          className="mt-1.5"
          inputClassName="h-11 text-lg font-semibold border-brand-300"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-500">{r.precioFinal === null ? 'Vacío: se usa el precio sugerido.' : 'Editado manualmente.'}</span>
          <button type="button" onClick={() => onPrecioFinal(Math.round(r.precioSugerido))} className="font-medium text-brand-700 hover:text-brand-900 hover:underline">
            Usar sugerido
          </button>
        </div>
        {bajoCosto && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-700">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
            El precio final está por debajo del costo total.
          </p>
        )}
      </div>

      <dl className="border-t border-slate-200 px-5 py-3">
        <div className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Sobre el precio final</div>
        <Fila label={`Otros ajustes (${pct(r.ajustesPct, 1)})`} value={money(r.ajustesReales)} muted={r.ajustesPct === 0} />
        <Fila
          label="Utilidad real"
          value={<span className={cn(r.utilidadReal < 0 ? 'text-red-700' : 'text-emerald-700')}>{money(r.utilidadReal)}</span>}
          strong
        />
        <Fila label="Margen sobre el precio" value={pct(r.margenReal)} />
        <Fila label="Utilidad sobre el costo" value={pct(r.utilidadSobreCosto)} />
      </dl>
    </aside>
  )
}

/**
 * En pantallas de menos de 1360 px el panel lateral no deja espacio a la tabla:
 * el resumen pasa a una barra fija inferior con lo esencial y el detalle en un diálogo.
 */
export function ResumenBarra({ r, onPrecioFinal, vistaCliente }: { r: Resumen; onPrecioFinal: (n: number | null) => void; vistaCliente: boolean }) {
  const [detalle, setDetalle] = useState(false)
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(15_23_42/0.18)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-5 lg:px-5 min-[1360px]:hidden">
      {vistaCliente ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] text-slate-600">Valor de la propuesta</span>
          <span className="num text-xl font-semibold text-slate-900">{money(r.precioVigente)}</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <BarraDato label="Costo total" value={money(r.costo)} />
          <BarraDato label="Precio sugerido" value={money(r.precioSugerido)} />
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
              placeholder={Math.round(r.precioSugerido).toLocaleString('es-CO')}
              className="w-40"
              inputClassName="font-semibold border-brand-300"
            />
          </div>
          <BarraDato
            label="Utilidad real"
            value={
              <span className={cn(r.utilidadReal < 0 ? 'text-red-700' : 'text-emerald-700')}>
                {money(r.utilidadReal)} <span className="text-xs font-normal text-slate-500">({pct(r.margenReal)})</span>
              </span>
            }
          />
          <button type="button" onClick={() => setDetalle(true)} className="ml-auto text-[13px] font-medium text-brand-700 hover:text-brand-900 hover:underline">
            Ver detalle
          </button>
        </div>
      )}
      <Modal open={detalle} onClose={() => setDetalle(false)} size="sm" title="Resumen de la cotización">
        <div className="-mx-5 -my-4">
          <ResumenPanel r={r} onPrecioFinal={onPrecioFinal} vistaCliente={false} />
        </div>
      </Modal>
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
