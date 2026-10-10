import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Boxes, CheckCircle2, ChevronsLeft, ChevronsRight, FolderKanban, Info, LayoutDashboard, Menu, ReceiptText, Search, X, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { buscarProyectos } from '@/lib/buscar'
import { cn } from '@/lib/cn'
import { EtapaBadge } from '@/components/dominio'

const nav = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/facturas', label: 'Facturas de proveedores', icon: ReceiptText },
  { to: '/catalogo', label: 'Catálogo y proveedores', icon: Boxes },
]

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
          <path d="M8 7h4v18H8zM15 7h9v4.5h-4.5v2.5H23v4.5h-3.5V25H15z" fill="currentColor" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-wide">INFRASOFT</div>
          <div className="text-[11px] text-brand-200">Services S.A.S.</div>
        </div>
      )}
    </div>
  )
}

function Sidebar({ onNavigate, compacta, onToggle }: { onNavigate?: () => void; compacta?: boolean; onToggle?: () => void }) {
  const sinAsignar = useStore((s) => s.facturas.filter((f) => !f.proyectoId).length)
  return (
    <nav className="flex h-full flex-col bg-brand-950 text-white" aria-label="Navegación principal">
      <div className={cn('flex h-16 items-center', compacta ? 'justify-center' : 'px-5')}>
        <Logo compact={compacta} />
      </div>
      <ul className={cn('flex-1 space-y-0.5 py-3', compacta ? 'px-2' : 'px-3')}>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              title={compacta ? label : undefined}
              aria-label={compacta ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                  compacta ? 'justify-center px-2' : 'px-3',
                  isActive ? 'bg-white/12 text-white' : 'text-brand-100/80 hover:bg-white/6 hover:text-white',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!compacta && <span className="flex-1">{label}</span>}
              {to === '/facturas' && sinAsignar > 0 && (
                <span
                  className={cn('num rounded-full bg-amber-400 font-semibold text-amber-950', compacta ? 'absolute top-0.5 right-1 px-1 text-[10px]' : 'px-1.5 text-[11px]')}
                  title="Facturas sin asignar"
                >
                  {sinAsignar}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      {onToggle && (
        <button
          onClick={onToggle}
          className={cn('mx-3 mb-2 flex items-center gap-2 rounded-md py-2 text-xs text-brand-200 hover:bg-white/6 hover:text-white', compacta ? 'justify-center px-2 mx-2' : 'px-3')}
          aria-label={compacta ? 'Expandir menú' : 'Contraer menú'}
        >
          {compacta ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!compacta && 'Contraer menú'}
        </button>
      )}
      {!compacta && (
        <div className="border-t border-white/10 px-5 py-4 text-xs text-brand-200/80">
          <div className="font-medium text-brand-100">Pereira, Risaralda</div>
          <div>Mockup de demostración · datos en memoria</div>
        </div>
      )}
    </nav>
  )
}

function BuscadorGlobal() {
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { proyectos, clientes, ordenes, facturas } = useStore()
  const resultados = useMemo(() => (q.trim() ? buscarProyectos(q, proyectos, clientes, ordenes, facturas).slice(0, 6) : []), [q, proyectos, clientes, ordenes, facturas])
  const facturasSueltas = useMemo(
    () => (q.trim().length > 1 ? facturas.filter((f) => !f.proyectoId && f.numero.toLowerCase().includes(q.trim().toLowerCase())) : []),
    [q, facturas],
  )

  useEffect(() => {
    const fuera = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const ir = (url: string) => {
    nav(url)
    setAbierto(false)
    setQ('')
  }

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && resultados[0]) ir(`/proyectos/${resultados[0].proyecto.id}/${resultados[0].tab ?? 'cotizacion'}`)
          if (e.key === 'Escape') setAbierto(false)
        }}
        placeholder="Buscar proyecto, cliente, cotización, OC o factura…"
        aria-label="Buscar en todo el sistema"
        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      />
      {abierto && q.trim() && (
        <div className="absolute top-11 right-0 left-0 z-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {resultados.length === 0 && facturasSueltas.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados para “{q}”.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {resultados.map((r) => (
                <li key={r.proyecto.id}>
                  <button onClick={() => ir(`/proyectos/${r.proyecto.id}/${r.tab ?? 'cotizacion'}`)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <FolderKanban className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{r.proyecto.nombre}</span>
                      <span className="block text-xs text-slate-500">
                        {r.proyecto.codigo}
                        {r.coincidencia && <> · Coincide: <span className="font-medium text-brand-800">{r.coincidencia}</span></>}
                      </span>
                    </span>
                    <EtapaBadge etapa={r.proyecto.etapa} cerrado={!!r.proyecto.facturaCliente} />
                  </button>
                </li>
              ))}
              {facturasSueltas.map((f) => (
                <li key={f.id}>
                  <button onClick={() => ir(`/facturas?f=${f.id}`)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <ReceiptText className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">Factura {f.numero}</span>
                      <span className="block text-xs text-amber-700">Sin asignar a proyecto</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => {
        const Icono = t.tono === 'ok' ? CheckCircle2 : t.tono === 'error' ? XCircle : Info
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-2.5 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-[rise_200ms_ease-out]">
            <Icono className={cn('mt-0.5 size-4 shrink-0', t.tono === 'ok' ? 'text-emerald-400' : t.tono === 'error' ? 'text-red-400' : 'text-sky-300')} aria-hidden />
            <span>{t.texto}</span>
          </div>
        )
      })}
    </div>
  )
}

export function AppLayout() {
  const [menu, setMenu] = useState(false)
  const compacta = useStore((s) => s.sidebarCompacta)
  const setCompacta = useStore((s) => s.setSidebarCompacta)
  const loc = useLocation()
  useEffect(() => {
    setMenu(false)
    document.getElementById('contenido')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [loc.pathname])

  return (
    <div className={cn('min-h-dvh transition-[padding] duration-200', compacta ? 'lg:pl-16' : 'lg:pl-64')}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block no-print', compacta ? 'w-16' : 'w-64')}>
        <Sidebar compacta={compacta} onToggle={() => setCompacta(!compacta)} />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMenu(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-[fade_150ms_ease-out]">
            <Sidebar onNavigate={() => setMenu(false)} />
            <button onClick={() => setMenu(false)} aria-label="Cerrar menú" className="absolute top-4 right-3 rounded-md p-1.5 text-white/80 hover:bg-white/10">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 no-print">
        <button onClick={() => setMenu(true)} aria-label="Abrir menú" className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
          <Menu className="size-5" />
        </button>
        <Link to="/" className="mr-1 rounded-md bg-brand-950 p-1 text-white sm:hidden" aria-label="Inicio">
          <Logo compact />
        </Link>
        <BuscadorGlobal />
        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium text-slate-900">Gerencia de proyectos</div>
            <div className="text-xs text-slate-500">Infrasoft Services S.A.S.</div>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800" aria-hidden>
            GP
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className={cn('mx-auto max-w-[1600px] px-4 py-6 outline-none sm:px-6', compacta ? 'lg:px-5' : 'lg:px-8')}>
        <Outlet />
      </main>
      <Toasts />
    </div>
  )
}
