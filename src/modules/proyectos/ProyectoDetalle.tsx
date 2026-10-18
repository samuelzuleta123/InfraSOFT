import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Lock, MapPin, XCircle } from 'lucide-react'
import { Button, Card, Tabs } from '@/components/ui'
import { useFlechas } from '@/lib/flechas'
import { ETAPAS, EtapaBadge, EstadoCotBadge, nombreEtapa, StepperEtapas } from '@/components/dominio'
import { useCliente, useProyecto, useStore } from '@/store/useStore'
import { versionVigente } from '@/lib/calc'
import type { Etapa } from '@/types'
import { LevantamientoTab } from './LevantamientoTab'
import { DocumentosTab } from './DocumentosTab'
import { HistorialTab } from './HistorialTab'
import { AvanzarEtapaModal, chequeosEtapa, useAvanzarEtapa, type Chequeo } from './AvanzarEtapaModal'
import { CotizadorTab } from '@/modules/cotizaciones/CotizadorTab'
import { ComprasTab } from '@/modules/compras/ComprasTab'
import { BitacoraTab } from '@/modules/ejecucion/BitacoraTab'
import { EntregaTab } from '@/modules/entrega/EntregaTab'
import { CierreTab } from '@/modules/entrega/CierreTab'
import { ultimaBusqueda } from './ListaProyectos'

const TABS = [
  { id: 'levantamiento', label: 'Levantamiento' },
  { id: 'cotizacion', label: 'Cotización' },
  { id: 'compras', label: 'Compras' },
  { id: 'ejecucion', label: 'Ejecución' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'historial', label: 'Historial' },
] as const
type TabId = (typeof TABS)[number]['id']

const tabDeEtapa: Record<Etapa, TabId> = { 1: 'cotizacion', 2: 'compras', 3: 'ejecucion', 4: 'entrega', 5: 'cierre' }
/** Pestañas que pertenecen a una etapa: se abren cuando el proyecto llega a ella, para no saltarse pasos. */
// Compras queda abierta desde el inicio: ahí se marca la cotización como enviada y aprobada.
const etapaDeTab: Partial<Record<TabId, Etapa>> = { ejecucion: 3, entrega: 4, cierre: 5 }

