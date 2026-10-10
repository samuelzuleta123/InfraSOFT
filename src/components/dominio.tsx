// Componentes de dominio reutilizables entre módulos.
import { useRef, type ReactNode } from 'react'
import { Check, FileCode2, FileText, Image as ImageIcon, Paperclip, Upload, X } from 'lucide-react'
import { Badge, type Tono } from '@/components/ui'
import { cn } from '@/lib/cn'
import { fecha } from '@/lib/format'
import type { Semaforo } from '@/lib/calc'
import type { Adjunto, EstadoCotizacion, Etapa, FotoObra } from '@/types'

export const ETAPAS: { n: Etapa; nombre: string; corto: string }[] = [
  { n: 1, nombre: 'Cotización', corto: 'Cotización' },
  { n: 2, nombre: 'Aprobación y compras', corto: 'Compras' },
  { n: 3, nombre: 'Ejecución', corto: 'Ejecución' },
  { n: 4, nombre: 'Entrega', corto: 'Entrega' },
  { n: 5, nombre: 'Cierre', corto: 'Cierre' },
]

export const nombreEtapa = (e: Etapa) => ETAPAS[e - 1].nombre

const tonoEtapa: Record<Etapa, Tono> = { 1: 'info', 2: 'brand', 3: 'warn', 4: 'brand', 5: 'ok' }
export function EtapaBadge({ etapa, cerrado }: { etapa: Etapa; cerrado?: boolean }) {
  return (
    <Badge tone={tonoEtapa[etapa]} dot>
      {etapa === 5 && cerrado ? 'Cerrado' : nombreEtapa(etapa)}
    </Badge>
  )
}

const estadoCot: Record<EstadoCotizacion, { l: string; t: Tono }> = {
  borrador: { l: 'Borrador', t: 'neutral' },
  enviada: { l: 'Enviada', t: 'info' },
  aprobada: { l: 'Aprobada', t: 'ok' },
  rechazada: { l: 'Rechazada', t: 'danger' },
}
export const nombreEstadoCot = (e: EstadoCotizacion) => estadoCot[e].l
export function EstadoCotBadge({ estado }: { estado: EstadoCotizacion }) {
  return (
    <Badge tone={estadoCot[estado].t} dot>
      {estadoCot[estado].l}
    </Badge>
  )
}

/** Stepper de las 5 etapas del proyecto. */
export function StepperEtapas({ etapa, onSelect }: { etapa: Etapa; onSelect?: (e: Etapa) => void }) {
  return (
    <ol className="flex w-full items-center" aria-label="Etapas del proyecto">
      {ETAPAS.map((e, idx) => {
        const hecho = e.n < etapa || etapa === 5
        const actual = e.n === etapa
        return (
          <li key={e.n} className={cn('flex items-center', idx < ETAPAS.length - 1 && 'flex-1')}>
            <button
              type="button"
              onClick={() => onSelect?.(e.n)}
              disabled={!onSelect}
              aria-current={actual ? 'step' : undefined}
              className="group flex items-center gap-2.5 rounded-md py-1 pr-2 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'num flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 transition-colors',
                  hecho && !actual && 'bg-brand-800 text-white ring-brand-800',
                  actual && (etapa === 5 ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-brand-800 ring-brand-700'),
                  !hecho && !actual && 'bg-white text-slate-400 ring-slate-300',
                )}
              >
                {hecho && !actual ? <Check className="size-3.5" strokeWidth={3} /> : actual && etapa === 5 ? <Check className="size-3.5" strokeWidth={3} /> : e.n}
              </span>
              <span className="hidden min-w-0 md:block">
                <span className={cn('block text-[11px] font-medium tracking-wide uppercase', actual ? 'text-brand-700' : 'text-slate-400')}>Etapa {e.n}</span>
                <span className={cn('block text-[13px] font-medium whitespace-nowrap', actual || hecho ? 'text-slate-900' : 'text-slate-500', 'group-enabled:group-hover:text-brand-800')}>{e.nombre}</span>
              </span>
            </button>
            {idx < ETAPAS.length - 1 && <span className={cn('mx-2 h-0.5 flex-1 rounded-full', e.n < etapa ? 'bg-brand-800' : 'bg-slate-200')} aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

const coloresSemaforo: Record<Semaforo, { c: string; l: string }> = {
  verde: { c: 'bg-emerald-500', l: 'Dentro del presupuesto' },
  amarillo: { c: 'bg-amber-400', l: 'Hasta 10 % sobre el presupuesto' },
  rojo: { c: 'bg-red-600', l: 'Más de 10 % sobre el presupuesto' },
  gris: { c: 'bg-slate-300', l: 'Sin registro' },
}

export function SemaforoDot({ estado, conTexto, className }: { estado: Semaforo; conTexto?: boolean; className?: string }) {
  const s = coloresSemaforo[estado]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={s.l}>
      <span className={cn('size-2.5 shrink-0 rounded-full ring-2 ring-white', s.c)} aria-hidden />
      {conTexto ? <span className="text-xs text-slate-600">{s.l}</span> : <span className="sr-only">{s.l}</span>}
    </span>
  )
}

/** Placeholder de foto de obra (sin imágenes reales en el mockup). */
export function FotoPlaceholder({ foto, className, children }: { foto: Pick<FotoObra, 'titulo' | 'tono'>; className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn('relative flex aspect-[4/3] items-end overflow-hidden rounded-md', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${foto.tono} 22% 82%), hsl(${foto.tono} 18% 64%))`,
      }}
      role="img"
      aria-label={foto.titulo}
    >
      <ImageIcon className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/70" aria-hidden />
      <span className="relative w-full bg-gradient-to-t from-black/55 to-transparent px-2.5 pt-6 pb-2 text-xs font-medium text-white">{foto.titulo}</span>
      {children}
    </div>
  )
}

const iconoAdjunto = { pdf: FileText, xml: FileCode2, img: ImageIcon, otro: Paperclip }

export function AdjuntoChip({ adjunto, onRemove }: { adjunto: Adjunto; onRemove?: () => void }) {
  const Icono = iconoAdjunto[adjunto.tipo]
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pr-1.5 pl-2 text-xs text-slate-700">
      <Icono className={cn('size-3.5 shrink-0', adjunto.tipo === 'pdf' ? 'text-red-600' : adjunto.tipo === 'xml' ? 'text-emerald-700' : 'text-slate-500')} aria-hidden />
      {adjunto.url ? (
        <a href={adjunto.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
          {adjunto.nombre}
        </a>
      ) : (
        <span className="truncate">{adjunto.nombre}</span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Quitar ${adjunto.nombre}`} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export function tipoDeArchivo(nombre: string): Adjunto['tipo'] {
  const ext = nombre.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'xml') return 'xml'
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext ?? '')) return 'img'
  return 'otro'
}

/** Selector de archivo: solo guarda nombre y URL local en memoria. */
export function SubirArchivo({ onFile, accept, label = 'Adjuntar archivo', multiple, capture }: { onFile: (a: Adjunto) => void; accept?: string; label?: string; multiple?: boolean; capture?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        {...(capture ? { capture: 'environment' as const } : {})}
        onChange={(e) => {
          for (const f of Array.from(e.target.files ?? [])) onFile({ nombre: f.name, tipo: tipoDeArchivo(f.name), url: URL.createObjectURL(f) })
          e.target.value = ''
        }}
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
      >
        <Upload className="size-3.5" aria-hidden />
        {label}
      </button>
    </>
  )
}

export function FechaTexto({ iso }: { iso: string | null | undefined }) {
  return <span className="num">{fecha(iso)}</span>
}
