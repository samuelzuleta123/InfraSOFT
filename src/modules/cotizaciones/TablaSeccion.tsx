import { useState } from 'react'
import { Boxes, PackagePlus, Trash2 } from 'lucide-react'
import { Button, IconButton, NumberInput, Select } from '@/components/ui'
import { NuevoProveedorModal } from '@/modules/catalogo/NuevosModales'
import { itemMaterial, itemMO, itemSubtotal, totalesSeccion, type ItemCliente } from '@/lib/calc'
import { precioNeto } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { compararConUltimaCompra, type ComparacionPrecio, type CompraMaterial } from '@/lib/historico'
import { fecha, money, moneyUnit, pct, r3 } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
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
  /** Compras reales de otros proyectos; se calcula una vez en el cotizador. */
  historico: CompraMaterial[]
}

const celdaNum = 'px-2 py-2.5 text-right num whitespace-nowrap'
const thBase = 'px-2 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'
const NUEVO_PROVEEDOR = '__nuevo_proveedor__'

export function TablaSeccion({ proyectoId, seccion, numeroInicial, vistaCliente, preciosCliente, totalCliente, onAgregarItem, onAgregarKit, soloSeccion, bloqueada, historico }: Props) {
  const editarVersion = useStore((s) => s.editarVersion)
  const t = totalesSeccion(seccion)
  const [confirmar, setConfirmar] = useState(false)
  const [itemParaNuevoProveedor, setItemParaNuevoProveedor] = useState<string | null>(null)

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
            {/* Con table-fixed los anchos salen de aquí: el encabezado agrupado no los puede dar. */}
            <colgroup>
              <col className="w-8" />
              <col />
              <col className="w-[60px]" />
              <col className="w-[64px]" />
              <col className="w-[92px]" />
              <col className="w-[92px]" />
              <col className="w-[92px]" />
              <col className="w-[96px]" />
              <col className="w-[236px]" />
              <col className="w-[100px]" />
              <col className="w-8" />
            </colgroup>
            <thead className="border-b border-slate-200">
              {/* Encabezado en dos niveles: qué se cobra (mano de obra) y qué se compra (material), cada uno por unidad y en total. */}
              <tr>
                <th rowSpan={2} className={cn(thBase, 'text-left align-bottom')}>#</th>
                <th rowSpan={2} className={cn(thBase, 'text-left align-bottom')}>Descripción</th>
                <th rowSpan={2} className={cn(thBase, 'text-left align-bottom')}>Unidad</th>
                <th rowSpan={2} className={cn(thBase, 'text-right align-bottom')}>Cant.</th>
                <th colSpan={2} scope="colgroup" className={cn(thBase, 'border-b border-slate-200 pb-1 text-center')} title="Lo que cobra Infrasoft por instalar">
                  Mano de obra
                </th>
                <th colSpan={2} scope="colgroup" className={cn(thBase, 'border-b border-slate-200 pb-1 text-center')} title="Lo que cuesta comprar el material al proveedor">
                  Material (costo)
                </th>
                <th rowSpan={2} className={cn(thBase, 'text-left align-bottom')}>Proveedor</th>
                <th rowSpan={2} className={cn(thBase, 'text-right align-bottom')} title="Mano de obra + material, sin utilidad ni otros costos">
                  Subtotal
                </th>
                <th rowSpan={2} />
              </tr>
              <tr>
                <th className={cn(thBase, 'pt-1 text-right')} title="Mano de obra por cada unidad">Unitario</th>
                <th className={cn(thBase, 'pt-1 text-right')} title="Mano de obra × cantidad">Total</th>
                <th className={cn(thBase, 'pt-1 text-right')} title="Precio de compra por unidad, según el proveedor elegido">Unitario</th>
                <th className={cn(thBase, 'pt-1 text-right')} title="Precio de compra × cantidad">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seccion.items.map((item, idx) => (
                <FilaItem
                  key={item.id}
                  proyectoId={proyectoId}
                  item={item}
                  numero={numeroInicial + idx}
                  bloqueada={bloqueada}
                  // En una versión bloqueada no aplica: compararía lo ya vendido con compras posteriores.
                  comparacion={bloqueada ? undefined : compararConUltimaCompra(historico, item, proyectoId)}
                  onNuevoProveedor={() => setItemParaNuevoProveedor(item.id)}
                />
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
      {itemParaNuevoProveedor && (
        <NuevoProveedorModal
          onClose={() => setItemParaNuevoProveedor(null)}
          onCreado={(proveedorId) => {
            const itemId = itemParaNuevoProveedor
            useStore.getState().asignarProveedor(proyectoId, itemId, proveedorId)
          }}
        />
      )}
    </section>
  )
}

function FilaItem({
  proyectoId,
  item,
  numero,
  bloqueada,
  comparacion,
  onNuevoProveedor,
}: {
  proyectoId: string
  item: ItemCotizacion
  numero: number
  bloqueada?: boolean
  comparacion?: ComparacionPrecio
  onNuevoProveedor: () => void
}) {
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
    <tr className="group align-top hover:bg-slate-50/60">
      <td className="num px-2 py-2 text-slate-500">{numero}</td>
      <td className="px-1 py-1">
        {/* La descripción se ajusta en varias líneas en vez de cortarse: hay que poder leer qué ítem es cada fila. */}
        <textarea
          rows={1}
          value={item.descripcion}
          onChange={(e) => editar((i) => (i.descripcion = e.target.value))}
          aria-label={`Descripción ítem ${numero}`}
          className="block min-h-8 w-full min-w-0 resize-none rounded-md border border-transparent px-1.5 py-[7px] text-[13px] leading-snug text-slate-900 [field-sizing:content] hover:border-slate-300 hover:bg-white focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-600/25 focus:outline-none disabled:bg-transparent"
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
        <NumberInput value={item.vuMO} decimals={3} onChange={(n) => editar((i) => (i.vuMO = r3(n ?? 0)))} aria-label={`Valor unitario mano de obra ítem ${numero}`} inputClassName={celdaInput} />
      </td>
      <td className={cn(celdaNum, item.vuMO === 0 ? 'text-slate-500' : 'text-slate-700')}>{money(itemMO(item))}</td>
      <td className="px-1 py-1">
        <NumberInput value={item.vuMaterial} decimals={3} onChange={(n) => editar((i) => (i.vuMaterial = r3(n ?? 0)))} aria-label={`Valor unitario material ítem ${numero}`} inputClassName={celdaInput} />
      </td>
      <td className={cn(celdaNum, item.vuMaterial === 0 ? 'text-slate-500' : 'text-slate-700')}>{money(itemMaterial(item))}</td>
      <td className="px-1 py-1">
        <Select
          value={item.proveedorId ?? ''}
          onChange={(e) => {
            if (e.target.value === NUEVO_PROVEEDOR) {
              onNuevoProveedor()
              return
            }
            asignarProveedor(proyectoId, item.id, e.target.value || null)
          }}
          aria-label={`Proveedor ítem ${numero}`}
          className={cn(
            'h-8 text-[13px] shadow-none disabled:border-transparent disabled:bg-transparent disabled:text-slate-700',
            sinProveedor ? 'border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400' : 'border-slate-200',
            !item.proveedorId && !sinProveedor && 'text-slate-500',
          )}
        >
          <option value="">Sin asignar</option>
          <option value={NUEVO_PROVEEDOR}>+ Agregar proveedor...</option>
          {conPrecio.length > 0 && (
            <optgroup label="Con precio en catálogo">
              {conPrecio.map((pp) => (
                <option key={pp.id} value={pp.proveedorId}>
                  {proveedores.find((p) => p.id === pp.proveedorId)?.nombre.replace(/ S\.A\.S?\.?$/, '')} · {moneyUnit(precioNeto(pp))}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={conPrecio.length ? 'Otros proveedores' : 'Proveedores'}>
            {otros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre.replace(/ S\.A\.S?\.?$/, '')}
              </option>
            ))}
          </optgroup>
        </Select>
        {comparacion && <UltimaCompra c={comparacion} />}
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

/** Último precio real de compra del material; se resalta si el precio cotizado se aleja del umbral. */
function UltimaCompra({ c }: { c: ComparacionPrecio }) {
  const proveedores = useStore((s) => s.proveedores)
  const proyecto = useStore((s) => s.proyectos.find((p) => p.id === c.compra.proyectoId))
  const detalle = `${c.compra.factura ? `Factura ${c.compra.factura}` : `OC ${c.compra.ocConsecutivo} (sin factura)`} · ${nombreProveedor(proveedores, c.compra.proveedorId)} · ${proyecto?.codigo ?? ''} · ${fecha(c.compra.fecha)}`
  return (
    <div title={detalle} className={cn('num mt-0.5 truncate px-1 text-[11px]', c.fuera ? 'font-medium text-amber-800' : 'text-slate-500')}>
      Última compra {moneyUnit(c.compra.precio)}
      {c.fuera && ` · ${c.variacion > 0 ? '+' : ''}${pct(c.variacion * 100, 0)}`}
    </div>
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
            <td className={celdaNum}>{moneyUnit(ic.unitario)}</td>
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
            {i.vuMO > 0 && <span>Mano de obra {money(itemMO(i))}</span>}
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
