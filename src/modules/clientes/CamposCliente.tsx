import { useState } from 'react'
import { Button, Field, Input, Modal } from '@/components/ui'
import { useStore } from '@/store/useStore'
import type { Cliente } from '@/types'

export type DatosCliente = Omit<Cliente, 'id'>

export const clienteVacio: DatosCliente = { nombre: '', nit: '', direccion: '', ciudad: '', contacto: '', telefono: '', correo: '' }

/** Vacío vale: el correo es opcional. Si se escribe, debe tener forma de correo. */
export const correoValido = (correo?: string) => !correo?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())

export const clienteValido = (c: DatosCliente) => Boolean(c.nombre.trim() && c.nit.trim() && correoValido(c.correo))

/** Campos del cliente: empresa arriba, contacto abajo. Se usan al crear y al editar, aquí y en "Nuevo proyecto". */
export function CamposCliente({ valor, onChange, prefijo }: { valor: DatosCliente; onChange: (c: DatosCliente) => void; prefijo: string }) {
  const [correoTocado, setCorreoTocado] = useState(false)
  const campo = (k: keyof DatosCliente) => ({
    id: `${prefijo}-${k}`,
    value: valor[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...valor, [k]: e.target.value }),
  })
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Razón social" htmlFor={`${prefijo}-nombre`} className="sm:col-span-2">
          <Input {...campo('nombre')} autoFocus />
        </Field>
        <Field label="NIT" htmlFor={`${prefijo}-nit`}>
          <Input {...campo('nit')} placeholder="000.000.000-0" />
        </Field>
        <Field label="Ciudad" htmlFor={`${prefijo}-ciudad`} optional>
          <Input {...campo('ciudad')} />
        </Field>
        <Field label="Dirección" htmlFor={`${prefijo}-direccion`} optional className="sm:col-span-2">
          <Input {...campo('direccion')} />
        </Field>
      </div>
      <fieldset className="m-0 border-0 border-t border-slate-200 p-0 pt-4">
        <legend className="pr-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Contacto</legend>
        <div className="mt-1 grid gap-4 sm:grid-cols-2">
          <Field label="Persona de contacto" htmlFor={`${prefijo}-contacto`} optional className="sm:col-span-2">
            <Input {...campo('contacto')} placeholder="Nombre y cargo" autoComplete="off" />
          </Field>
          <Field label="Teléfono" htmlFor={`${prefijo}-telefono`} optional>
            <Input {...campo('telefono')} type="tel" inputMode="tel" placeholder="300 000 0000" autoComplete="off" />
          </Field>
          <Field
            label="Correo electrónico"
            htmlFor={`${prefijo}-correo`}
            optional
            error={correoTocado && !correoValido(valor.correo) ? 'Revisa el correo: debe quedar como nombre@empresa.com' : undefined}
          >
            <Input {...campo('correo')} type="email" inputMode="email" placeholder="nombre@empresa.com" autoComplete="off" onBlur={() => setCorreoTocado(true)} />
          </Field>
        </div>
      </fieldset>
    </div>
  )
}

/** Crear un cliente o editar los datos de uno existente. */
export function ClienteModal({ cliente, onClose, onGuardado }: { cliente?: Cliente; onClose: () => void; onGuardado?: (id: string) => void }) {
  const crearCliente = useStore((s) => s.crearCliente)
  const editarCliente = useStore((s) => s.editarCliente)
  const notificar = useStore((s) => s.notificar)
  const [c, setC] = useState<DatosCliente>(() => ({ ...clienteVacio, ...cliente }))

  const guardar = () => {
    const id = cliente ? cliente.id : crearCliente(c)
    if (cliente) editarCliente(cliente.id, c)
    notificar(cliente ? `Datos de ${c.nombre.trim()} actualizados` : `Cliente ${c.nombre.trim()} creado`)
    onClose()
    onGuardado?.(id)
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!clienteValido(c)} onClick={guardar}>
            {cliente ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </>
      }
    >
      <CamposCliente valor={c} onChange={setC} prefijo={cliente ? 'ecl' : 'ncl'} />
    </Modal>
  )
}
