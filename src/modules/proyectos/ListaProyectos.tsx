import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, FolderSearch, Search } from 'lucide-react'
import { Card, EmptyState, td, th } from '@/components/ui'
import { ETAPAS, EtapaBadge, EstadoCotBadge, FechaTexto } from '@/components/dominio'
import type { Etapa } from '@/types'
import { buscarProyectos } from '@/lib/buscar'
import { resumen, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'

/** Último filtro usado en el listado, para que "← Proyectos" en el detalle vuelva a él. */
export let ultimaBusqueda = ''

/** Lista de proyectos con buscador. Encuentra por nombre, cliente o cualquier número de documento. */
/** `limite`: versión resumida para el Inicio, sin buscador ni filtros (el buscador global ya cubre esa necesidad). */
export function ListaProyectos({ titulo = 'Proyectos', limite }: { titulo?: string; limite?: number }) {
  const proyectos = useStore((s) => s.proyectos)
  const clientes = useStore((s) => s.clientes)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  // Búsqueda y etapa viven en la URL (?q=&etapa=) para que sobrevivan al entrar a un proyecto y volver.
  // El Inicio (`limite`) no tiene filtros, así que no toca la URL.
  const [params, setParams] = useSearchParams()
  const q = limite ? '' : (params.get('q') ?? '')
  const etapaParam = Number(params.get('etapa'))
  const etapa: Etapa | 'todas' = !limite && ETAPAS.some((e) => e.n === etapaParam) ? (etapaParam as Etapa) : 'todas'
  const cambiar = (clave: 'q' | 'etapa', valor: string) =>
    setParams(
      (prev) => {
        const sig = new URLSearchParams(prev)
        if (valor) sig.set(clave, valor)
        else sig.delete(clave)
        return sig
      },
      { replace: true },
    )
  const setQ = (v: string) => cambiar('q', v)
  const setEtapa = (e: Etapa | 'todas') => cambiar('etapa', e === 'todas' ? '' : String(e))
  useEffect(() => {
    if (!limite) ultimaBusqueda = params.toString() ? `?${params}` : ''
  }, [limite, params])
  const nav = useNavigate()
  const encontrados = useMemo(
    () => buscarProyectos(q, proyectos, clientes, ordenes, facturas).sort((a, b) => b.proyecto.creado.localeCompare(a.proyecto.creado)),
    [q, proyectos, clientes, ordenes, facturas],
  )
  const filtrados = etapa === 'todas' ? encontrados : encontrados.filter((r) => r.proyecto.etapa === etapa)
  const resultados = limite ? filtrados.slice(0, limite) : filtrados

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900">{titulo}</h2>
        {limite ? (
          <Link to="/proyectos" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-800 hover:underline">
            Ver los {proyectos.length} proyectos <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : (
        <div className="relative w-full sm:w-96">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, cliente, N.° de cotización, OC o factura"
            aria-label="Buscar proyectos"
            className="h-9 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm placeholder:text-slate-500 focus:border-brand-700 focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
          />
        </div>
        )}
      </div>
      <div className={cn('flex gap-1.5 overflow-x-auto border-b border-slate-200 px-5 py-2.5', !!limite && 'hidden')} role="radiogroup" aria-label="Filtrar por etapa">
        {(['todas', ...ETAPAS.map((e) => e.n)] as const).map((e) => {
          const activo = etapa === e
          const total = e === 'todas' ? encontrados.length : encontrados.filter((r) => r.proyecto.etapa === e).length
          return (
            <button
              key={e}
              role="radio"
              aria-checked={activo}
              onClick={() => setEtapa(e)}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
                activo ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {e === 'todas' ? 'Todas' : ETAPAS[e - 1].nombre}
              <span className={cn('num', activo ? 'text-brand-100' : 'text-slate-500')}>{total}</span>
            </button>
          )
        })}
      </div>
      {resultados.length === 0 ? (
        <EmptyState icon={<FolderSearch />} title="Ningún proyecto coincide" description={q ? `No encontramos “${q}” en nombres, clientes ni números de documento.` : "No hay proyectos en esta etapa."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                <th className={th}>Proyecto</th>
                <th className={th}>Cliente</th>
                <th className={th}>Etapa</th>
                <th className={th}>Cotización</th>
                <th className={cn(th, 'text-right')}>Valor</th>
                <th className={th}>Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultados.map(({ proyecto: p, coincidencia, tab }) => {
                const v = versionVigente(p)
                const cliente = clientes.find((c) => c.id === p.clienteId)
                return (
                  <tr
                    key={p.id}
                    onClick={() => nav(`/proyectos/${p.id}/${tab ?? 'levantamiento'}`)}
                    className="cursor-pointer transition-colors hover:bg-brand-50/40"
                  >
                    <td className={td}>
                      <a
                        href={`/proyectos/${p.id}/${tab ?? 'levantamiento'}`}
                        onClick={(e) => e.preventDefault()}
                        className="font-medium text-slate-900 hover:text-brand-800"
                      >
                        {p.nombre}
                      </a>
                      <div className="text-xs text-slate-500">
                        {p.codigo}
                        {coincidencia && (
                          <>
                            {' '}
                            · <mark className="rounded bg-amber-100 px-1 text-amber-900">{coincidencia}</mark>
                          </>
                        )}
                      </div>
                    </td>
                    <td className={cn(td, 'text-slate-600')}>{cliente?.nombre}</td>
                    <td className={td}>
                      <EtapaBadge etapa={p.etapa} cerrado={!!p.facturaCliente} />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs whitespace-nowrap text-slate-600">
                          {p.cotizacion.consecutivo} {v.nombre}
                        </span>
                        <EstadoCotBadge estado={v.estado} />
                      </div>
                    </td>
                    <td className={cn(td, 'num text-right font-medium text-slate-900')}>{money(resumen(v).precioVigente)}</td>
                    <td className={cn(td, 'text-slate-600')}>
                      <FechaTexto iso={p.creado} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
