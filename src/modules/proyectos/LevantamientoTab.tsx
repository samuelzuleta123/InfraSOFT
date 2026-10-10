import { ArrowRight, ClipboardList, Server } from 'lucide-react'
import { Card, CardHeader, DL, EmptyState } from '@/components/ui'
import { FechaTexto, FotoPlaceholder } from '@/components/dominio'
import type { Proyecto } from '@/types'

export function LevantamientoTab({ proyecto }: { proyecto: Proyecto }) {
  const l = proyecto.levantamiento
  if (!l)
    return (
      <Card>
        <EmptyState icon={<ClipboardList />} title="Sin levantamiento registrado" description="Registra las medidas, la ruta y las fotos de la visita técnica antes de cotizar." />
      </Card>
    )

  const fotos = proyecto.fotos.filter((f) => f.etapa === 'levantamiento')
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-5">
        <Card>
          <CardHeader
            title="Visita técnica"
            description={
              <>
                <FechaTexto iso={l.fecha} /> · {l.responsable}
              </>
            }
          />
          <div className="p-5">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Medidas</h3>
            <DL className="mt-3" items={l.medidas.map((m) => [m.etiqueta, <span className="num font-medium">{m.valor}</span>])} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Recorrido" />
          <div className="space-y-5 p-5">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <RackBox titulo="Rack de origen" texto={l.rackOrigen} />
              <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-slate-400 sm:rotate-0" aria-hidden />
              <RackBox titulo="Rack de destino" texto={l.rackDestino} />
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Ruta de tubería</h3>
              <p className="mt-1.5 max-w-prose leading-relaxed text-slate-700">{l.rutaTuberia}</p>
            </div>
            {l.observaciones && (
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Observaciones</h3>
                <p className="mt-1.5 max-w-prose leading-relaxed text-slate-700">{l.observaciones}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Fotos del levantamiento" description={`${fotos.length} fotos`} />
        <div className="grid grid-cols-2 gap-3 p-5">
          {fotos.map((f) => (
            <FotoPlaceholder key={f.id} foto={f} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function RackBox({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-1 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <Server className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
      <div>
        <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{titulo}</div>
        <div className="mt-0.5 font-medium text-slate-900">{texto}</div>
      </div>
    </div>
  )
}
