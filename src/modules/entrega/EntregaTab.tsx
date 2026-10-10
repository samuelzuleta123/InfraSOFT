import { Link } from 'react-router-dom'
import { Check, FileSignature, FileText, Printer } from 'lucide-react'
import { Alert, Badge, Card, CardHeader, Field, Input } from '@/components/ui'
import { AdjuntoChip, FotoPlaceholder, SubirArchivo } from '@/components/dominio'
import { cn } from '@/lib/cn'
import { HOY } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'

export function EntregaTab({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const e = proyecto.entrega
  const editar = (fn: (en: Proyecto['entrega']) => void) => editarProyecto(proyecto.id, (p) => fn(p.entrega))
  const seleccionadas = new Set(e.fotosSeleccionadas)

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader
          title="Informe de entrega"
          description="Selecciona las fotos que van en el informe y adjunta la certificación."
          actions={
            <Link
              to={`/proyectos/${proyecto.id}/entrega/informe`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-800 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              <FileText className="size-4" aria-hidden />
              Generar informe
            </Link>
          }
        />
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Fotos del proyecto</h3>
            <span className="text-xs text-slate-500">
              {seleccionadas.size} de {proyecto.fotos.length} seleccionadas
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {proyecto.fotos.map((f) => {
              const sel = seleccionadas.has(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => editar((en) => void (en.fotosSeleccionadas = sel ? en.fotosSeleccionadas.filter((x) => x !== f.id) : [...en.fotosSeleccionadas, f.id]))}
                  className={cn('rounded-md text-left ring-offset-2 transition-shadow', sel ? 'ring-2 ring-brand-600' : 'hover:ring-2 hover:ring-slate-300')}
                >
                  <FotoPlaceholder foto={f}>
                    <span
                      className={cn(
                        'absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border-2 transition-colors',
                        sel ? 'border-brand-600 bg-brand-600 text-white' : 'border-white/90 bg-black/20 text-transparent',
                      )}
                      aria-hidden
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </FotoPlaceholder>
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Field label="Certificación adjunta">
              <div className="flex min-h-9 flex-wrap items-center gap-2">
                {e.certificacion ? (
                  <AdjuntoChip adjunto={e.certificacion} onRemove={() => editar((en) => void (en.certificacion = null))} />
                ) : (
                  <SubirArchivo accept=".pdf" label="Adjuntar certificación (PDF)" onFile={(a) => editar((en) => void (en.certificacion = a))} />
                )}
              </div>
            </Field>
            <Field label="Fecha de entrega" htmlFor="fecha-entrega">
              <Input id="fecha-entrega" type="date" value={e.fechaEntrega ?? ''} onChange={(ev) => editar((en) => void (en.fechaEntrega = ev.target.value || null))} />
            </Field>
            <Field label="Remisión N.°" htmlFor="remision">
              <Input id="remision" value={e.remision} onChange={(ev) => editar((en) => void (en.remision = ev.target.value))} placeholder="Ej. 286" />
            </Field>
            <Field label="Garantía" htmlFor="garantia">
              <Input id="garantia" value={e.garantia} onChange={(ev) => editar((en) => void (en.garantia = ev.target.value))} placeholder="Ej. 1 año en la instalación" />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Acta de conformidad" description="Imprime el acta, haz que el cliente la firme y carga la copia firmada." actions={e.actaFirmada ? <Badge tone="ok">Firmada</Badge> : <Badge tone="warn">Pendiente de firma</Badge>} />
        <div className="space-y-4 p-5">
          <ol className="space-y-3 text-sm">
            <Paso n={1} hecho={!!e.fechaEntrega} titulo="Registrar fecha de entrega" />
            <Paso
              n={2}
              hecho={!!e.actaFirmada}
              titulo={
                <Link to={`/proyectos/${proyecto.id}/entrega/informe#acta`} className="inline-flex items-center gap-1.5 font-medium text-brand-800 hover:underline">
                  <Printer className="size-3.5" aria-hidden />
                  Imprimir acta para firma
                </Link>
              }
            />
            <Paso n={3} hecho={!!e.actaFirmada} titulo="Cargar copia firmada" />
          </ol>
          <div className="rounded-md border border-dashed border-slate-300 p-4">
            {e.actaFirmada ? (
              <div className="flex flex-wrap items-center gap-2">
                <FileSignature className="size-4 text-emerald-600" aria-hidden />
                <AdjuntoChip adjunto={e.actaFirmada} onRemove={() => editar((en) => void (en.actaFirmada = null))} />
              </div>
            ) : (
              <SubirArchivo
                accept=".pdf,image/*"
                label="Cargar acta firmada"
                onFile={(a) => {
                  editar((en) => {
                    en.actaFirmada = a
                    en.fechaEntrega ??= HOY
                  })
                  notificar('Acta de conformidad firmada cargada')
                }}
              />
            )}
          </div>
          {e.actaFirmada && proyecto.etapa < 5 && (
            <Alert tone="ok" title="Entrega completa">
              Puedes avanzar el proyecto a cierre para registrar la factura al cliente y la liquidación.
            </Alert>
          )}
        </div>
      </Card>
    </div>
  )
}

function Paso({ n, hecho, titulo }: { n: number; hecho: boolean; titulo: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn('num flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', hecho ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500')}>
        {hecho ? <Check className="size-3.5" strokeWidth={3} /> : n}
      </span>
      <span className={cn(hecho ? 'text-slate-500' : 'text-slate-800')}>{titulo}</span>
    </li>
  )
}
