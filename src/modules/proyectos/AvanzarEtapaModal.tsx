import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { nombreEtapa } from '@/components/dominio'
import { todosLosItems, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { useStore } from '@/store/useStore'
import type { Etapa, Proyecto } from '@/types'

interface Chequeo {
  texto: string
  ok: boolean
  /** Si no se cumple, impide avanzar. */
  bloquea?: boolean
}

/** Lo que debería estar listo antes de entrar a cada etapa. */
export function chequeosEtapa(p: Proyecto, destino: Etapa, ocsProyecto: number): Chequeo[] {
  const v = versionVigente(p)
  const aprobada = p.cotizacion.versiones.some((x) => x.estado === 'aprobada')
  const items = todosLosItems(v)
  const registrados = items.filter((i) => i.cantInstalada !== null).length
  switch (destino) {
    case 2:
      return [{ texto: 'Cotización enviada al cliente', ok: p.cotizacion.versiones.some((x) => x.estado !== 'borrador') }]
    case 3:
      return [
        { texto: 'Cotización aprobada por el cliente', ok: aprobada, bloquea: true },
        { texto: 'OC del cliente registrada', ok: !!p.ocCliente },
        { texto: 'Órdenes de compra a proveedores generadas', ok: ocsProyecto > 0 },
      ]
    case 4:
      return [
        { texto: `Cantidades instaladas registradas (${registrados} de ${items.length} ítems)`, ok: registrados === items.length },
        { texto: 'Seriales de equipos registrados', ok: p.seriales.length > 0 },
      ]
    case 5:
      return [
        { texto: 'Acta de conformidad firmada cargada', ok: !!p.entrega.actaFirmada, bloquea: true },
        { texto: 'Fecha de entrega registrada', ok: !!p.entrega.fechaEntrega },
        { texto: 'Remisión registrada', ok: !!p.entrega.remision },
      ]
    default:
      return []
  }
}

export function AvanzarEtapaModal({ proyecto, destino, onClose, onAvanzado }: { proyecto: Proyecto; destino: Etapa; onClose: () => void; onAvanzado: () => void }) {
  const ordenes = useStore((s) => s.ordenes)
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const chequeos = chequeosEtapa(proyecto, destino, ordenes.filter((o) => o.proyectoId === proyecto.id).length)
  const bloqueado = chequeos.some((c) => c.bloquea && !c.ok)
  const pendientes = chequeos.filter((c) => !c.ok).length

  const avanzar = () => {
    const anterior = proyecto.etapa
    editarProyecto(proyecto.id, (p) => void (p.etapa = destino))
    notificar(`${proyecto.codigo} pasó a ${nombreEtapa(destino).toLowerCase()}`, 'ok', () => editarProyecto(proyecto.id, (p) => void (p.etapa = anterior)))
    onAvanzado()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Pasar a ${nombreEtapa(destino).toLowerCase()}`}
      description={bloqueado ? 'Falta un requisito obligatorio.' : pendientes ? 'Puedes avanzar, pero hay pendientes.' : 'Todo listo para avanzar.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={bloqueado} onClick={avanzar}>
            {pendientes && !bloqueado ? 'Avanzar con pendientes' : 'Avanzar'}
          </Button>
        </>
      }
    >
      <ul className="space-y-2.5">
        {chequeos.map((c) => {
          const Icono = c.ok ? CheckCircle2 : c.bloquea ? XCircle : CircleAlert
          return (
            <li key={c.texto} className="flex items-start gap-2.5 text-sm">
              <Icono className={cn('mt-0.5 size-4 shrink-0', c.ok ? 'text-brand-700' : c.bloquea ? 'text-red-700' : 'text-amber-600')} aria-hidden />
              <span className={cn(c.ok ? 'text-slate-700' : 'text-slate-900')}>
                {c.texto}
                <span className="sr-only">{c.ok ? ': listo' : c.bloquea ? ': obligatorio, pendiente' : ': pendiente'}</span>
                {!c.ok && c.bloquea && <span className="ml-1.5 text-xs font-medium text-red-700">Obligatorio</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-slate-500">Después de avanzar tendrás unos segundos para deshacer el cambio.</p>
    </Modal>
  )
}
