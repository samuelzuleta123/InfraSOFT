import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { nombreEtapa } from '@/components/dominio'
import { todosLosItems, versionVigente } from '@/lib/calc'
import { materialesIncompletos } from '@/lib/compras'
import { cn } from '@/lib/cn'
import { useStore } from '@/store/useStore'
import type { Etapa, Proyecto } from '@/types'

export interface Chequeo {
  texto: string
  ok: boolean
  /** Si no se cumple, impide avanzar. */
  bloquea?: boolean
  /** Qué hacer para cumplirlo y por qué se pide. */
  ayuda: string
  /** Pestaña del proyecto donde se resuelve. */
  tab: 'cotizacion' | 'compras' | 'ejecucion' | 'entrega' | 'cierre'
}

/** Lo que debería estar listo antes de entrar a cada etapa. */
export function chequeosEtapa(p: Proyecto, destino: Etapa, ocsProyecto: number): Chequeo[] {
  const v = versionVigente(p)
  const aprobada = p.cotizacion.versiones.some((x) => x.estado === 'aprobada')
  const items = todosLosItems(v)
  const registrados = items.filter((i) => i.cantInstalada !== null).length
  const incompletos = materialesIncompletos(v)
  switch (destino) {
    case 2:
      return [
        {
          texto: `Materiales con proveedor y precio${incompletos.total ? ` (${incompletos.resumen})` : ''}`,
          ok: incompletos.total === 0,
          bloquea: true,
          ayuda: 'Sin proveedor ni precio no se pueden generar las órdenes de compra, y después de enviarla la cotización ya no se edita. Complétalos en las columnas Proveedor y Costo unitario.',
          tab: 'cotizacion',
        },
        {
          texto: 'Cotización enviada al cliente',
          ok: p.cotizacion.versiones.some((x) => x.estado !== 'borrador'),
          bloquea: true,
          ayuda: 'Sin una propuesta enviada no hay nada que aprobar. Márcala como enviada en Compras › Estado de la cotización.',
          tab: 'compras',
        },
      ]
    case 3:
      return [
        {
          texto: 'Cotización aprobada por el cliente',
          ok: aprobada,
          bloquea: true,
          ayuda: 'No se ejecuta una obra que el cliente no ha aprobado. Registra la aprobación en Compras › Estado de la cotización.',
          tab: 'compras',
        },
        { texto: 'OC del cliente registrada', ok: !!p.ocCliente, ayuda: 'Es el respaldo del pedido y del valor a facturar. Regístrala en Compras.', tab: 'compras' },
        { texto: 'Órdenes de compra a proveedores generadas', ok: ocsProyecto > 0, ayuda: 'Sin ellas no llegan los materiales a la obra. Genéralas en Compras.', tab: 'compras' },
      ]
    case 4:
      return [
        {
          texto: `Cantidades instaladas registradas (${registrados} de ${items.length} ítems)`,
          ok: registrados === items.length,
          ayuda: 'La liquidación compara lo instalado con lo cotizado. Regístralas en Ejecución.',
          tab: 'ejecucion',
        },
        { texto: 'Seriales de equipos registrados', ok: p.seriales.length > 0, ayuda: 'Van en la remisión y respaldan la garantía. Regístralos en Ejecución.', tab: 'ejecucion' },
      ]
    case 5:
      return [
        {
          texto: 'Acta de conformidad firmada cargada',
          ok: !!p.entrega.actaFirmada,
          bloquea: true,
          ayuda: 'Es la prueba de que el cliente recibió a satisfacción; sin ella no se cierra ni se factura. Cárgala en Entrega.',
          tab: 'entrega',
        },
        { texto: 'Fecha de entrega registrada', ok: !!p.entrega.fechaEntrega, ayuda: 'Desde esa fecha corre la garantía. Regístrala en Entrega.', tab: 'entrega' },
        { texto: 'Remisión registrada', ok: !!p.entrega.remision, ayuda: 'Soporta qué equipos y materiales se entregaron. Regístrala en Entrega.', tab: 'entrega' },
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
                {!c.ok && <span className="mt-0.5 block text-xs text-slate-500">{c.ayuda}</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-slate-500">Después de avanzar tendrás unos segundos para deshacer el cambio.</p>
    </Modal>
  )
}
