import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Pencil, Plus, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Modal, NumberInput, Select } from '@/components/ui'
import { KitModal } from '@/modules/catalogo/Kits'
import { precioNeto } from '@/lib/calc'
import { moneyUnit, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { ItemCotizacion, Material, PrecioProveedor } from '@/types'

/** Si el material tiene un único proveedor en catálogo, se asigna y se carga su precio neto. */
function itemDesdeMaterial(m: Material, precios: PrecioProveedor[], cantidad = 1, vuMO = 0): ItemCotizacion {
  const delMaterial = precios.filter((p) => p.materialId === m.id)
  const unico = delMaterial.length === 1 ? delMaterial[0] : null
  return {
    id: uid('it'),
    materialId: m.id,
    tipo: 'material',
    descripcion: m.descripcion,
    unidad: m.unidad,
    cantidad,
    vuMO,
    vuMaterial: unico ? precioNeto(unico) : 0,
    proveedorId: unico?.proveedorId ?? null,
    cantInstalada: null,
  }
}

export function AgregarItemModal({ open, onClose, proyectoId, seccionId }: { open: boolean; onClose: () => void; proyectoId: string; seccionId: string | null }) {
  const { materiales, precios, editarVersion, notificar } = useStore()
  const [q, setQ] = useState('')
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return materiales.filter((m) => !t || m.descripcion.toLowerCase().includes(t) || m.codigo.toLowerCase().includes(t))
  }, [q, materiales])

  const agregar = (item: ItemCotizacion) => {
    editarVersion(proyectoId, (v) => {
      const s = v.secciones.find((x) => x.id === seccionId) ?? v.secciones[0]
      s?.items.push(item)
    })
    notificar(`Ítem agregado: ${item.descripcion || 'ítem libre'}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Agregar ítem desde el catálogo"
      description="Si el material tiene un solo proveedor, su precio neto se carga automáticamente."
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Plus />}
            onClick={() => {
              agregar({ id: uid('it'), tipo: 'mo', descripcion: 'Nuevo ítem (solo mano de obra)', unidad: 'Un', cantidad: 1, vuMO: 0, vuMaterial: 0, proveedorId: null, cantInstalada: null })
              onClose()
            }}
          >
            Ítem libre sin catálogo
          </Button>
          <Button variant="primary" onClick={onClose}>
            Listo
          </Button>
        </>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código o descripción…"
          aria-label="Buscar material"
          className="h-10 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm focus:border-brand-700 focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
        />
      </div>
      <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
        {lista.map((m) => {
          const pm = precios.filter((p) => p.materialId === m.id)
          const mejor = pm.length ? Math.min(...pm.map(precioNeto)) : null
          return (
            <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{m.descripcion}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                  <span className="font-mono">{m.codigo}</span>
                  <span>{m.unidad}</span>
                  <span>
                    {pm.length} proveedor{pm.length === 1 ? '' : 'es'}
                    {mejor !== null && <> · desde <span className="num font-medium text-slate-700">{moneyUnit(mejor)}</span></>}
                  </span>
                </div>
              </div>
              <Button size="sm" icon={<Plus />} onClick={() => agregar(itemDesdeMaterial(m, precios))}>
                Agregar
              </Button>
            </li>
          )
        })}
        {lista.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">Ningún material coincide con “{q}”.</li>}
      </ul>
    </Modal>
  )
}

export function AgregarKitModal({ open, onClose, proyectoId, seccionId }: { open: boolean; onClose: () => void; proyectoId: string; seccionId: string | null }) {
  const { kits, materiales, precios, editarVersion, notificar } = useStore()
  const [kitId, setKitId] = useState(kits[0]?.id ?? '')
  const [puntos, setPuntos] = useState<number | null>(1)
  const [destino, setDestino] = useState<'actual' | 'nueva'>('nueva')
  const [editor, setEditor] = useState<'nuevo' | 'editar' | null>(null)
  const kit = kits.find((k) => k.id === kitId) ?? kits[0]
  const n = puntos ?? 0

  const items = (kit?.items ?? []).map((ki) => {
    const m = materiales.find((x) => x.id === ki.materialId)
    const base = m
      ? itemDesdeMaterial(m, precios, ki.cantidad * n, ki.vuMO)
      : { id: uid('it'), descripcion: ki.descripcion, unidad: ki.unidad, tipo: 'mo' as const, cantidad: ki.cantidad * n, vuMO: ki.vuMO, vuMaterial: 0, proveedorId: null, cantInstalada: null }
    return { ...base, descripcion: ki.descripcion }
  })

  const confirmar = () => {
    if (!kit || n <= 0) return
    editarVersion(proyectoId, (v) => {
      if (destino === 'nueva' || !seccionId) v.secciones.push({ id: uid('sec'), nombre: `${kit.nombre} (${n})`, items })
      else v.secciones.find((s) => s.id === seccionId)?.items.push(...items)
    })
    notificar(`Kit “${kit.nombre}” × ${n} agregado`)
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="Agregar kit"
        description="Un kit es un grupo de ítems predefinido. Las cantidades se multiplican por el número de unidades."
        footer={
          <>
            <Link to="/catalogo?tab=kits" className="mr-auto self-center text-[13px] font-medium text-brand-800 hover:text-brand-900 hover:underline">
              Administrar kits en el catálogo
            </Link>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmar} disabled={!kit || n <= 0}>
              Agregar {items.length} ítems
            </Button>
          </>
        }
      >
        {kits.length === 0 ? (
          <EmptyState
            icon={<Boxes />}
            title="Todavía no hay kits"
            description="Un kit agrupa los materiales y la mano de obra que siempre van juntos. Créalo una vez y úsalo en cualquier cotización."
            action={
              <Button variant="subtle" icon={<Plus />} onClick={() => setEditor('nuevo')}>
                Crear kit
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Kit" htmlFor="kit">
                <Select id="kit" value={kit?.id ?? ''} onChange={(e) => setKitId(e.target.value)}>
                  {kits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cantidad de puntos" htmlFor="puntos">
                <NumberInput id="puntos" value={puntos} onChange={setPuntos} allowEmpty decimals={0} />
              </Field>
              <Field label="Agregar en" htmlFor="destino">
                <Select id="destino" value={destino} onChange={(e) => setDestino(e.target.value as 'actual' | 'nueva')}>
                  <option value="nueva">Nueva sección</option>
                  <option value="actual" disabled={!seccionId}>
                    Sección actual
                  </option>
                </Select>
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <p className="min-w-0 flex-1 text-[13px] text-slate-500">{kit?.descripcion}</p>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => setEditor('editar')}>
                  Editar kit
                </Button>
                <Button size="sm" variant="ghost" icon={<Plus />} onClick={() => setEditor('nuevo')}>
                  Nuevo kit
                </Button>
              </div>
            </div>
            <table className="mt-3 w-full text-[13px]">
              <thead className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2 text-left">Ítem</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 pl-3 text-right">V. unit. MO</th>
                  <th className="py-2 pl-3 text-left">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 text-slate-900">{i.descripcion}</td>
                    <td className="num py-2 text-right">
                      {i.cantidad.toLocaleString('es-CO')} {i.unidad}
                    </td>
                    <td className="num py-2 pl-3 text-right">{moneyUnit(i.vuMO)}</td>
                    <td className="py-2 pl-3">{i.proveedorId ? <Badge tone="ok">Precio cargado</Badge> : i.materialId ? <Badge tone="warn">Elegir en tabla</Badge> : <Badge>Solo mano de obra</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>
      {open && editor && <KitModal kit={editor === 'editar' ? kit : undefined} onClose={() => setEditor(null)} onGuardado={setKitId} />}
    </>
  )
}
