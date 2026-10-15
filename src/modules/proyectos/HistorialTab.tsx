import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, FileText, FolderPlus, PackageCheck, Receipt, ShoppingCart, Truck, XCircle, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { historialProyecto, type TipoEvento } from '@/lib/expediente'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'

const estilo: Record<TipoEvento, { icono: LucideIcon; c: string }> = {
  proyecto: { icono: FolderPlus, c: 'bg-slate-100 text-slate-600' },
  cotizacion: { icono: FileText, c: 'bg-sky-50 text-sky-700' },
  aprobada: { icono: CheckCircle2, c: 'bg-brand-100 text-brand-800' },
  rechazada: { icono: XCircle, c: 'bg-red-50 text-red-700' },
  cliente: { icono: ClipboardList, c: 'bg-sky-50 text-sky-700' },
  compra: { icono: ShoppingCart, c: 'bg-amber-50 text-amber-700' },
  factura: { icono: Receipt, c: 'bg-slate-100 text-slate-700' },
  obra: { icono: Truck, c: 'bg-orange-50 text-orange-700' },
  entrega: { icono: PackageCheck, c: 'bg-teal-50 text-teal-700' },
  cierre: { icono: Receipt, c: 'bg-brand-800 text-white' },
}

/** Línea de tiempo del proyecto: cada evento enlaza a su documento. */
export function HistorialTab({ proyecto }: { proyecto: Proyecto }) {
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const proveedores = useStore((s) => s.proveedores)
  const abrir = useStore((s) => s.abrirVisor)
  const nav = useNavigate()
  const eventos = historialProyecto(proyecto, ordenes, facturas, proveedores)

  return (
    <Card className="mx-auto max-w-4xl">
      <header className="border-b border-slate-200 px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900">Historial del proyecto</h2>
        <p className="mt-0.5 text-[13px] text-slate-500">{eventos.length} eventos, del más antiguo al más reciente. Haz clic en un documento para verlo.</p>
      </header>
      <ol className="px-5 py-5">
        {eventos.map((e, i) => {
          const { icono: Icono, c } = estilo[e.tipo]
          const ultimo = i === eventos.length - 1
          return (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {!ultimo && <span className="absolute top-9 bottom-0 left-[17px] w-px bg-slate-200" aria-hidden />}
              <span className={cn('relative flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white', c)}>
                <Icono className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <h3 className="text-sm font-medium text-slate-900">{e.titulo}</h3>
                  <span className="num shrink-0 text-xs text-slate-500">
                    <FechaTexto iso={e.fecha} />
                  </span>
                </div>
                {(e.detalle || e.valor !== undefined) && (
                  <p className="mt-0.5 text-[13px] text-slate-600">
                    {e.detalle}
                    {e.detalle && e.valor !== undefined && ' · '}
                    {e.valor !== undefined && <span className="num font-medium text-slate-800">{money(e.valor)}</span>}
                  </p>
                )}
                {e.doc && (
                  <button
                    type="button"
                    onClick={() => (e.doc!.ruta ? nav(e.doc!.ruta) : e.doc!.adjunto && abrir({ adjunto: e.doc!.adjunto, contexto: e.doc!.contexto ?? { tipo: 'generico' } }))}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    {e.doc.ruta ? 'Abrir' : 'Ver'} {e.doc.tipo.toLowerCase()} · {e.doc.numero}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
