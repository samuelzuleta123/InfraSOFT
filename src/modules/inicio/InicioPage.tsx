import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronRight, Inbox, Plus, ReceiptText } from 'lucide-react'
import { Button, Card, CardHeader, EmptyState } from '@/components/ui'
import { ETAPAS } from '@/components/dominio'
import { VencimientosWidget } from '@/modules/facturas/VencimientosWidget'
import { NuevoProyectoModal } from '@/modules/proyectos/NuevoProyectoModal'
import { avanceEjecucion, resumen, totalFactura, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { diasEntre, fecha, HOY, money, pct } from '@/lib/format'
import { filasRentabilidad, totalizar } from '@/lib/rentabilidad'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'

/** Nombre con el que se saluda en el panel (mockup: sin usuarios todavía). */
const USUARIO = 'Carlos'
/** Desde cuántos días sin respuesta una cotización enviada pasa a pedir atención. */
const DIAS_SIN_RESPUESTA = 7

const corto = (nombre: string) => nombre.replace(/\s+S\.A\.S?\.?$/, '')
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios)
const cuenta = (n: number, uno: string, varios: string) => `${n} ${plural(n, uno, varios)}`
const haceDias = (n: number) => (n <= 0 ? 'Hoy' : `Hace ${cuenta(n, 'día', 'días')}`)

/**
 * Panel de control. Encabezado blanco con el saludo y las cifras clave (el carbón es solo de la barra lateral);
 * debajo, tarjetas con los mismos Card, EmptyState y VencimientosWidget del resto de páginas.
 * El color solo marca estado: rojo lo vencido, ámbar lo demorado; el resto es gris y carbón.
 */
