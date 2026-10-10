import { useState } from 'react'
import { Boxes, PackagePlus, Trash2 } from 'lucide-react'
import { Button, IconButton, NumberInput, Select } from '@/components/ui'
import { itemMaterial, itemMO, itemSubtotal, totalesSeccion, type ItemCliente } from '@/lib/calc'
import { precioNeto } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { ItemCotizacion, Seccion, Unidad } from '@/types'

interface Props {
  proyectoId: string
  seccion: Seccion
  numeroInicial: number
  vistaCliente: boolean
  preciosCliente?: ItemCliente[]
  totalCliente?: number
  onAgregarItem: () => void
  onAgregarKit: () => void
  soloSeccion: boolean
  bloqueada?: boolean
}

const celdaNum = 'px-2 py-1.5 text-right num whitespace-nowrap'
const thBase = 'px-2 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'

export function TablaSeccion({ proyectoId, seccion, numeroInicial, vistaCliente, preciosCliente, totalCliente, onAgregarItem, onAgregarKit, soloSeccion, bloqueada }: Props) {
  const editarVersion = useStore((s) => s.editarVersion)
  const t = totalesSeccion(seccion)
  const [confirmar, setConfirmar] = useState(false)

  const renombrar = (nombre: string) =>
    editarVersion(proyectoId, (v) => {
      const s = v.secciones.find((x) => x.id === seccion.id)
      if (s) s.nombre = nombre
    })

  const eliminarSeccion = () =>
    editarVersion(proyectoId, (v) => {
      v.secciones = v.secciones.filter((x) => x.id !== seccion.id)
    })

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs" aria-label={`Sección ${seccion.nombre}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
        {vistaCliente ? (
          <h3 className="text-sm font-semibold text-slate-900">{seccion.nombre}</h3>
        ) : (
          <input
            value={seccion.nombre}
            onChange={(e) => renombrar(e.target.value)}
            aria-label="Nombre de la sección"
            className="-ml-1.5 min-w-0 flex-1 rounded px-1.5 py-1 text-sm font-semibold text-slate-900 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
          />
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Subtotal sección</span>
          <span className="num text-sm font-semibold text-slate-900">{money(vistaCliente ? totalCliente : t.subtotal)}</span>
          {!vistaCliente && !soloSeccion && !bloqueada && (
            confirmar ? (
              <span className="flex items-center gap-1">
                <Button size="sm" variant="danger" onClick={eliminarSeccion}>
                  Eliminar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmar(false)}>
                  Cancelar
                </Button>
              </span>
            ) : (
              <IconButton label="Eliminar sección" onClick={() => setConfirmar(true)}>
                <Trash2 />
              </IconButton>
            )
          )}
        </div>
      </header>

      {!vistaCliente && <TarjetasItems items={seccion.items} numeroInicial={numeroInicial} />}
      <div className={cn('overflow-x-auto', !vistaCliente && 'hidden md:block')}>
        {vistaCliente ? (
          <TablaCliente items={preciosCliente ?? []} numeroInicial={numeroInicial} />
        ) : (
          <table className="w-full min-w-[1000px] table-fixed text-[13px]">
            <thead className="border-b border-slate-200">
              <tr>
                <th className={cn(thBase, 'w-8 text-left')}>#</th>
                <th className={cn(thBase, 'text-left')}>Descripción</th>
                <th className={cn(thBase, 'w-[60px] text-left')}>Unidad</th>
                <th className={cn(thBase, 'w-[64px] text-right')}>Cant.</th>
                <th className={cn(thBase, 'w-[92px] text-right')}>
                  V. unit. <abbr title="mano de obra">MO</abbr>
                </th>
                <th className={cn(thBase, 'w-[92px] text-right')}>
                  V. total <abbr title="mano de obra">MO</abbr>
                </th>
                <th className={cn(thBase, 'w-[92px] text-right')}>V. unit. mat.</th>
                <th className={cn(thBase, 'w-[96px] text-right')}>V. total mat.</th>
                <th className={cn(thBase, 'w-[184px] text-left')}>Proveedor</th>
                <th className={cn(thBase, 'w-[100px] text-right')}>Subtotal</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seccion.items.map((item, idx) => (
                <FilaItem key={item.id} proyectoId={proyectoId} item={item} numero={numeroInicial + idx} bloqueada={bloqueada} />
              ))}
              {seccion.items.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">
                    Esta sección no tiene ítems. Agrega uno desde el catálogo o un kit predefinido.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50/70 text-[13px] font-medium">
              <tr>
                <td colSpan={5} className="px-2 py-2 text-right text-xs text-slate-500">
                  Totales sección
                </td>
                <td className={celdaNum}>{money(t.mo)}</td>
                <td />
                <td className={celdaNum}>{money(t.material)}</td>
                <td />
                <td className={cn(celdaNum, 'font-semibold text-slate-900')}>{money(t.subtotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {!vistaCliente && !bloqueada && (
        <footer className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2.5">
          <Button size="sm" variant="ghost" icon={<PackagePlus />} onClick={onAgregarItem} className="text-brand-800 hover:bg-brand-50 hover:text-brand-900">
            Agregar ítem
          </Button>
          <Button size="sm" variant="ghost" icon={<Boxes />} onClick={onAgregarKit} className="text-brand-800 hover:bg-brand-50 hover:text-brand-900">
            Agregar kit
          </Button>
        </footer>
      )}
    </section>
  )
}

function FilaItem({ proyectoId, item, numero, bloqueada }: { proyectoId: string; item: ItemCotizacion; numero: number; bloqueada?: boolean }) {
  const editarVersion = useStore((s) => s.editarVersion)
  const asignarProveedor = useStore((s) => s.asignarProveedor)
  const proveedores = useStore((s) => s.proveedores)
  const precios = useStore((s) => s.precios)

  const editar = (fn: (i: ItemCotizacion) => void) =>
    editarVersion(proyectoId, (v) => {
      for (const s of v.secciones) {
        const i = s.items.find((x) => x.id === item.id)
        if (i) return fn(i)
      }
    })

  const eliminar = () =>
    editarVersion(proyectoId, (v) => {
      for (const s of v.secciones) s.items = s.items.filter((x) => x.id !== item.id)
    })

  const conPrecio = item.materialId ? precios.filter((p) => p.materialId === item.materialId) : []
  const otros = proveedores.filter((p) => !conPrecio.some((c) => c.proveedorId === p.id))
  const sinProveedor = !item.proveedorId && item.vuMaterial > 0
  const celdaInput = 'h-8 text-[13px] px-2 shadow-none border-transparent bg-transparent hover:border-slate-300 hover:bg-white focus:bg-white disabled:border-transparent disabled:bg-transparent disabled:text-slate-800'

  return (
    <tr className="group hover:bg-slate-50/60">
      <td className="num px-2 py-1.5 text-slate-500">{numero}</td>
      <td className="px-1 py-1">
        <input
          value={item.descripcion}
          onChange={(e) => editar((i) => (i.descripcion = e.target.value))}
          aria-label={`Descripción ítem ${numero}`}
          title={item.descripcion}
          className="h-8 w-full min-w-0 truncate rounded-md border border-transparent px-1.5 disabled:bg-transparent text-[13px] text-slate-900 hover:border-slate-300 hover:bg-white focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-600/25 focus:outline-none"
        />
      </td>
      <td className="px-1 py-1">
        <Select
          value={item.unidad}
          onChange={(e) => editar((i) => (i.unidad = e.target.value as Unidad))}
          aria-label={`Unidad ítem ${numero}`}
          className={cn(celdaInput, 'pr-5! pl-1.5! bg-[right_2px_center]')}
        >
          <option value="Un">Un</option>
          <option value="Mts">Mts</option>
        </Select>
      </td>
      <td className="px-1 py-1">
        <NumberInput value={item.cantidad} onChange={(n) => editar((i) => (i.cantidad = n ?? 0))} aria-label={`Cantidad ítem ${numero}`} inputClassName={celdaInput} />
      </td>
      <td className="px-1 py-1">
        <NumberInput value={item.vuMO} onChange={(n) => editar((i) => (i.vuMO = n ?? 0))} aria-label={`Valor unitario mano de obra ítem ${numero}`} inputClassName={celdaInput} />
      </td>
      <td className={cn(celdaNum, item.vuMO === 0 ? 'text-slate-500' : 'text-slate-700')}>{money(itemMO(item))}</td>
      <td className="px-1 py-1">
        <NumberInput value={item.vuMaterial} onChange={(n) => editar((i) => (i.vuMaterial = n ?? 0))} aria-label={`Valor unitario material ítem ${numero}`} inputClassName={celdaInput} />
      </td>
      <td className={cn(celdaNum, item.vuMaterial === 0 ? 'text-slate-500' : 'text-slate-700')}>{money(itemMaterial(item))}</td>
      <td className="px-1 py-1">
        <Select
          value={item.proveedorId ?? ''}
          onChange={(e) => asignarProveedor(proyectoId, item.id, e.target.value || null)}
          aria-label={`Proveedor ítem ${numero}`}
          className={cn(
            'h-8 text-[13px] shadow-none disabled:border-transparent disabled:bg-transparent disabled:text-slate-700',
            sinProveedor ? 'border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400' : 'border-slate-200',
            !item.proveedorId && !sinProveedor && 'text-slate-500',
          )}
        >
          <option value="">Sin asignar</option>
          {conPrecio.length > 0 && (
            <optgroup label="Con precio en catálogo">
              {conPrecio.map((pp) => (
                <option key={pp.id} value={pp.proveedorId}>
                  {proveedores.find((p) => p.id === pp.proveedorId)?.nombre.replace(/ S\.A\.S?\.?$/, '')} · {money(precioNeto(pp))}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={conPrecio.length ? 'Otros proveedores' : 'Proveedores'}>
            {otros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </optgroup>
        </Select>
      </td>
      <td className={cn(celdaNum, 'font-medium text-slate-900')}>{money(itemSubtotal(item))}</td>
      <td className="px-1 py-1 text-right">
        {!bloqueada && <IconButton label={`Eliminar ítem ${numero}`} onClick={eliminar} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-700">
          <Trash2 />
        </IconButton>}
      </td>
    </tr>
  )
}

function TablaCliente({ items, numeroInicial }: { items: ItemCliente[]; numeroInicial: number }) {
  return (
    <table className="w-full text-[13px]">
      <thead className="border-b border-slate-200">
        <tr>
          <th className={cn(thBase, 'w-10 text-left')}>#</th>
          <th className={cn(thBase, 'text-left')}>Descripción</th>
          <th className={cn(thBase, 'w-20 text-left')}>Unidad</th>
          <th className={cn(thBase, 'w-20 text-right')}>Cant.</th>
          <th className={cn(thBase, 'w-32 text-right')}>V. unitario</th>
          <th className={cn(thBase, 'w-32 text-right')}>V. total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((ic, idx) => (
          <tr key={ic.item.id}>
            <td className="num px-2 py-2 text-slate-500">{numeroInicial + idx}</td>
            <td className="px-2 py-2 text-slate-900">{ic.item.descripcion}</td>
            <td className="px-2 py-2 text-slate-600">{ic.item.unidad}</td>
            <td className={celdaNum}>{ic.item.cantidad.toLocaleString('es-CO')}</td>
            <td className={celdaNum}>{money(ic.unitario)}</td>
            <td className={cn(celdaNum, 'font-medium text-slate-900')}>{money(ic.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** En celular la tabla de 10 columnas no cabe: cada ítem se lee como tarjeta. La edición se hace en escritorio. */
function TarjetasItems({ items, numeroInicial }: { items: ItemCotizacion[]; numeroInicial: number }) {
  const proveedores = useStore((s) => s.proveedores)
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {items.map((i, idx) => (
        <li key={i.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-sm text-slate-900">
              <span className="num mr-1.5 text-slate-500">{numeroInicial + idx}</span>
              {i.descripcion}
            </span>
            <span className="num shrink-0 text-sm font-semibold text-slate-900">{money(itemSubtotal(i))}</span>
          </div>
          <div className="num mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span>
              {i.cantidad.toLocaleString('es-CO')} {i.unidad}
            </span>
            {i.vuMO > 0 && <span>MO {money(itemMO(i))}</span>}
            {i.vuMaterial > 0 && <span>Material {money(itemMaterial(i))}</span>}
            {i.vuMaterial > 0 && (
              <span className={cn(!i.proveedorId && 'font-medium text-amber-800')}>{proveedores.find((p) => p.id === i.proveedorId)?.nombre ?? 'Sin proveedor'}</span>
            )}
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Sin ítems en esta sección.</li>}
      <li className="bg-slate-50 px-4 py-2 text-xs text-slate-500">Para editar ítems usa un computador.</li>
    </ul>
  )
}
