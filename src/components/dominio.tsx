// Componentes de dominio reutilizables entre módulos.
import { useRef, type ReactNode } from 'react'
import { Check, FileCode2, FileText, Image as ImageIcon, Paperclip, Upload, X } from 'lucide-react'
import { Badge, type Tono } from '@/components/ui'
import { cn } from '@/lib/cn'
import { fecha } from '@/lib/format'
import type { Semaforo } from '@/lib/calc'
import type { Adjunto, ContextoDoc, EstadoCotizacion, Etapa, FotoObra } from '@/types'
import { useStore } from '@/store/useStore'

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
/** Cada etapa se marca con chulo al superarla; la de cierre solo cuando el proyecto queda cerrado (factura registrada). */
export function StepperEtapas({ etapa, cerrado = false, onSelect }: { etapa: Etapa; cerrado?: boolean; onSelect?: (e: Etapa) => void }) {
  return (
    <ol className="flex w-full items-center" aria-label="Etapas del proyecto">
      {ETAPAS.map((e, idx) => {
        const hecho = e.n < etapa || cerrado
        const actual = e.n === etapa && !cerrado
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
                  actual && 'bg-white text-brand-800 ring-brand-700',
                  !hecho && !actual && 'bg-white text-slate-500 ring-slate-300',
                )}
              >
                {hecho && !actual ? <Check className="size-3.5" strokeWidth={3} /> : e.n}
              </span>
              <span className="hidden min-w-0 md:block">
                <span className={cn('block text-xs font-medium tracking-wide uppercase', actual ? 'text-brand-700' : 'text-slate-500')}>Etapa {e.n}</span>
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

const coloresSemaforo: Record<Semaforo, { c: string; l: string; corto: string; texto: string }> = {
  verde: { c: 'bg-emerald-500', l: 'Dentro del presupuesto', corto: 'En presupuesto', texto: 'text-emerald-800' },
  amarillo: { c: 'bg-amber-400', l: 'Hasta 10 % sobre el presupuesto', corto: 'Alerta', texto: 'text-amber-800' },
  rojo: { c: 'bg-red-600', l: 'Más de 10 % sobre el presupuesto', corto: 'Sobrecosto', texto: 'text-red-700' },
  gris: { c: 'bg-slate-300', l: 'Sin registro', corto: 'Sin registro', texto: 'text-slate-500' },
}

/** Estado del semáforo con punto y texto corto, para que no dependa solo del color. */
export function SemaforoEtiqueta({ estado }: { estado: Semaforo }) {
  const s = coloresSemaforo[estado]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', s.texto)} title={s.l}>
      <span className={cn('size-2 rounded-full', s.c)} aria-hidden />
      {s.corto}
    </span>
  )
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

/** Foto de obra: la imagen si existe, si no un placeholder con el tono. */
export function FotoPlaceholder({ foto, className, children }: { foto: Pick<FotoObra, 'titulo' | 'tono' | 'url'>; className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn('relative flex aspect-[4/3] items-end overflow-hidden rounded-md', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${foto.tono} 22% 82%), hsl(${foto.tono} 18% 64%))`,
      }}
      role="img"
      aria-label={foto.titulo}
    >
      {foto.url ? (
        <img src={foto.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <ImageIcon className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/70" aria-hidden />
      )}
      <span className="relative w-full bg-gradient-to-t from-black/55 to-transparent px-2.5 pt-6 pb-2 text-xs font-medium text-white">{foto.titulo}</span>
      {children}
    </div>
  )
}

const iconoAdjunto = { pdf: FileText, xml: FileCode2, img: ImageIcon, otro: Paperclip }

/** Archivo adjunto. Al hacer clic se abre la vista previa (no descarga). */
export function AdjuntoChip({ adjunto, onRemove, contexto, etiqueta }: { adjunto: Adjunto; onRemove?: () => void; contexto?: ContextoDoc; etiqueta?: string }) {
  const Icono = iconoAdjunto[adjunto.tipo]
  const abrirVisor = useStore((s) => s.abrirVisor)
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pr-1.5 pl-2 text-xs text-slate-700 transition-colors hover:border-slate-300 hover:bg-white">
      <Icono className={cn('size-3.5 shrink-0', adjunto.tipo === 'pdf' ? 'text-red-600' : adjunto.tipo === 'xml' ? 'text-brand-700' : 'text-slate-500')} aria-hidden />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          abrirVisor({ adjunto, contexto: contexto ?? { tipo: 'generico' } })
        }}
        className="-my-1 min-h-6 min-w-6 truncate py-1 text-left hover:underline"
        title={`Ver ${adjunto.nombre}`}
      >
        {etiqueta ?? adjunto.nombre}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Quitar ${adjunto.nombre}`} className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
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