export function InicioPage() {
  const proyectos = useStore((s) => s.proyectos)
  const facturas = useStore((s) => s.facturas)
  const clientes = useStore((s) => s.clientes)
  const [nuevo, setNuevo] = useState(false)

  const valor = (p: Proyecto) => resumen(versionVigente(p)).precioVigente
  const cliente = (p: Proyecto) => corto(clientes.find((c) => c.id === p.clienteId)?.nombre ?? '')
  const activos = proyectos.filter((p) => !p.facturaCliente)
  const enCurso = activos.filter((p) => p.cotizacion.versiones.some((v) => v.estado === 'aprobada'))
  const anio = HOY.slice(0, 4)
  const rent = totalizar(filasRentabilidad(proyectos).filter((f) => f.fecha.startsWith(anio)))

  const pendientes = proyectos
    .flatMap((p) =>
      p.cotizacion.versiones
        .filter((v) => v.estado === 'enviada')
        .map((v) => {
          const enviada = [...v.historial].reverse().find((h) => h.estado === 'enviada')?.fecha ?? v.creada
          return { p, v, dias: diasEntre(enviada, HOY) }
        }),
    )
    .sort((a, b) => b.dias - a.dias)
  const demoradas = pendientes.filter((x) => x.dias > DIAS_SIN_RESPUESTA)

  const porPagar = facturas
    .filter((f) => f.formaPago !== 'Contado' && !f.pagada)
    .map((f) => ({ f, dias: diasEntre(HOY, f.vencimiento) }))
    .sort((a, b) => a.dias - b.dias)
  const vencidas = porPagar.filter((x) => x.dias < 0)
  const proximas = porPagar.filter((x) => x.dias <= 30)
  const sinAsignar = facturas.filter((f) => !f.proyectoId)
  const sobrecosto = proyectos.filter((p) => p.etapa === 3 && avanceEjecucion(versionVigente(p)).semaforo === 'rojo')
  const recientes = [...proyectos].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 4)

  const porEtapa = ETAPAS.map((e) => {
    const ps = proyectos.filter((p) => p.etapa === e.n)
    return { ...e, cantidad: ps.length, valor: ps.reduce((a, p) => a + valor(p), 0) }
  })
  const valorTotal = Math.max(1, porEtapa.reduce((a, e) => a + e.valor, 0))

  const avisos: Aviso[] = [
    vencidas.length > 0 && {
      n: vencidas.length,
      tono: 'danger' as const,
      titulo: plural(vencidas.length, 'Factura de proveedor vencida', 'Facturas de proveedor vencidas'),
      detalle: `${money(vencidas.reduce((a, x) => a + totalFactura(x.f), 0))} por pagar`,
      to: '/facturas',
    },
    sobrecosto.length > 0 && {
      n: sobrecosto.length,
      tono: 'danger' as const,
      titulo: plural(sobrecosto.length, 'Obra con sobrecosto', 'Obras con sobrecosto'),
      detalle: `Más de 10 % sobre el presupuesto · ${sobrecosto.map((p) => p.codigo).join(', ')}`,
      to: sobrecosto.length === 1 ? `/proyectos/${sobrecosto[0].id}/ejecucion` : '/proyectos?etapa=3',
    },
    demoradas.length > 0 && {
      n: demoradas.length,
      tono: 'warn' as const,
      titulo: plural(demoradas.length, 'Cotización sin respuesta', 'Cotizaciones sin respuesta'),
      detalle: `Más de ${DIAS_SIN_RESPUESTA} días desde el envío · la más antigua, ${cuenta(demoradas[0]?.dias ?? 0, 'día', 'días')}`,
      to: demoradas.length === 1 ? `/proyectos/${demoradas[0].p.id}/compras` : '/proyectos?etapa=1',
    },
    sinAsignar.length > 0 && {
      n: sinAsignar.length,
      tono: 'warn' as const,
      titulo: plural(sinAsignar.length, 'Factura sin asignar', 'Facturas sin asignar'),
      detalle: 'Asociarlas a su proyecto y orden de compra',
      to: '/facturas',
    },
  ].filter((x): x is Aviso => Boolean(x))

  const cifras: Cifra[] = [
    {
      etiqueta: 'Proyectos en curso',
      valor: money(enCurso.reduce((a, p) => a + valor(p), 0)),
      detalle: `${cuenta(enCurso.length, 'aprobado', 'aprobados')} sin cerrar · ${cuenta(activos.length, 'activo', 'activos')}`,
      to: '/proyectos',
    },
    {
      etiqueta: `Utilidad ${anio}`,
      valor: rent.precio > 0 ? money(rent.utilidadReal) : '—',
      detalle: rent.precio > 0 ? <><span className="font-medium text-brand-700">{pct(rent.margenReal)}</span> de margen · real y proyectada</> : 'Sin cotizaciones aprobadas',
      to: '/rentabilidad',
    },
    {
      etiqueta: 'Por pagar · 30 días',
      valor: money(proximas.reduce((a, x) => a + totalFactura(x.f), 0)),
      detalle: vencidas.length ? <><span className="font-medium text-red-700">{cuenta(vencidas.length, 'vencida', 'vencidas')}</span> · {cuenta(proximas.length, 'factura', 'facturas')}</> : cuenta(proximas.length, 'factura', 'facturas'),
      to: '/facturas',
    },
    {
      etiqueta: 'Propuestas abiertas',
      valor: money(pendientes.reduce((a, x) => a + resumen(x.v).precioVigente, 0)),
      detalle: `${cuenta(pendientes.length, 'cotización esperando', 'cotizaciones esperando')} respuesta`,
      to: '/proyectos?etapa=1',
    },
  ]

  return (
    <>
      {/* Encabezado: saludo y cifras clave sobre superficie blanca. */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-6 pb-5 sm:px-7">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bienvenido, {USUARIO}</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              <span className="font-medium text-slate-700">Inicio</span>
              <span className="mx-2 text-slate-300" aria-hidden>
                ·
              </span>
              Corte al <span className="num">{fecha(HOY)}</span>
            </p>
          </div>
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo proyecto
          </Button>
        </div>
        <ul className="grid grid-cols-2 border-t border-slate-200 xl:grid-cols-4">
          {cifras.map((c, i) => (
            <li key={c.etiqueta} className={cn('border-slate-200', i % 2 === 1 && 'border-l', i >= 2 && 'border-t xl:border-t-0', i === 2 && 'xl:border-l')}>
              <Link to={c.to} className="group block h-full px-5 py-5 transition-colors hover:bg-slate-50 sm:px-7">
                <span className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {c.etiqueta}
                  <ArrowRight className="size-3.5 text-slate-300 transition-colors group-hover:text-slate-600" aria-hidden />
                </span>
                <span className="num mt-2 block truncate text-[22px] leading-tight font-semibold tracking-tight text-slate-900 sm:text-2xl">{c.valor}</span>
                <span className="mt-1 block text-xs text-slate-500">{c.detalle}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      {nuevo && <NuevoProyectoModal onClose={() => setNuevo(false)} />}

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Tarjetas a su alto natural (items-start) y avisos lado a lado a todo el ancho: ninguna estira un hueco en blanco. */}
        <Card className="lg:col-span-2">
          <CardHeader title="Requiere atención" description={avisos.length ? cuenta(avisos.length, 'asunto pendiente', 'asuntos pendientes') : 'Nada pendiente'} />
          {avisos.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="text-emerald-600" />} title="Todo al día" description="Sin facturas vencidas, sobrecostos ni pendientes." className="py-8" />
          ) : (
            <ul className="divide-y divide-slate-100 xl:flex xl:divide-x xl:divide-y-0">
              {avisos.map((a) => (
                <li key={a.titulo} className="min-w-0 xl:flex-1">
                  <Link to={a.to} className="group relative flex h-full items-center gap-4 py-3.5 pr-4 pl-5 hover:bg-slate-50">
                    <span className={cn('absolute inset-y-3.5 left-0 w-0.5 rounded-full', a.tono === 'danger' ? 'bg-red-600' : 'bg-amber-500')} aria-hidden />
                    <span className={cn('num w-9 shrink-0 text-2xl leading-none font-semibold', a.tono === 'danger' ? 'text-red-700' : 'text-amber-700')}>{a.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-slate-900 group-hover:underline">{a.titulo}</span>
                      {/* Sin truncate: el detalle (p. ej. varios códigos de proyecto) baja de línea en vez de cortarse con "…". */}
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{a.detalle}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-700" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Proyectos por etapa" description={`${cuenta(proyectos.length, 'proyecto', 'proyectos')} · ${money(valorTotal)} cotizados`} actions={<VerTodo to="/proyectos" />} />
          <ol className="grid grid-cols-1 px-5 py-4 sm:grid-cols-5 sm:divide-x sm:divide-slate-200">
            {porEtapa.map((e) => (
              <li key={e.n} className="border-b border-slate-100 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                <Link to={`/proyectos?etapa=${e.n}`} className="group flex items-center gap-4 py-2.5 sm:block sm:py-0">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-slate-400">0{e.n}</span>
                    <span className="block truncate text-[13px] font-medium text-slate-700 group-hover:text-slate-900">{e.corto}</span>
                  </span>
                  <span className="num block text-right text-2xl leading-none font-semibold text-slate-900 sm:mt-4 sm:text-left">{e.cantidad}</span>
                  <span className="num block w-28 text-right text-xs text-slate-500 sm:mt-1.5 sm:w-auto sm:text-left">{money(e.valor)}</span>
                  <span className="mt-3 hidden h-1 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden>
                    <span className="block h-full rounded-full bg-slate-800" style={{ width: `${(e.valor / valorTotal) * 100}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Cotizaciones por responder" description="Enviadas al cliente, de la más antigua a la más reciente" actions={<VerTodo to="/proyectos?etapa=1" />} />
          {pendientes.length === 0 ? (
            <EmptyState icon={<Inbox />} title="Sin cotizaciones por responder" description="Todas las cotizaciones enviadas tienen respuesta del cliente." className="py-8" />
          ) : (
            // Hasta cinco filas, como VencimientosWidget compacto.
            <ul className="divide-y divide-slate-100">
              {pendientes.slice(0, 5).map(({ p, v, dias }) => (
                <li key={v.id}>
                  <Link to={`/proyectos/${p.id}/compras`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{p.nombre}</div>
                      <div className="truncate text-xs text-slate-500">
                        {p.cotizacion.consecutivo} {v.nombre} · {cliente(p)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="num text-sm font-semibold text-slate-900">{money(resumen(v).precioVigente)}</div>
                      <div className={cn('text-xs', dias > DIAS_SIN_RESPUESTA ? 'font-medium text-amber-700' : 'text-slate-500')}>{haceDias(dias)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pagos a proveedores" description="A crédito, por fecha de vencimiento" actions={<VerTodo to="/facturas" />} />
          {porPagar.length === 0 ? <EmptyState icon={<ReceiptText />} title="Sin facturas pendientes de pago" className="py-8" /> : <VencimientosWidget compacto />}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Proyectos recientes" description="Los últimos creados" actions={<VerTodo to="/proyectos" />} />
          <ul className="grid gap-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
            {recientes.map((p) => {
              const cerrado = !!p.facturaCliente
              return (
                <li key={p.id}>
                  <Link to={`/proyectos/${p.id}`} className="group flex h-full flex-col rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-400">
                    <span className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono">{p.codigo}</span>
                      <span className="num">{fecha(p.creado)}</span>
                    </span>
                    <span className="mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-slate-900 group-hover:underline">{p.nombre}</span>
                    <span className="mt-0.5 truncate text-xs text-slate-500">{cliente(p)}</span>
                    <span className="mt-auto pt-4">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-700">{cerrado ? 'Cerrado' : `Etapa ${p.etapa} · ${ETAPAS[p.etapa - 1].corto}`}</span>
                        <span className="num text-[13px] font-semibold text-slate-900">{money(valor(p))}</span>
                      </span>
                      <span className="mt-2 grid grid-cols-5 gap-1" aria-hidden>
                        {ETAPAS.map((e) => (
                          <span key={e.n} className={cn('h-1 rounded-full', cerrado || e.n < p.etapa ? 'bg-slate-800' : e.n === p.etapa ? 'bg-brand-600' : 'bg-slate-200')} />
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}

interface Aviso {
  n: number
  tono: 'danger' | 'warn'
  titulo: string
  detalle: string
  to: string
}

interface Cifra {
  etiqueta: string
  valor: string
  detalle: ReactNode
  to: string
}

function VerTodo({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900">
      Ver todo <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  )
}
