import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type KeyboardEvent as KeyboardEventReact, type ReactNode, type SelectHTMLAttributes } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { numeroEditable, parseNumero } from '@/lib/format'
import { cn } from '@/lib/cn'
import { indiceConFlecha } from '@/lib/flechas'

// ── Botón ──────────────────────────────────────────────────────────────

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Tamano = 'sm' | 'md'

const variantes: Record<Variante, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-xs',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50 hover:border-red-300',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variante; size?: Tamano; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        variantes[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 [&>svg]:size-4',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Contenedores ───────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('min-w-0 rounded-lg border border-slate-200 bg-white shadow-xs', className)}>{children}</section>
}

export function CardHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-3.5', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">{eyebrow}</div>}
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────

export type Tono = 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'info'
const tonos: Record<Tono, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
}

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tono; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', tonos[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

// ── Alertas ────────────────────────────────────────────────────────────

const alertaEstilos = {
  info: { c: 'border-sky-200 bg-sky-50 text-sky-900', i: Info },
  warn: { c: 'border-amber-300 bg-amber-50 text-amber-900', i: AlertTriangle },
  danger: { c: 'border-red-200 bg-red-50 text-red-900', i: XCircle },
  ok: { c: 'border-emerald-200 bg-emerald-50 text-emerald-900', i: CheckCircle2 },
}

