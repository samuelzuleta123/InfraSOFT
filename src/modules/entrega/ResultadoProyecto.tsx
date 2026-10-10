import { TrendingDown, TrendingUp } from 'lucide-react'
import { liquidacion, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { diasEntre, fecha, money, moneySigned, num, pct } from '@/lib/format'
import type { Proyecto } from '@/types'

/**
 * El momento del cierre: cuánto ganó la empresa y por qué difiere de lo cotizado.
 * Se muestra al cerrar el proyecto y queda encabezando la pestaña Cierre.
 */
export function ResultadoProyecto({ proyecto, compacto }: { proyecto: Proyecto; compacto?: boolean }) {
  const l = liquidacion(versionVigente(proyecto))
  const dif = l.utilidadRealObra - l.utilidadEstimada
  const ganancia = l.utilidadRealObra >= 0
  const fc = proyecto.facturaCliente
  const dias = fc ? diasEntre(proyecto.creado, fc.fecha) : null

  // Las desviaciones que más movieron el resultado, en pesos.
  const causas = l.filas
    .filter((f) => f.diferencia !== 0)
    .map((f) => ({ f, impacto: f.diferencia * (f.item.vuMO + f.item.vuMaterial) }))
    .sort((a, b) => Math.abs(b.impacto) - Math.abs(a.impacto))
    .slice(0, 3)

  // Escala compartida para comparar cotizado y real en la misma barra.
  const escala = Math.max(l.utilidadEstimada, l.utilidadRealObra, 1)

  return (
    <section aria-label="Resultado del proyecto" className={cn('overflow-hidden rounded-lg border border-brand-200 bg-white shadow-xs', !compacto && 'animate-[rise_320ms_cubic-bezier(0.16,1,0.3,1)]')}>
      <div className="grid gap-6 bg-brand-50/60 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-[13px] font-medium text-brand-900">{ganancia ? 'El proyecto dejó una utilidad real de' : 'El proyecto dejó una pérdida real de'}</p>
          <p className={cn('num mt-1 text-4xl font-semibold tracking-tight', ganancia ? 'text-slate-900' : 'text-red-700')}>{money(Math.abs(l.utilidadRealObra))}</p>
          <p className="mt-1.5 text-sm text-slate-600">
            {pct(l.margenRealObra)} del valor cotizado
            {fc && (
              <>
                {' '}
                · cerrado el {fecha(fc.fecha)}
                {dias !== null && dias > 0 && <> en {dias} días</>}
              </>
            )}
          </p>
        </div>

        <div className="space-y-3 self-center">
          {[
            { label: 'Utilidad cotizada', valor: l.utilidadEstimada, clase: 'bg-slate-300' },
            { label: 'Utilidad real', valor: l.utilidadRealObra, clase: ganancia ? 'bg-brand-600' : 'bg-red-600' },
          ].map((b) => (
            <div key={b.label}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-slate-600">{b.label}</span>
                <span className="num font-medium text-slate-900">{money(b.valor)}</span>
              </div>
              <div className="mt-1 h-2.5 rounded-sm bg-white" aria-hidden>
                <div className={cn('h-full rounded-r-[4px]', b.clase)} style={{ width: `${(Math.max(0, b.valor) / escala) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className={cn('flex items-center gap-1.5 text-[13px] font-medium', dif < 0 ? 'text-red-700' : 'text-brand-800')}>
            {dif < 0 ? <TrendingDown className="size-4" aria-hidden /> : <TrendingUp className="size-4" aria-hidden />}
            {Math.abs(dif) < 1 ? 'Igual a lo cotizado' : `${moneySigned(dif)} frente a lo cotizado`}
          </p>
        </div>
      </div>

      {!compacto && causas.length > 0 && (
        <div className="border-t border-brand-100 px-5 py-4 sm:px-6">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Qué movió el resultado</h3>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-3">
            {causas.map(({ f, impacto }) => (
              <li key={f.item.id} className="min-w-0">
                <span className="block truncate text-slate-800" title={f.item.descripcion}>
                  {f.item.descripcion}
                </span>
                <span className="num text-slate-500">
                  {f.diferencia > 0 ? '+' : ''}
                  {num(f.diferencia, 2)} {f.item.unidad} instalados ·{' '}
                  <span className={cn('font-medium', impacto > 0 ? 'text-red-700' : 'text-brand-800')}>{moneySigned(-impacto)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
