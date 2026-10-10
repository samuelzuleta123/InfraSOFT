import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Button, Tabs } from '@/components/ui'
import { ETAPAS, EtapaBadge, EstadoCotBadge, StepperEtapas, nombreEtapa } from '@/components/dominio'
import { useCliente, useProyecto, useStore } from '@/store/useStore'
import { versionVigente } from '@/lib/calc'
import type { Etapa } from '@/types'
import { LevantamientoTab } from './LevantamientoTab'
import { DocumentosTab } from './DocumentosTab'
import { CotizadorTab } from '@/modules/cotizaciones/CotizadorTab'
import { ComprasTab } from '@/modules/compras/ComprasTab'
import { BitacoraTab } from '@/modules/ejecucion/BitacoraTab'
import { EntregaTab } from '@/modules/entrega/EntregaTab'
import { CierreTab } from '@/modules/entrega/CierreTab'

const TABS = [
  { id: 'levantamiento', label: 'Levantamiento' },
  { id: 'cotizacion', label: 'Cotización' },
  { id: 'compras', label: 'Compras' },
  { id: 'ejecucion', label: 'Ejecución' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'documentos', label: 'Documentos' },
] as const
type TabId = (typeof TABS)[number]['id']

const tabDeEtapa: Record<Etapa, TabId> = { 1: 'cotizacion', 2: 'compras', 3: 'ejecucion', 4: 'entrega', 5: 'cierre' }

export function ProyectoDetalle() {
  const { id, tab } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const nav = useNavigate()

  if (!proyecto) return <Navigate to="/proyectos" replace />
  if (!TABS.some((t) => t.id === tab)) return <Navigate to={`/proyectos/${proyecto.id}/cotizacion`} replace />

  const v = versionVigente(proyecto)
  const cerrado = proyecto.etapa === 5 && !!proyecto.facturaCliente
  const cambiarEtapa = (e: Etapa) => {
    editarProyecto(proyecto.id, (p) => {
      p.etapa = e
    })
    notificar(`Proyecto en etapa ${e}: ${nombreEtapa(e)}`)
  }

  return (
    <div>
      <nav aria-label="Ruta" className="mb-3 flex items-center gap-1 text-[13px] text-slate-500">
        <Link to="/proyectos" className="inline-flex items-center gap-1 rounded hover:text-slate-900">
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
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                {proyecto.cotizacion.consecutivo} {v.nombre}
              </span>
              <EstadoCotBadge estado={v.estado} />
            </div>
            <h1 className="mt-2 text-xl font-semibold text-balance text-slate-900">{proyecto.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{cliente?.nombre}</span>
              <span>NIT {cliente?.nit}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {proyecto.sede}
              </span>
            </div>
          </div>
          {proyecto.etapa < 5 && (
            <Button
              variant="primary"
              icon={<ChevronRight />}
              onClick={() => {
                const sig = (proyecto.etapa + 1) as Etapa
                cambiarEtapa(sig)
                nav(`/proyectos/${proyecto.id}/${tabDeEtapa[sig]}`)
              }}
            >
              Avanzar a {ETAPAS[proyecto.etapa].corto.toLowerCase()}
            </Button>
          )}
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
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
      </div>
    </div>
  )
}
