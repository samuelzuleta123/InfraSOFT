import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileSignature, FileText, ImagePlus, Printer, Truck, X } from 'lucide-react'
import { Alert, Badge, Card, CardHeader, Field, Input, Textarea } from '@/components/ui'
import { AdjuntoChip, FotoPlaceholder, SubirArchivo } from '@/components/dominio'
import { cn } from '@/lib/cn'
import { HOY, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'

/** Número de una remisión para comparar y ordenar: solo los dígitos ("No. 286" → 286). */
const numeroRemision = (r: string) => Number(r.replace(/\D/g, '')) || 0

export function EntregaTab({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const e = proyecto.entrega
  const editar = (fn: (en: Proyecto['entrega']) => void) => editarProyecto(proyecto.id, (p) => fn(p.entrega))
  const seleccionadas = new Set(e.fotosSeleccionadas)
  const inputFotos = useRef<HTMLInputElement>(null)
  // Las fotos del trabajo terminado se suben aquí y quedan marcadas para el informe.
  const agregarFotos = (archivos: File[]) =>
    editarProyecto(proyecto.id, (p) => {
      for (const f of archivos) {
        const id = uid('f')
        p.fotos.push({ id, titulo: f.name.replace(/\.[^.]+$/, ''), etapa: 'entrega', tono: 150, url: URL.createObjectURL(f) })
        p.entrega.fotosSeleccionadas.push(id)
      }
    })
  const quitarFoto = (id: string) =>
    editarProyecto(proyecto.id, (p) => {
      p.fotos = p.fotos.filter((f) => f.id !== id)
      p.entrega.fotosSeleccionadas = p.entrega.fotosSeleccionadas.filter((x) => x !== id)
    })
  const proyectos = useStore((s) => s.proyectos)
  const otros = proyectos.filter((p) => p.id !== proyecto.id && p.entrega.remision.trim())
  // Sugerencia: el consecutivo sigue al mayor registrado en cualquier proyecto; se puede cambiar si el talonario va en otro número.
  const ultima = Math.max(0, ...otros.map((p) => numeroRemision(p.entrega.remision)))
  const sugerida = ultima ? String(ultima + 1) : ''
  const repetida = e.remision.trim() ? otros.find((p) => numeroRemision(p.entrega.remision) === numeroRemision(e.remision) && numeroRemision(e.remision) > 0) : undefined
  // Las fechas arrancan en hoy y quedan guardadas, para que lo que se ve sea lo que sale en los documentos; se pueden cambiar, también a futuro.
  // Solo al abrir la pestaña: si se borra el número a propósito o para escribir otro, no se vuelve a llenar.
  const precargado = useRef('')
  useEffect(() => {
    if (precargado.current === proyecto.id) return
    precargado.current = proyecto.id
    editarProyecto(proyecto.id, (p) => {
      p.entrega.fechaEntrega ??= HOY
      p.entrega.fechaRemision ??= HOY
      if (!p.entrega.remision) p.entrega.remision = sugerida
      p.entrega.trabajosRealizados ??= p.cotizacion.alcance
    })
  }, [proyecto.id, sugerida, editarProyecto])

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader
          title="Informe de entrega"
          description="Sube las fotos del trabajo terminado, elige cuáles van en el informe y adjunta la certificación."
          actions={
            <>
              <Link
                to={`/proyectos/${proyecto.id}/entrega/remision`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                <Truck className="size-4" aria-hidden />
                Generar remisión
              </Link>
              <Link
                to={`/proyectos/${proyecto.id}/entrega/informe`}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-800 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
              >
                <FileText className="size-4" aria-hidden />
                Generar informe
              </Link>
            </>
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
                <div key={f.id} className="relative">
                  <button
                    type="button"
                    aria-pressed={sel}
                    onClick={() => editar((en) => void (en.fotosSeleccionadas = sel ? en.fotosSeleccionadas.filter((x) => x !== f.id) : [...en.fotosSeleccionadas, f.id]))}
                    className={cn('block w-full rounded-md text-left ring-offset-2 transition-shadow', sel ? 'ring-2 ring-brand-600' : 'hover:ring-2 hover:ring-slate-300')}
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
                  {f.etapa === 'entrega' && (
                    <button
                      type="button"
                      onClick={() => quitarFoto(f.id)}
                      aria-label={`Quitar foto ${f.titulo}`}
                      className="absolute top-2 left-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            <input
              ref={inputFotos}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(ev) => {
                agregarFotos(Array.from(ev.target.files ?? []))
                ev.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => inputFotos.current?.click()}
              className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-slate-300 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
            >
              <ImagePlus className="size-5" aria-hidden />
              Agregar fotos
              <span className="text-xs font-normal text-slate-500">Del trabajo terminado</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Field
              label="Trabajos realizados"
              htmlFor="trabajos"
              className="sm:col-span-2"
              hint={
                (e.trabajosRealizados ?? proyecto.cotizacion.alcance) !== proyecto.cotizacion.alcance ? (
                  <>
                    Ajustado frente al alcance cotizado.{' '}
                    <button type="button" onClick={() => editar((en) => void (en.trabajosRealizados = proyecto.cotizacion.alcance))} className="cursor-pointer font-medium text-brand-800 underline-offset-2 hover:underline">
                      Volver al alcance cotizado
                    </button>
                  </>
                ) : (
                  'Arranca con el alcance de la cotización; ajústalo si en obra cambió algo. Va en el informe y en el acta.'
                )
              }
            >
              <Textarea
                id="trabajos"
                value={e.trabajosRealizados ?? proyecto.cotizacion.alcance}
                onChange={(ev) => editar((en) => void (en.trabajosRealizados = ev.target.value))}
                className="min-h-20"
              />
            </Field>
            <Field label="Certificación adjunta">
              <div className="flex min-h-9 flex-wrap items-center gap-2">
                {e.certificacion ? (
                  <AdjuntoChip adjunto={e.certificacion} contexto={{ tipo: 'certificacion', proyectoId: proyecto.id }} onRemove={() => editar((en) => void (en.certificacion = null))} />
                ) : (
                  <SubirArchivo accept=".pdf" label="Adjuntar certificación (PDF)" onFile={(a) => editar((en) => void (en.certificacion = a))} />
                )}
              </div>
            </Field>
            <Field label="Fecha de entrega" htmlFor="fecha-entrega" hint="Hoy por defecto; cámbiala si la entrega es otro día. Desde aquí corre la garantía.">
              <Input id="fecha-entrega" type="date" value={e.fechaEntrega ?? HOY} onChange={(ev) => editar((en) => void (en.fechaEntrega = ev.target.value || HOY))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Remisión N.°"
                htmlFor="remision"
                error={repetida && `Ya se usó en ${repetida.codigo}`}
                hint={ultima ? `Sigue a la ${ultima}; cámbiala si el talonario va en otro número.` : undefined}
              >
                <Input id="remision" value={e.remision} onChange={(ev) => editar((en) => void (en.remision = ev.target.value))} placeholder="Ej. 286" />
              </Field>
              <Field label="Fecha de remisión" htmlFor="fecha-remision">
                <Input id="fecha-remision" type="date" value={e.fechaRemision ?? HOY} onChange={(ev) => editar((en) => void (en.fechaRemision = ev.target.value || HOY))} />
              </Field>
            </div>
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
                <Link to={`/proyectos/${proyecto.id}/entrega/acta`} className="inline-flex items-center gap-1.5 font-medium text-brand-800 hover:underline">
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
                <AdjuntoChip adjunto={e.actaFirmada} contexto={{ tipo: 'acta', proyectoId: proyecto.id }} onRemove={() => editar((en) => void (en.actaFirmada = null))} />
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
