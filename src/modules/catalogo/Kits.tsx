import { useState } from 'react'
import { Boxes, ChevronRight, Hammer, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal, NumberInput, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { money, r3, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { CategoriaMaterial, Kit, KitItem, Unidad } from '@/types'

const thc = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'

/** Mano de obra de una unidad del kit: lo que suma cada vez que se agrega un punto. */
const moPorUnidad = (k: Pick<Kit, 'items'>) => k.items.reduce((a, i) => a + Math.round(i.cantidad * i.vuMO), 0)

export function TablaKits() {
  const kits = useStore((s) => s.kits)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const kit = kits.find((k) => k.id === abierto)

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <span className="text-[13px] text-slate-500">Grupos de ítems que se agregan juntos al cotizar, multiplicados por la cantidad de puntos.</span>
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo kit
          </Button>
        </div>
        {kits.length === 0 ? (
          <EmptyState
            icon={<Boxes />}
            title="Todavía no hay kits"
            description="Crea uno con los materiales y la mano de obra que siempre van juntos, como un punto de red."
            action={
              <Button variant="subtle" icon={<Plus />} onClick={() => setNuevo(true)}>
                Crear el primer kit
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className={thc}>Kit</th>
                  <th className={cn(thc, 'text-right')}>Materiales</th>
                  <th className={cn(thc, 'text-right')}>Solo mano de obra</th>
                  <th className={cn(thc, 'text-right')}>Mano de obra por punto</th>
                  <th className="w-10">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kits.map((k) => (
                  <tr key={k.id} onClick={() => setAbierto(k.id)} className="group cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setAbierto(k.id)} className="text-left font-medium text-slate-900 group-hover:text-brand-800">
                        {k.nombre}
                      </button>
                      {k.descripcion && <div className="mt-0.5 line-clamp-1 max-w-xl text-xs text-slate-500">{k.descripcion}</div>}
                    </td>
                    <td className="num px-4 py-3 text-right text-slate-700">{k.items.filter((i) => i.materialId).length}</td>
                    <td className="num px-4 py-3 text-right text-slate-700">{k.items.filter((i) => !i.materialId).length}</td>
                    <td className="num px-4 py-3 text-right font-medium text-slate-900">{money(moPorUnidad(k))}</td>
                    <td className="px-2 py-3 text-slate-300 group-hover:text-slate-500">
                      <ChevronRight className="size-4" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {kit && <KitModal kit={kit} onClose={() => setAbierto(null)} />}
      {nuevo && <KitModal onClose={() => setNuevo(false)} />}
    </>
  )
}

type Fila = KitItem & { clave: string }

/** Crea o edita un kit. Los materiales vienen del catálogo; las líneas de solo mano de obra se escriben a mano. */
export function KitModal({ kit, onClose, onGuardado }: { kit?: Kit; onClose: () => void; onGuardado?: (id: string) => void }) {
  const kits = useStore((s) => s.kits)
  const materiales = useStore((s) => s.materiales)
  const guardarKit = useStore((s) => s.guardarKit)
  const eliminarKit = useStore((s) => s.eliminarKit)
  const notificar = useStore((s) => s.notificar)
  const [nombre, setNombre] = useState(kit?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(kit?.descripcion ?? '')
  const [filas, setFilas] = useState<Fila[]>(() => (kit?.items ?? []).map((i) => ({ ...i, clave: uid('ki') })))

  const nombreRepetido = kits.some((k) => k.id !== kit?.id && k.nombre.trim().toLowerCase() === nombre.trim().toLowerCase())
  const filasInvalidas = filas.filter((f) => !f.descripcion.trim() || f.cantidad <= 0).length
  const valido = nombre.trim() && !nombreRepetido && filas.length > 0 && filasInvalidas === 0
  const categorias = [...new Set(materiales.map((m) => m.categoria))] as CategoriaMaterial[]

  const cambiar = (clave: string, cambios: Partial<KitItem>) => setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)))
  const agregarMaterial = (materialId: string) => {
    const m = materiales.find((x) => x.id === materialId)
    if (m)
      setFilas((fs) => [
        ...fs,
        {
          clave: uid('ki'),
          materialId: m.id,
          descripcion: m.descripcion,
          unidad: m.unidad,
          cantidad: 1,
          vuMO: 0,
        },
      ])
  }

  const guardar = () => {
    const id = kit?.id ?? uid('kit')
    guardarKit({
      id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      items: filas.map(({ clave: _c, ...i }) => ({
        ...i,
        descripcion: i.descripcion.trim(),
      })),
    })
    notificar(kit ? `Kit “${nombre.trim()}” actualizado` : `Kit “${nombre.trim()}” creado`)
    onGuardado?.(id)
    onClose()
  }

  const eliminar = () => {
    if (!kit) return
    eliminarKit(kit.id)
    notificar(`Kit “${kit.nombre}” eliminado`, 'ok', () => guardarKit(kit))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={kit ? 'Editar kit' : 'Nuevo kit'}
      description="Las cantidades son por punto: al cotizar se multiplican por la cantidad de puntos. El precio del material se carga del catálogo al elegir el proveedor."
      footer={
        <>
          {kit && (
            <Button variant="danger" icon={<Trash2 />} onClick={eliminar} className="mr-auto">
              Eliminar kit
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!valido} onClick={guardar}>
            {kit ? 'Guardar cambios' : 'Crear kit'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nombre" htmlFor="kit-nombre" error={nombreRepetido ? 'Ya existe un kit con este nombre.' : undefined}>
          <Input id="kit-nombre" autoFocus={!kit} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Punto de red Cat 6A" />
        </Field>
        <Field label="Descripción" htmlFor="kit-desc" optional className="sm:col-span-2">
          <Textarea id="kit-desc" rows={2} className="min-h-9" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué incluye el kit" />
        </Field>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="py-2 pr-2 text-left">Ítem</th>
              <th className="w-24 px-2 py-2 text-left">Unidad</th>
              <th className="w-28 px-2 py-2 text-right" title="Cantidad para un punto">
                Cant. por punto
              </th>
              <th className="w-32 px-2 py-2 text-right" title="Valor unitario de mano de obra">
                V. unit. MO
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((f, idx) => (
              <tr key={f.clave} className="align-top">
                <td className="py-1.5 pr-2">
                  <Input
                    value={f.descripcion}
                    onChange={(e) => cambiar(f.clave, { descripcion: e.target.value })}
                    aria-label={`Descripción ítem ${idx + 1}`}
                    placeholder="Ej. Instalación y certificación"
                    aria-invalid={!f.descripcion.trim() || undefined}
                    className="h-8 text-[13px]"
                  />
                  <div className="mt-1 px-0.5">
                    {f.materialId ? <Badge tone="brand">Material · {materiales.find((m) => m.id === f.materialId)?.codigo ?? 'del catálogo'}</Badge> : <Badge>Solo mano de obra</Badge>}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Select value={f.unidad} onChange={(e) => cambiar(f.clave, { unidad: e.target.value as Unidad })} aria-label={`Unidad ítem ${idx + 1}`} className="h-8 text-[13px]">
                    <option value="Un">Un</option>
                    <option value="Mts">Mts</option>
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <NumberInput
                    value={f.cantidad}
                    onChange={(n) => cambiar(f.clave, { cantidad: n ?? 0 })}
                    aria-label={`Cantidad por punto ítem ${idx + 1}`}
                    aria-invalid={f.cantidad <= 0 || undefined}
                    inputClassName="h-8 text-[13px]"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <NumberInput
                    value={f.vuMO}
                    decimals={3}
                    prefix="$"
                    onChange={(n) => cambiar(f.clave, { vuMO: r3(n ?? 0) })}
                    aria-label={`Valor unitario mano de obra ítem ${idx + 1}`}
                    inputClassName="h-8 text-[13px]"
                  />
                </td>
                <td className="py-1.5 pl-1">
                  <IconButton label={`Quitar ítem ${idx + 1}`} onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))} className="size-8 hover:text-red-700">
                    <Trash2 />
                  </IconButton>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  Agrega los materiales del catálogo y las líneas de mano de obra que lleva cada punto.
                </td>
              </tr>
            )}
          </tbody>
          {filas.length > 0 && (
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={3} className="py-2 text-right text-slate-500">
                  Mano de obra por punto
                </td>
                <td className="num px-2 py-2 text-right font-semibold text-slate-900">{money(moPorUnidad({ items: filas }))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value="" onChange={(e) => agregarMaterial(e.target.value)} aria-label="Agregar material del catálogo" className="w-full sm:w-80">
          <option value="">+ Agregar material del catálogo…</option>
          {categorias.map((c) => (
            <optgroup key={c} label={c}>
              {materiales
                .filter((m) => m.categoria === c)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.descripcion} · {m.codigo}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
        <Button
          variant="ghost"
          icon={<Hammer />}
          onClick={() =>
            setFilas((fs) => [
              ...fs,
              {
                clave: uid('ki'),
                descripcion: '',
                unidad: 'Un',
                cantidad: 1,
                vuMO: 0,
              },
            ])
          }
        >
          Agregar línea de mano de obra
        </Button>
        {filasInvalidas > 0 && <span className="text-[13px] text-amber-800">Cada línea necesita descripción y cantidad mayor que 0.</span>}
      </div>
    </Modal>
  )
}
