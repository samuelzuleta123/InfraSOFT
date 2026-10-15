import { useState } from 'react'
import { Button, Field, Input, Modal, NumberInput, Select } from '@/components/ui'
import { precioNeto } from '@/lib/calc'
import { moneyUnit } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { CategoriaMaterial, Unidad } from '@/types'

const CATEGORIAS: CategoriaMaterial[] = ['Fibra óptica', 'Cableado', 'Canalización', 'Equipos activos', 'Inalámbrico', 'Racks y gabinetes', 'Energía']

export function NuevoMaterialModal({ onClose, onCreado, descripcionInicial = '' }: { onClose: () => void; onCreado: (id: string) => void; descripcionInicial?: string }) {
  const proveedores = useStore((s) => s.proveedores)
  const materiales = useStore((s) => s.materiales)
  const crearMaterial = useStore((s) => s.crearMaterial)
  const notificar = useStore((s) => s.notificar)
  const [m, setM] = useState({ codigo: '', descripcion: descripcionInicial, unidad: 'Un' as Unidad, categoria: 'Cableado' as CategoriaMaterial })
  const [prov, setProv] = useState('')
  const [lista, setLista] = useState<number | null>(null)
  const [dto, setDto] = useState<number | null>(null)
  const codigoRepetido = materiales.some((x) => x.codigo.toLowerCase() === m.codigo.trim().toLowerCase())
  const dtoValido = (dto ?? 0) >= 0 && (dto ?? 0) < 100
  const valido = m.codigo.trim() && m.descripcion.trim() && !codigoRepetido && (!prov || ((lista ?? 0) > 0 && dtoValido))

  const guardar = () => {
    const id = crearMaterial({ ...m, codigo: m.codigo.trim().toUpperCase(), descripcion: m.descripcion.trim() }, prov ? { proveedorId: prov, precioLista: lista ?? 0, descuentoPct: dto } : undefined)
    notificar(`Material ${m.codigo.toUpperCase()} creado`)
    onCreado(id)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo material"
      description="Se crea una sola vez y queda disponible en todas las cotizaciones."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!valido} onClick={guardar}>
            Crear material
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código" htmlFor="nm-cod" error={codigoRepetido ? 'Ya existe un material con este código.' : undefined}>
          <Input id="nm-cod" autoFocus value={m.codigo} onChange={(e) => setM({ ...m, codigo: e.target.value })} placeholder="Ej. CB-UTP6A" className="font-mono uppercase" />
        </Field>
        <Field label="Categoría" htmlFor="nm-cat">
          <Select id="nm-cat" value={m.categoria} onChange={(e) => setM({ ...m, categoria: e.target.value as CategoriaMaterial })}>
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Descripción" htmlFor="nm-desc" className="sm:col-span-2">
          <Input id="nm-desc" value={m.descripcion} onChange={(e) => setM({ ...m, descripcion: e.target.value })} />
        </Field>
        <Field label="Unidad de medida" htmlFor="nm-und">
          <Select id="nm-und" value={m.unidad} onChange={(e) => setM({ ...m, unidad: e.target.value as Unidad })}>
            <option value="Un">Unidad (Un)</option>
            <option value="Mts">Metros (Mts)</option>
          </Select>
        </Field>
      </div>
      <fieldset className="mt-5 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-[13px] font-medium text-slate-700">Primer precio de proveedor (opcional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Proveedor" htmlFor="nm-prov">
            <Select id="nm-prov" value={prov} onChange={(e) => setProv(e.target.value)}>
              <option value="">Sin precio todavía</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio de lista" htmlFor="nm-lista">
            <NumberInput id="nm-lista" value={lista} allowEmpty prefix="$" disabled={!prov} onChange={setLista} />
          </Field>
          <Field label="% descuento" htmlFor="nm-dto" error={prov && !dtoValido ? 'Entre 0 y 99 %.' : undefined}>
            <NumberInput id="nm-dto" value={dto} allowEmpty suffix="%" placeholder="0" disabled={!prov} onChange={setDto} />
          </Field>
        </div>
        {prov && (lista ?? 0) > 0 && dtoValido && (
          <p className="mt-3 text-[13px] text-slate-600">
            Precio neto: <strong className="num text-slate-900">{moneyUnit(precioNeto({ precioLista: lista ?? 0, descuentoPct: dto }))}</strong>
          </p>
        )}
      </fieldset>
    </Modal>
  )
}

export function NuevoProveedorModal({ onClose, onCreado }: { onClose: () => void; onCreado?: (id: string) => void }) {
  const crearProveedor = useStore((s) => s.crearProveedor)
  const notificar = useStore((s) => s.notificar)
  const [p, setP] = useState({ nombre: '', nit: '', ciudad: '' })
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Nuevo proveedor"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!p.nombre.trim() || !p.nit.trim()}
            onClick={() => {
              const id = crearProveedor(p)
              onCreado?.(id)
              notificar(`Proveedor ${p.nombre} creado`)
              onClose()
            }}
          >
            Crear proveedor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Razón social" htmlFor="npv-nom">
          <Input id="npv-nom" autoFocus value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
        </Field>
        <Field label="NIT" htmlFor="npv-nit">
          <Input id="npv-nit" value={p.nit} onChange={(e) => setP({ ...p, nit: e.target.value })} placeholder="000.000.000-0" />
        </Field>
        <Field label="Ciudad" htmlFor="npv-ciu">
          <Input id="npv-ciu" value={p.ciudad} onChange={(e) => setP({ ...p, ciudad: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
