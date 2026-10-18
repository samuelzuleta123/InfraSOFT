import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import { HOY } from '@/lib/format'
import { useStore } from '@/store/useStore'
import { CamposCliente, clienteValido as datosClienteValidos, clienteVacio, type DatosCliente } from '@/modules/clientes/CamposCliente'
import { aLevantamiento, FormLevantamiento, levantamientoVacio } from './FormLevantamiento'

const PASOS = ['Cliente', 'Proyecto', 'Levantamiento'] as const

/** Registro de un proyecto nuevo: queda en etapa 1 con la cotización v1 en borrador. */
export function NuevoProyectoModal({ onClose, clienteInicial }: { onClose: () => void; clienteInicial?: string }) {
  const clientes = useStore((s) => s.clientes)
  const crearCliente = useStore((s) => s.crearCliente)
  const crearProyecto = useStore((s) => s.crearProyecto)
  const notificar = useStore((s) => s.notificar)
  const nav = useNavigate()
  const [paso, setPaso] = useState(0)

  const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo'>('existente')
  const [clienteId, setClienteId] = useState(clienteInicial ?? '')
  const [nuevoCliente, setNuevoCliente] = useState<DatosCliente>(clienteVacio)
  const [datos, setDatos] = useState({ nombre: '', sede: '', responsable: 'Coordinación técnica Infrasoft' })
  const [lev, setLev] = useState(() => levantamientoVacio(HOY))

  const clienteValido = modoCliente === 'existente' ? !!clienteId : datosClienteValidos(nuevoCliente)
  const proyectoValido = !!datos.nombre.trim() && !!datos.sede.trim()
  const puedeSeguir = [clienteValido, proyectoValido, true][paso]

  const crear = (conLevantamiento: boolean) => {
    const cid = modoCliente === 'nuevo' ? crearCliente(nuevoCliente) : clienteId
    const id = crearProyecto({
      clienteId: cid,
      ...datos,
      levantamiento: conLevantamiento ? aLevantamiento(lev, datos.responsable) : null,
      fotos: conLevantamiento ? lev.fotosNuevas : [],
    })
    notificar(`Proyecto “${datos.nombre}” creado. Sigue con la cotización.`)
    onClose()
    nav(`/proyectos/${id}/cotizacion`)
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Nuevo proyecto"
      description="Queda en la etapa de cotización con la versión v1 en borrador."
      footer={
        <>
          {paso > 0 && (
            <Button variant="ghost" className="mr-auto" onClick={() => setPaso(paso - 1)}>
              Atrás
            </Button>
          )}
          {paso < 2 ? (
            <Button variant="primary" disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>
              Siguiente
            </Button>
          ) : (
            <>
              <Button onClick={() => crear(false)}>Crear sin levantamiento</Button>
              <Button variant="primary" icon={<Check />} onClick={() => crear(true)}>
                Crear proyecto
              </Button>
            </>
          )}
        </>
      }
    >
      <ol className="mb-6 flex items-center" aria-label="Pasos">
        {PASOS.map((p, i) => (
          <li key={p} className={cn('flex items-center', i < PASOS.length - 1 && 'flex-1')}>
            <span className={cn('num flex size-7 items-center justify-center rounded-full text-xs font-semibold', i < paso ? 'bg-brand-700 text-white' : i === paso ? 'bg-white text-brand-800 ring-2 ring-brand-700' : 'bg-slate-100 text-slate-500')}>
              {i < paso ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('ml-2 text-[13px] font-medium', i === paso ? 'text-slate-900' : 'text-slate-500')}>{p}</span>
            {i < PASOS.length - 1 && <span className={cn('mx-3 h-px flex-1', i < paso ? 'bg-brand-700' : 'bg-slate-200')} aria-hidden />}
          </li>
        ))}
      </ol>

      {paso === 0 && (
        <div className="space-y-4">
          <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5 text-[13px] font-medium" role="radiogroup" aria-label="Tipo de cliente">
            {(['existente', 'nuevo'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={modoCliente === m} onClick={() => setModoCliente(m)} className={cn('rounded-[5px] px-3 py-1', modoCliente === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
                {m === 'existente' ? 'Cliente existente' : 'Cliente nuevo'}
              </button>
            ))}
          </div>
          {modoCliente === 'existente' ? (
            <Field label="Cliente" htmlFor="np-cli">
              <Select id="np-cli" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecciona un cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} · NIT {c.nit}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <CamposCliente valor={nuevoCliente} onChange={setNuevoCliente} prefijo="nc" />
          )}
        </div>
      )}

      {paso === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del proyecto" htmlFor="np-nom" className="sm:col-span-2">
            <Input id="np-nom" autoFocus value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} placeholder="Ej. Cableado estructurado 24 puntos – Oficinas" />
          </Field>
          <Field label="Sede o sitio" htmlFor="np-sede">
            <Input id="np-sede" value={datos.sede} onChange={(e) => setDatos({ ...datos, sede: e.target.value })} placeholder="Ej. Planta principal · Bodega 2" />
          </Field>
          <Field label="Responsable" htmlFor="np-resp">
            <Input id="np-resp" value={datos.responsable} onChange={(e) => setDatos({ ...datos, responsable: e.target.value })} />
          </Field>
        </div>
      )}

      {paso === 2 && <FormLevantamiento datos={lev} onChange={setLev} />}
    </Modal>
  )
}
