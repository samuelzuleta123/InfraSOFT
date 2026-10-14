import { useState } from 'react'
import { ArrowRight, ClipboardList, Pencil, Plus, Server } from 'lucide-react'
import { Button, Card, CardHeader, DL, EmptyState, Modal } from '@/components/ui'
import { FechaTexto, FotoPlaceholder } from '@/components/dominio'
import { HOY, uid } from '@/lib/format'
import type { Proyecto } from '@/types'
import { useStore } from '@/store/useStore'
import { aLevantamiento, FormLevantamiento, levantamientoVacio, type DatosLevantamiento } from './FormLevantamiento'

export function LevantamientoTab({ proyecto }: { proyecto: Proyecto }) {
  const l = proyecto.levantamiento
  const abrir = useStore((s) => s.abrirVisor)
  const [editando, setEditando] = useState(false)
  const modal = editando && <EditarLevantamientoModal proyecto={proyecto} onClose={() => setEditando(false)} />
  if (!l)
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList />}
          title="Sin levantamiento registrado"
          description="Registra las medidas, la ruta y las fotos de la visita técnica antes de cotizar."
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => setEditando(true)}>
              Registrar levantamiento
            </Button>
          }
        />
        {modal}
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
            actions={
              <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => setEditando(true)}>
                Editar
              </Button>
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
              <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-slate-500 sm:rotate-0" aria-hidden />
              <RackBox titulo="Rack de destino" texto={l.rackDestino} />
            </div>
            {l.rutaTuberia && (
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Ruta de tubería</h3>
                <p className="mt-1.5 max-w-prose leading-relaxed text-slate-700">{l.rutaTuberia}</p>
              </div>
            )}
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
        <CardHeader title="Fotos del levantamiento" description={`${fotos.length} foto${fotos.length === 1 ? '' : 's'}`} />
        {fotos.length === 0 && <p className="p-5 text-sm text-slate-500">Sin fotos. Agrégalas con Editar.</p>}
        <div className="grid grid-cols-2 gap-3 p-5 empty:hidden">
          {fotos.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => abrir({ adjunto: { nombre: `${f.titulo}.jpg`, tipo: 'img' }, contexto: { tipo: 'foto', titulo: f.titulo, tono: f.tono, url: f.url } })}
              className="rounded-md transition-shadow hover:ring-2 hover:ring-brand-500/60"
              aria-label={`Ver foto: ${f.titulo}`}
            >
              <FotoPlaceholder foto={f} />
            </button>
          ))}
        </div>
      </Card>
      {modal}
    </div>
  )
}

function EditarLevantamientoModal({ proyecto, onClose }: { proyecto: Proyecto; onClose: () => void }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const l = proyecto.levantamiento
  const [datos, setDatos] = useState<DatosLevantamiento>(() =>
    l ? { fecha: l.fecha, medidas: l.medidas.length ? l.medidas : [{ etiqueta: '', valor: '' }], rutaTuberia: l.rutaTuberia, rackOrigen: l.rackOrigen, rackDestino: l.rackDestino, observaciones: l.observaciones, fotosNuevas: [], fotosQuitadas: [] } : levantamientoVacio(HOY),
  )
  const fotosExistentes = proyecto.fotos.filter((f) => f.etapa === 'levantamiento')

  const guardar = () => {
    editarProyecto(proyecto.id, (p) => {
      p.levantamiento = aLevantamiento(datos, p.levantamiento?.responsable ?? p.responsable)
      // Una foto quitada tampoco puede quedar elegida para el informe de entrega.
      p.fotos = p.fotos.filter((f) => !datos.fotosQuitadas.includes(f.id))
      p.entrega.fotosSeleccionadas = p.entrega.fotosSeleccionadas.filter((id) => !datos.fotosQuitadas.includes(id))
      p.fotos.push(...datos.fotosNuevas.map((titulo, i) => ({ id: uid('f'), titulo, etapa: 'levantamiento' as const, tono: [210, 30, 160, 200][(fotosExistentes.length + i) % 4] })))
    })
    notificar(l ? 'Levantamiento actualizado' : 'Levantamiento registrado')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={l ? 'Editar levantamiento' : 'Registrar levantamiento'}
      description="Medidas, recorrido y fotos de la visita técnica."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar}>
            Guardar
          </Button>
        </>
      }
    >
      <FormLevantamiento datos={datos} onChange={setDatos} fotosExistentes={fotosExistentes} />
    </Modal>
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