export function ProyectoDetalle() {
  const { id, tab } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const nav = useNavigate()
  const [avanzar, setAvanzar] = useState(false)
  const avanzarEtapa = useAvanzarEtapa()
  const ordenes = useStore((s) => s.ordenes)
  // ←/→ en cualquier parte de la página pasan a la pestaña anterior o siguiente.
  useFlechas((tecla, e) => {
    if (!proyecto || (tecla !== 'ArrowLeft' && tecla !== 'ArrowRight')) return
    const i = TABS.findIndex((t) => t.id === tab) + (tecla === 'ArrowRight' ? 1 : -1)
    if (i < 0 || i >= TABS.length) return
    e.preventDefault()
    nav(`/proyectos/${proyecto.id}/${TABS[i].id}`)
  })

  if (!proyecto) return <Navigate to="/proyectos" replace />
  if (!TABS.some((t) => t.id === tab)) return <Navigate to={`/proyectos/${proyecto.id}/levantamiento`} replace />

  const v = versionVigente(proyecto)
  const cerrado = proyecto.etapa === 5 && !!proyecto.facturaCliente
  const siguiente = (proyecto.etapa + 1) as Etapa
  const etapaTab = etapaDeTab[tab as TabId]
  const tabBloqueada = etapaTab !== undefined && etapaTab > proyecto.etapa
  const tabs = TABS.map((t) => {
    const e = etapaDeTab[t.id]
    return e && e > proyecto.etapa
      ? { id: t.id, label: <span className="inline-flex items-center gap-1.5 text-slate-400" title={`Se habilita en la etapa ${e}`}><Lock className="size-3.5" aria-hidden />{t.label}</span> }
      : t
  })
  const chequeos = proyecto.etapa < 5 ? chequeosEtapa(proyecto, siguiente, ordenes.filter((o) => o.proyectoId === proyecto.id).length) : []
  // Si falta un requisito obligatorio, avanzar deja de ser la acción principal y lo dice.
  const bloqueos = chequeos.filter((c) => c.bloquea && !c.ok).length
  // Con todo listo no hay nada que confirmar: avanza de una vez (queda Deshacer). El modal solo aparece si falta algo.
  const pedirAvance = () => {
    if (proyecto.etapa >= 5) return
    if (chequeos.some((c) => !c.ok)) return setAvanzar(true)
    avanzarEtapa(proyecto, siguiente)
    nav(`/proyectos/${proyecto.id}/${tabDeEtapa[siguiente]}`)
  }

  return (
    <div>
      <nav aria-label="Ruta" className="mb-3 flex items-center gap-1 text-[13px] text-slate-500">
        <Link to={`/proyectos${ultimaBusqueda}`} className="inline-flex items-center gap-1 rounded hover:text-slate-900">
          <ChevronLeft className="size-4" aria-hidden />
          Proyectos
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-700">{proyecto.codigo}</span>
      </nav>

      <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <EtapaBadge etapa={proyecto.etapa} cerrado={cerrado} />
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-500">
                {proyecto.cotizacion.consecutivo} {v.nombre}
              </span>
              <EstadoCotBadge estado={v.estado} />
            </div>
            <h1 className="mt-2 text-lg font-semibold text-balance text-slate-900 sm:text-xl">{proyecto.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{cliente?.nombre}</span>
              <span className="hidden sm:inline">NIT {cliente?.nit}</span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <MapPin className="size-3.5" aria-hidden />
                {proyecto.sede}
              </span>
            </div>
          </div>
          {proyecto.etapa < 5 && (
            <Button
              variant={bloqueos ? 'secondary' : 'primary'}
              icon={<ChevronRight />}
              onClick={pedirAvance}
              className="hidden sm:inline-flex"
              title={bloqueos ? 'Hay requisitos obligatorios pendientes para pasar de etapa' : undefined}
            >
              Avanzar a {ETAPAS[proyecto.etapa].corto.toLowerCase()}
              {bloqueos > 0 && (
                <span className="num rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-900">
                  {bloqueos} pendiente{bloqueos === 1 ? '' : 's'}
                </span>
              )}
            </Button>
          )}
        </div>
        {/* En celular: progreso compacto en una línea; el avance de etapa es secundario. */}
        <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-3 sm:hidden">
          <div className="flex flex-1 gap-1" aria-hidden>
            {ETAPAS.map((e) => (
              <span key={e.n} className={cn('h-1.5 flex-1 rounded-full', e.n <= proyecto.etapa ? 'bg-brand-600' : 'bg-slate-200')} />
            ))}
          </div>
          <span className="text-xs font-medium text-slate-600">
            Etapa {proyecto.etapa} de 5
          </span>
          {proyecto.etapa < 5 && (
            <button type="button" onClick={pedirAvance} className="-my-2 px-1 py-2 text-xs font-medium text-brand-800 underline">
              Avanzar{bloqueos > 0 && ` · ${bloqueos} pendiente${bloqueos === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
        <div className="hidden border-t border-slate-100 px-5 py-4 sm:block">
          <StepperEtapas
            etapa={proyecto.etapa}
            cerrado={cerrado}
            onSelect={(e) => {
              nav(`/proyectos/${proyecto.id}/${tabDeEtapa[e]}`)
            }}
          />
        </div>
        <PendientesEtapa proyectoId={proyecto.id} tab={tab as TabId} etapa={proyecto.etapa} cerrado={cerrado} chequeos={chequeos} />
        <Tabs className="px-3" tabs={tabs} value={tab as TabId} onChange={(t) => nav(`/proyectos/${proyecto.id}/${t}`)} />
      </div>

      <div className="mt-6">
        {tabBloqueada ? (
          <EtapaBloqueada etapaTab={etapaTab} etapa={proyecto.etapa} esSiguiente={etapaTab === siguiente} bloqueos={bloqueos} onAvanzar={pedirAvance} />
        ) : (
          <>
        {tab === 'levantamiento' && <LevantamientoTab proyecto={proyecto} />}
        {tab === 'cotizacion' && <CotizadorTab proyecto={proyecto} />}
        {tab === 'compras' && <ComprasTab proyecto={proyecto} />}
        {tab === 'ejecucion' && <BitacoraTab proyecto={proyecto} />}
        {tab === 'entrega' && <EntregaTab proyecto={proyecto} />}
        {tab === 'cierre' && <CierreTab proyecto={proyecto} />}
        {tab === 'documentos' && <DocumentosTab proyecto={proyecto} />}
        {tab === 'historial' && <HistorialTab proyecto={proyecto} />}
          </>
        )}
      </div>
      <NavegacionTabs proyectoId={proyecto.id} tab={tab as TabId} etapa={proyecto.etapa} />
      {avanzar && <AvanzarEtapaModal proyecto={proyecto} destino={siguiente} onClose={() => setAvanzar(false)} onAvanzado={() => nav(`/proyectos/${proyecto.id}/${tabDeEtapa[siguiente]}`)} />}
    </div>
  )
}

/** Anterior / siguiente al final de cada pestaña: lo mismo que ←/→, sin volver arriba. */
function NavegacionTabs({ proyectoId, tab, etapa }: { proyectoId: string; tab: TabId; etapa: Etapa }) {
  const i = TABS.findIndex((t) => t.id === tab)
  const anterior = TABS[i - 1]
  const siguiente = TABS[i + 1]
  const bloqueada = (t: TabId) => (etapaDeTab[t] ?? 0) > etapa
  return (
    <nav aria-label="Pestañas del proyecto" className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
      {anterior ? (
        <Link
          to={`/proyectos/${proyectoId}/${anterior.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {anterior.label}
        </Link>
      ) : (
        <span />
      )}
      {siguiente && (
        <Link
          to={`/proyectos/${proyectoId}/${siguiente.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-800 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          {bloqueada(siguiente.id) && <Lock className="size-3.5" aria-hidden />}
          Siguiente: {siguiente.label}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  )
}

function EtapaBloqueada({ etapaTab, etapa, esSiguiente, bloqueos, onAvanzar }: { etapaTab: Etapa; etapa: Etapa; esSiguiente: boolean; bloqueos: number; onAvanzar: () => void }) {
  return (
    <Card className="mx-auto max-w-xl px-6 py-10 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Lock className="size-5" aria-hidden />
      </span>
      <h2 className="mt-4 text-[15px] font-semibold text-slate-900">Se habilita en la etapa {etapaTab} · {nombreEtapa(etapaTab)}</h2>
      <p className="mt-1.5 text-[13px] text-slate-500">
        El proyecto está en la etapa {etapa} · {nombreEtapa(etapa)}.{' '}
        {esSiguiente
          ? etapaTab === 5
            ? 'Para cerrarlo hay que cargar primero el acta de conformidad firmada por el cliente en Entrega.'
            : 'Avanza el proyecto cuando la etapa actual esté lista.'
          : `Primero hay que pasar por ${nombreEtapa((etapa + 1) as Etapa).toLowerCase()}.`}
      </p>
      {esSiguiente && (
        <Button variant={bloqueos ? 'secondary' : 'primary'} icon={<ChevronRight />} onClick={onAvanzar} className="mt-5">
          Avanzar a {nombreEtapa(etapaTab).toLowerCase()}
        </Button>
      )}
      {esSiguiente && bloqueos > 0 && <p className="mt-2 text-xs text-slate-500">Revisa arriba qué falta: los obligatorios impiden avanzar.</p>}
    </Card>
  )
}

const nombreTab: Record<Chequeo['tab'], string> = { cotizacion: 'Cotización', compras: 'Compras', ejecucion: 'Ejecución', entrega: 'Entrega', cierre: 'Cierre' }

/** Qué falta para pasar a la siguiente etapa, por qué se pide y dónde se resuelve. Siempre visible bajo el stepper. */
/** Requisitos para la siguiente etapa: cada uno se muestra solo en la pestaña donde se resuelve. */
function PendientesEtapa({ proyectoId, tab, etapa, cerrado, chequeos }: { proyectoId: string; tab: TabId; etapa: Etapa; cerrado: boolean; chequeos: Chequeo[] }) {
  if (cerrado) return null
  // En cierre ya no hay etapa siguiente: lo único pendiente es registrar la factura.
  const lista: Chequeo[] =
    etapa === 5
      ? [{ texto: 'Factura al cliente registrada', ok: false, bloquea: true, ayuda: 'Con la factura registrada el proyecto queda cerrado y entra a la liquidación.', tab: 'cierre' }]
      : chequeos
  if (!lista.some((c) => c.tab === tab)) return null
  const faltan = lista.filter((c) => !c.ok)
  const aqui = faltan.filter((c) => c.tab === tab)
  const otrasTabs = [...new Set(faltan.filter((c) => c.tab !== tab).map((c) => c.tab))]
  const obligatorios = faltan.filter((c) => c.bloquea)
  const destino = etapa === 5 ? 'cerrar el proyecto' : `pasar a ${nombreEtapa((etapa + 1) as Etapa).toLowerCase()}`
  const tono = obligatorios.length ? 'bloqueado' : faltan.length ? 'pendiente' : 'listo'

  return (
    <section aria-label="Requisitos para avanzar" className="border-t border-slate-100 px-5 py-3">
      <p className={cn('flex items-center gap-2 text-[13px] font-medium', tono === 'bloqueado' ? 'text-red-800' : tono === 'pendiente' ? 'text-amber-800' : 'text-brand-800')}>
        {tono === 'bloqueado' ? <XCircle className="size-4 shrink-0" aria-hidden /> : tono === 'pendiente' ? <CircleAlert className="size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="size-4 shrink-0" aria-hidden />}
        {tono === 'bloqueado'
          ? `No puedes ${destino}: ${obligatorios.length === 1 ? 'falta 1 requisito obligatorio' : `faltan ${obligatorios.length} requisitos obligatorios`}.`
          : tono === 'pendiente'
            ? `Puedes ${destino}, pero ${faltan.length === 1 ? 'queda 1 pendiente' : `quedan ${faltan.length} pendientes`}.`
            : `Todo listo para ${destino}.`}
        {lista.length > faltan.length && <span className="font-normal text-slate-500">· {lista.length - faltan.length} de {lista.length} listos</span>}
      </p>
      {aqui.length > 0 && (
        <ul className="mt-2 grid gap-2 lg:grid-cols-2">
          {aqui.map((c) => (
            <li key={c.texto} className={cn('flex items-start gap-2.5 rounded-md border px-3 py-2', c.bloquea ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60')}>
              {c.bloquea ? <XCircle className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-900">
                  {c.texto}
                  {c.bloquea ? <span className="ml-1.5 text-xs font-medium text-red-700">Obligatorio</span> : <span className="ml-1.5 text-xs font-normal text-amber-800">Recomendado</span>}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{c.ayuda}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {otrasTabs.length > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          También falta en{' '}
          {otrasTabs.map((t, i) => (
            <span key={t}>
              {i > 0 && ', '}
              <Link to={`/proyectos/${proyectoId}/${t}`} className="font-medium text-brand-800 underline-offset-2 hover:underline">
                {nombreTab[t]}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </section>
  )
}