export function Alert({ tone = 'info', title, children, className, action }: { tone?: keyof typeof alertaEstilos; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  const { c, i: Icono } = alertaEstilos[tone]
  return (
    <div role={tone === 'danger' || tone === 'warn' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border px-3.5 py-3 text-sm', c, className)}>
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className={cn(!!title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 [&>svg]:size-5">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Formularios ────────────────────────────────────────────────────────

const inputBase =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-500 hover:border-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-600/25 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500'

export function Field({ label, hint, error, children, className, htmlFor, optional }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string; htmlFor?: string; optional?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-500">(opcional)</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-red-700">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'h-auto min-h-20 py-2 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20d%3D%22M5.3%207.3a1%201%200%20011.4%200L10%2010.6l3.3-3.3a1%201%200%20111.4%201.4l-4%204a1%201%200%2001-1.4%200l-4-4a1%201%200%20010-1.4z%22/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8', className)} {...props}>
      {children}
    </select>
  )
}

/**
 * Campo numérico en formato colombiano. Muestra "1.234.567" y acepta decimales con coma.
 * Vacío → null (el consumidor decide si eso vale 0).
 */
export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  className,
  inputClassName,
  allowEmpty = false,
  decimals = 2,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix'> & {
  value: number | null
  onChange: (n: number | null) => void
  prefix?: string
  suffix?: string
  inputClassName?: string
  allowEmpty?: boolean
  decimals?: number
}) {
  const [texto, setTexto] = useState(() => numeroEditable(value, decimals))
  const enfocado = useRef(false)
  useEffect(() => {
    if (!enfocado.current) setTexto(numeroEditable(value, decimals))
  }, [value, decimals])
  return (
    <div className={cn('relative', className)}>
      {prefix && <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-slate-500">{prefix}</span>}
      <input
        inputMode="decimal"
        autoComplete="off"
        className={cn(inputBase, 'num text-right', prefix && 'pl-6', suffix && 'pr-7', inputClassName)}
        value={texto}
        onFocus={(e) => {
          enfocado.current = true
          e.currentTarget.select()
        }}
        onBlur={() => {
          enfocado.current = false
          setTexto(numeroEditable(value, decimals))
        }}
        onChange={(e) => {
          const limpio = e.target.value.replace(/[^\d.,-]/g, '')
          setTexto(limpio)
          const n = parseNumero(limpio)
          onChange(n === null ? (allowEmpty ? null : 0) : n)
        }}
        {...props}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
    </div>
  )
}

export function Toggle({ checked, onChange, label, labelOff }: { checked: boolean; onChange: (v: boolean) => void; label: string; labelOff?: string }) {
  return (
    <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5 text-[13px] font-medium" role="radiogroup" aria-label="Modo de vista">
      {[false, true].map((v) => (
        <button
          key={String(v)}
          role="radio"
          aria-checked={checked === v}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-[5px] px-3 py-1 transition-colors',
            checked === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {v ? label : labelOff}
        </button>
      ))}
    </div>
  )
}

// ── Pestañas ───────────────────────────────────────────────────────────

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (t: T) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // En pantallas angostas, mantener visible la pestaña activa.
  useEffect(() => {
    const activa = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (activa && ref.current) ref.current.scrollLeft = activa.offsetLeft - ref.current.clientWidth / 2 + activa.clientWidth / 2
  }, [value])
  // Con el foco en las pestañas: ←/→ (e Inicio/Fin) cambian de pestaña, como en el patrón ARIA.
  const onKeyDown = (e: KeyboardEventReact) => {
    const i = indiceConFlecha(e.key, tabs.findIndex((t) => t.id === value), tabs.length)
    if (i === null) return
    e.preventDefault()
    onChange(tabs[i].id)
    ref.current?.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus()
  }
  return (
    <div ref={ref} role="tablist" onKeyDown={onKeyDown} className={cn('flex gap-1 overflow-x-auto border-b border-slate-200', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            value === t.id ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('num rounded-full px-1.5 text-xs', value === t.id ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────

/** Modales y paneles abiertos, del más antiguo al más reciente: Escape cierra solo el de encima. */
const capasAbiertas: symbol[] = []

function useCapaSuperpuesta(open: boolean, onClose: () => void) {
  const cerrar = useRef(onClose)
  useEffect(() => {
    cerrar.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const capa = Symbol()
    capasAbiertas.push(capa)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && capasAbiertas.at(-1) === capa && cerrar.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      capasAbiertas.splice(capasAbiertas.indexOf(capa), 1)
      if (!capasAbiertas.length) document.body.style.overflow = ''
    }
  }, [open])
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const id = useId()
  useCapaSuperpuesta(open, onClose)
  if (!open) return null
  const anchos = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/50 animate-[fade_150ms_ease-out]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby={id} className={cn('relative flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-white shadow-2xl sm:rounded-xl', anchos[size])}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={id} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-1.5 -mt-1">
            <X />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 rounded-b-xl">{footer}</footer>}
      </div>
    </div>
  )
}

// ── Datos ──────────────────────────────────────────────────────────────

export function Stat({ label, value, hint, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'danger' | 'ok' | 'warn' }) {
  return (
    <div>
      <div className="text-[13px] text-slate-500">{label}</div>
      <div className={cn('num mt-1 text-xl font-semibold text-slate-900', tone === 'danger' && 'text-red-700', tone === 'ok' && 'text-emerald-700', tone === 'warn' && 'text-amber-700')}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

export function DL({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[minmax(0,auto)_1fr] gap-x-6 gap-y-2 text-sm', className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export const th = 'px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'
export const td = 'px-3 py-2.5 align-middle'

// ── Panel lateral ──────────────────────────────────────────────────────

/** Panel que entra desde la derecha para ver o editar el detalle de una fila sin perder la lista. */
export function Drawer({ open, onClose, title, eyebrow, description, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; eyebrow?: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const id = useId()
  useCapaSuperpuesta(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/40 animate-[fade_150ms_ease-out]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl animate-[entrar_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <header className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">{eyebrow}</div>}
            <h2 id={id} className="text-lg font-semibold text-balance text-slate-900">
              {title}
            </h2>
            {description && <div className="mt-1 text-[13px] text-slate-500">{description}</div>}
          </div>
          <IconButton label="Cerrar panel" onClick={onClose} className="-mt-1 -mr-2">
            <X />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-slate-200 bg-slate-50 px-6 py-3">{footer}</footer>}
      </aside>
    </div>
  )
}
