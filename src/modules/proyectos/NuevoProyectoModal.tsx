import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button, Field, IconButton, Input, Modal, Select, Textarea } from '@/components/ui'
import { SubirArchivo } from '@/components/dominio'
import { cn } from '@/lib/cn'
import { HOY } from '@/lib/format'
import { useStore } from '@/store/useStore'

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
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', nit: '', direccion: '', ciudad: '' })
  const [datos, setDatos] = useState({ nombre: '', sede: '', responsable: 'Coordinación técnica Infrasoft' })
  const [lev, setLev] = useState({ fecha: HOY, rutaTuberia: '', rackOrigen: '', rackDestino: '', observaciones: '' })
  const [medidas, setMedidas] = useState([{ etiqueta: '', valor: '' }])
  const [fotos, setFotos] = useState<string[]>([])

  const clienteValido = modoCliente === 'existente' ? !!clienteId : !!nuevoCliente.nombre.trim() && !!nuevoCliente.nit.trim()
  const proyectoValido = !!datos.nombre.trim() && !!datos.sede.trim()
  const puedeSeguir = [clienteValido, proyectoValido, true][paso]

  const crear = (conLevantamiento: boolean) => {
    const cid = modoCliente === 'nuevo' ? crearCliente(nuevoCliente) : clienteId
    const medidasOk = medidas.filter((m) => m.etiqueta.trim() || m.valor.trim())
    const id = crearProyecto({
      clienteId: cid,
      ...datos,
      levantamiento: conLevantamiento ? { ...lev, responsable: datos.responsable, medidas: medidasOk } : null,
      fotos: conLevantamiento ? fotos : [],
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Razón social" htmlFor="nc-nom">
                <Input id="nc-nom" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
              </Field>
              <Field label="NIT" htmlFor="nc-nit">
                <Input id="nc-nit" value={nuevoCliente.nit} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nit: e.target.value })} placeholder="000.000.000-0" />
              </Field>
              <Field label="Dirección" htmlFor="nc-dir" optional>
                <Input id="nc-dir" value={nuevoCliente.direccion} onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
              </Field>
              <Field label="Ciudad" htmlFor="nc-ciu" optional>
                <Input id="nc-ciu" value={nuevoCliente.ciudad} onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} />
              </Field>
            </div>
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

      {paso === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Fecha de la visita" htmlFor="lv-fecha">
              <Input id="lv-fecha" type="date" value={lev.fecha} onChange={(e) => setLev({ ...lev, fecha: e.target.value })} />
            </Field>
            <Field label="Rack de origen" htmlFor="lv-orig">
              <Input id="lv-orig" value={lev.rackOrigen} onChange={(e) => setLev({ ...lev, rackOrigen: e.target.value })} />
            </Field>
            <Field label="Rack de destino" htmlFor="lv-dest">
              <Input id="lv-dest" value={lev.rackDestino} onChange={(e) => setLev({ ...lev, rackDestino: e.target.value })} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-slate-700">Medidas</legend>
            <div className="space-y-2">
              {medidas.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label={`Medida ${i + 1}`} placeholder="Ej. Distancia entre racks" value={m.etiqueta} onChange={(e) => setMedidas(medidas.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)))} />
                  <Input aria-label={`Valor ${i + 1}`} placeholder="Ej. 48 m" className="w-40" value={m.valor} onChange={(e) => setMedidas(medidas.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} />
                  <IconButton label="Quitar medida" onClick={() => setMedidas(medidas.filter((_, j) => j !== i))} disabled={medidas.length === 1} className="size-9">
                    <Trash2 />
                  </IconButton>
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" icon={<Plus />} className="mt-2" onClick={() => setMedidas([...medidas, { etiqueta: '', valor: '' }])}>
              Agregar medida
            </Button>
          </fieldset>
          <Field label="Ruta de tubería" htmlFor="lv-ruta">
            <Textarea id="lv-ruta" rows={2} value={lev.rutaTuberia} onChange={(e) => setLev({ ...lev, rutaTuberia: e.target.value })} />
          </Field>
          <Field label="Fotos del sitio">
            <div className="flex flex-wrap items-center gap-2">
              {fotos.map((f, i) => (
                <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {f}
                </span>
              ))}
              <SubirArchivo accept="image/*" multiple label="Agregar fotos" onFile={(a) => setFotos((x) => [...x, a.nombre.replace(/\.[^.]+$/, '')])} />
            </div>
          </Field>
        </div>
      )}
    </Modal>
  )
}
