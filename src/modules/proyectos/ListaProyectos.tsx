import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderSearch, Search } from 'lucide-react'
import { Card, EmptyState, td, th } from '@/components/ui'
import { EtapaBadge, EstadoCotBadge, FechaTexto } from '@/components/dominio'
import { buscarProyectos } from '@/lib/buscar'
import { resumen, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'

/** Lista de proyectos con buscador. Encuentra por nombre, cliente o cualquier número de documento. */
export function ListaProyectos({ titulo = 'Proyectos' }: { titulo?: string }) {
  const proyectos = useStore((s) => s.proyectos)
  const clientes = useStore((s) => s.clientes)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const resultados = useMemo(() => buscarProyectos(q, proyectos, clientes, ordenes, facturas), [q, proyectos, clientes, ordenes, facturas])

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900">{titulo}</h2>
        <div className="relative w-full sm:w-96">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, cliente, N.° de cotización, OC o factura"
            aria-label="Buscar proyectos"
            className="h-9 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>
      </div>
      {resultados.length === 0 ? (
        <EmptyState icon={<FolderSearch />} title="Ningún proyecto coincide" description={`No encontramos “${q}” en nombres, clientes ni números de documento.`} />
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
                    onClick={() => nav(`/proyectos/${p.id}/${tab ?? 'cotizacion'}`)}
                    className="cursor-pointer transition-colors hover:bg-brand-50/40"
                  >
                    <td className={td}>
                      <a
                        href={`/proyectos/${p.id}/${tab ?? 'cotizacion'}`}
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
                        <span className="text-xs text-slate-600">
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
