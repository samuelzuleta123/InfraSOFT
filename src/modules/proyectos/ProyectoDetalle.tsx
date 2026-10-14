import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Button, Tabs } from '@/components/ui'
import { useFlechas } from '@/lib/flechas'
import { ETAPAS, EtapaBadge, EstadoCotBadge, StepperEtapas } from '@/components/dominio'
import { useCliente, useProyecto, useStore } from '@/store/useStore'
import { versionVigente } from '@/lib/calc'
import type { Etapa } from '@/types'
import { LevantamientoTab } from './LevantamientoTab'
import { DocumentosTab } from './DocumentosTab'
import { HistorialTab } from './HistorialTab'
import { AvanzarEtapaModal, chequeosEtapa } from './AvanzarEtapaModal'
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

export function ProyectoDetalle() {
  const { id, tab } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const nav = useNavigate()
  const [avanzar, setAvanzar] = useState(false)
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
  // Si falta un requisito obligatorio, avanzar deja de ser la acción principal y lo dice.
  const bloqueos = proyecto.etapa < 5 ? chequeosEtapa(proyecto, siguiente, ordenes.filter((o) => o.proyectoId === proyecto.id).length).filter((c) => c.bloquea && !c.ok).length : 0

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
              onClick={() => setAvanzar(true)}
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
            <button type="button" onClick={() => setAvanzar(true)} className="-my-2 px-1 py-2 text-xs font-medium text-brand-800 underline">
              Avanzar{bloqueos > 0 && ` · ${bloqueos} pendiente${bloqueos === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
        <div className="hidden border-t border-slate-100 px-5 py-4 sm:block">
          <StepperEtapas
            etapa={proyecto.etapa}
            onSelect={(e) => {
              nav(`/proyectos/${proyecto.id}/${tabDeEtapa[e]}`)
            }}
          />
        </div>
        <Tabs className="px-3" tabs={[...TABS]} value={tab as TabId} onChange={(t) => nav(`/proyectos/${proyecto.id}/${t}`)} />
      </div>

      <div className="mt-6">
        {tab === 'levantamiento' && <LevantamientoTab proyecto={proyecto} />}
        {tab === 'cotizacion' && <CotizadorTab proyecto={proyecto} />}
        {tab === 'compras' && <ComprasTab proyecto={proyecto} />}
        {tab === 'ejecucion' && <BitacoraTab proyecto={proyecto} />}
        {tab === 'entrega' && <EntregaTab proyecto={proyecto} />}
        {tab === 'cierre' && <CierreTab proyecto={proyecto} />}
        {tab === 'documentos' && <DocumentosTab proyecto={proyecto} />}
        {tab === 'historial' && <HistorialTab proyecto={proyecto} />}
      </div>
      {avanzar && <AvanzarEtapaModal proyecto={proyecto} destino={siguiente} onClose={() => setAvanzar(false)} onAvanzado={() => nav(`/proyectos/${proyecto.id}/${tabDeEtapa[siguiente]}`)} />}
    </div>
  )
}
