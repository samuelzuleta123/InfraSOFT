import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, PageHeader, Select, Toggle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { money, moneySigned, pct } from '@/lib/format'
import { filasRentabilidad, totalizar, type FilaRentabilidad } from '@/lib/rentabilidad'
import { useStore } from '@/store/useStore'

type Estado = 'todos' | 'cerrados' | 'curso'

/** Tablero de rentabilidad: utilidad real por proyecto y por cliente, con filtro de período. */
export function RentabilidadPage() {
  const proyectos = useStore((s) => s.proyectos)
  const clientes = useStore((s) => s.clientes)
  const [anio, setAnio] = useState('todos')
  const [estado, setEstado] = useState<Estado>('todos')
  const [porCliente, setPorCliente] = useState(false)

  const todas = useMemo(() => filasRentabilidad(proyectos), [proyectos])
  const anios = [...new Set(todas.map((f) => f.fecha.slice(0, 4)))].sort().reverse()
  const filas = todas
    .filter((f) => anio === 'todos' || f.fecha.startsWith(anio))
    .filter((f) => estado === 'todos' || (estado === 'cerrados' ? f.cerrado : !f.cerrado))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const t = totalizar(filas)

  const grupos = clientes
    .map((c) => {
      const fc = filas.filter((f) => f.proyecto.clienteId === c.id)
      return { id: c.id, nombre: c.nombre, n: fc.length, ...totalizar(fc) }
    })
    .filter((g) => g.n > 0)
    .sort((a, b) => b.utilidadReal - a.utilidadReal)

  const filasVista = porCliente
    ? grupos.map((g) => ({ key: g.id, titulo: g.nombre, sub: `${g.n} proyecto${g.n === 1 ? '' : 's'}`, link: undefined, ...g, enCurso: false }))
    : filas.map((f) => ({
        key: f.proyecto.id,
        titulo: f.proyecto.nombre,
        sub: `${f.proyecto.codigo} · ${clientes.find((c) => c.id === f.proyecto.clienteId)?.nombre ?? ''}`,
        link: `/proyectos/${f.proyecto.id}/cierre`,
        ...f,
        enCurso: !f.cerrado,
      }))
  const maxAbs = Math.max(1, ...filasVista.map((f) => Math.abs(f.margenReal)))

  return (
    <>
      <PageHeader title="Rentabilidad" description="Utilidad cotizada frente a la real, por proyecto y por cliente. En los proyectos en curso la utilidad es proyectada: lo que aún no se registra en obra se toma según lo cotizado." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Período" className="w-auto! min-w-40">
          <option value="todos">Todos los años</option>
          {anios.map((a) => (
            <option key={a} value={a}>
              Año {a}
            </option>
          ))}
        </Select>
        <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado)} aria-label="Estado" className="w-auto! min-w-48">
          <option value="todos">Cerrados y en curso</option>
          <option value="cerrados">Solo cerrados</option>
          <option value="curso">Solo en curso</option>
        </Select>
        <div className="ml-auto">
          <Toggle checked={porCliente} onChange={setPorCliente} labelOff="Por proyecto" label="Por cliente" />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-xs lg:grid-cols-4">
        {[
          ['Valor cotizado', money(t.precio), `${filas.length} proyectos`],
          ['Costo real', money(t.costoReal), 'Mano de obra, material y otros costos'],
          ['Utilidad real y proyectada', money(t.utilidadReal), `${moneySigned(t.utilidadReal - t.utilidadEstimada)} frente a lo cotizado`],
          ['Margen', pct(t.margenReal), 'Utilidad real y proyectada sobre el valor cotizado'],
        ].map(([k, v, h]) => (
          <div key={k} className="bg-white p-5">
            <dt className="text-[13px] text-slate-500">{k}</dt>
            <dd className="num mt-1 text-xl font-semibold text-slate-900">{v}</dd>
            <dd className="mt-0.5 text-xs text-slate-500">{h}</dd>
          </div>
        ))}
      </dl>

      <Card className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <caption className="sr-only">Rentabilidad {porCliente ? 'por cliente' : 'por proyecto'}</caption>
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{porCliente ? 'Cliente' : 'Proyecto'}</th>
                <th className="px-4 py-3 text-right">Valor cotizado</th>
                <th className="px-4 py-3 text-right">Costo real</th>
                <th className="px-4 py-3 text-right">Utilidad cotizada</th>
                <th className="px-4 py-3 text-right">Utilidad real o proyectada</th>
                <th className="w-64 px-4 py-3 text-left">
                  Margen
                  <span className="ml-2 inline-flex items-center gap-1 font-normal tracking-normal normal-case">
                    <span className="h-3 w-0.5 bg-slate-700" aria-hidden />
                    promedio {pct(t.margenReal)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasVista.map((f) => (
                <Fila key={f.key} f={f} maxAbs={maxAbs} promedio={t.margenReal} />
              ))}
              {filasVista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No hay proyectos aprobados en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function Fila({ f, maxAbs, promedio }: { f: Pick<FilaRentabilidad, 'precio' | 'costoReal' | 'utilidadEstimada' | 'utilidadReal' | 'margenReal'> & { titulo: string; sub: string; link?: string; enCurso: boolean }; maxAbs: number; promedio: number }) {
  const dif = f.utilidadReal - f.utilidadEstimada
  const perdida = f.margenReal < 0
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        {f.link ? (
          <Link to={f.link} className="font-medium text-slate-900 hover:text-brand-800">
            {f.titulo}
          </Link>
        ) : (
          <span className="font-medium text-slate-900">{f.titulo}</span>
        )}
        <div className="text-xs text-slate-500">
          {f.sub}
          {f.enCurso && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">En curso · proyectada</span>}
        </div>
      </td>
      <td className="num px-4 py-3 text-right text-slate-700">{money(f.precio)}</td>
      <td className="num px-4 py-3 text-right text-slate-700">{money(f.costoReal)}</td>
      <td className="num px-4 py-3 text-right text-slate-600">{money(f.utilidadEstimada)}</td>
      <td className="num px-4 py-3 text-right">
        <div className="font-semibold text-slate-900">{money(f.utilidadReal)}</div>
        {Math.round(dif) !== 0 && <div className={cn('text-xs', dif < 0 ? 'text-red-700' : 'text-brand-700')}>{moneySigned(dif)}</div>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3" title={`Margen real ${pct(f.margenReal)} · utilidad ${money(f.utilidadReal)} sobre ${money(f.precio)}`}>
          <div className="relative h-3 flex-1 rounded-sm bg-slate-100" aria-hidden>
            <div className={cn('h-full rounded-r-[4px]', perdida ? 'bg-red-600' : f.margenReal >= promedio ? 'bg-brand-600' : 'bg-brand-300')} style={{ width: `${(Math.abs(f.margenReal) / maxAbs) * 100}%` }} />
            {promedio > 0 && <span className="absolute -top-1 -bottom-1 w-0.5 bg-slate-700" style={{ left: `${(promedio / maxAbs) * 100}%` }} />}
          </div>
          <span className={cn('num w-16 text-right text-[13px] font-medium', perdida ? 'text-red-700' : 'text-slate-800')}>
            {perdida && <span className="sr-only">Pérdida </span>}
            {pct(f.margenReal)}
          </span>
        </div>
      </td>
    </tr>
  )
}
