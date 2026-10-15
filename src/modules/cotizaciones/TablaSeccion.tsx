import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Boxes, Package, Plus, Trash2, Wrench } from 'lucide-react'
import { Badge, Button, IconButton, NumberInput } from '@/components/ui'
import { NuevoProveedorModal } from '@/modules/catalogo/NuevosModales'
import { SelectorMaterialesModal } from '@/modules/catalogo/SelectorMateriales'
import { esMaterial, precioNeto, itemMaterial, itemMO, itemSubtotal, totalesSeccion, totalOtroCosto, type ItemCliente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { ultimaCompra, type CompraMaterial } from '@/lib/historico'
import { money, moneyUnit, r3, uid } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { ItemCotizacion, OtroCosto, Seccion, Unidad } from '@/types'
import { FuentePrecio, SelectorPrecio } from './SelectorPrecio'
import { AgregarEnLinea } from './AgregarEnLinea'

interface Props {
  proyectoId: string
  /** La cotización es una sola lista de ítems; se guarda como la única sección de la versión. */
  seccion: Seccion
  otrosCostos: OtroCosto[]
  vistaCliente: boolean
  preciosCliente?: ItemCliente[]
  totalCliente?: number
  onAgregarKit: () => void
  bloqueada?: boolean
  /** Compras reales de otros proyectos; se calcula una vez en el cotizador. */
  historico: CompraMaterial[]
}

const celdaNum = 'px-2 py-2.5 text-right num whitespace-nowrap'
const thBase = 'px-2 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap'
// Una sola rejilla para encabezados y filas de los dos bloques: descripción, cantidad, precio unitario, total, quitar.
const rejilla = 'grid grid-cols-[minmax(0,1fr)_132px_minmax(140px,176px)_104px_32px] gap-x-3 px-4'
// Materiales suman la columna Proveedor después de la descripción; cantidad, precio y total quedan alineados con mano de obra.
const rejillaMaterial = 'grid grid-cols-[minmax(0,1fr)_minmax(150px,210px)_132px_minmax(140px,176px)_104px_32px] gap-x-3 px-4'
const UNIDAD: Record<Unidad, string> = { Un: 'un', Mts: 'm' }
const etiquetaMO = (i: ItemCotizacion) => i.descripcionMO ?? `Instalación de ${i.descripcion}`
/** Un material lleva mano de obra unida si tiene valor de instalación o si ya se le dio nombre a esa fila. */
const tieneMOUnida = (i: ItemCotizacion) => i.vuMO > 0 || i.descripcionMO !== undefined

type FilaMO = { clave: string; item: ItemCotizacion; unida: boolean }

export function TablaSeccion({ proyectoId, seccion, otrosCostos, vistaCliente, preciosCliente, totalCliente, onAgregarKit, bloqueada, historico }: Props) {
  const editarVersion = useStore((s) => s.editarVersion)
  const t = totalesSeccion(seccion)
  const totalOtros = otrosCostos.reduce((a, o) => a + totalOtroCosto(o), 0)
  const [itemParaNuevoProveedor, setItemParaNuevoProveedor] = useState<string | null>(null)

  const materiales = seccion.items.filter(esMaterial)
  // La mano de obra unida a un material aparece en el orden del material; la independiente, en el suyo.
  const filasMO = seccion.items.flatMap<FilaMO>((i) =>
    esMaterial(i) ? (tieneMOUnida(i) ? [{ clave: `mo-${i.id}`, item: i, unida: true }] : []) : [{ clave: i.id, item: i, unida: false }],
  )
  const pendientes =
    materiales.filter((i) => i.vuMaterial <= 0 || !i.proveedorId).length + filasMO.filter((f) => !f.unida && f.item.vuMO <= 0).length

  const agregar = (item: ItemCotizacion) => {
    editarVersion(proyectoId, (v) => {
      if (!v.secciones.length) v.secciones.push({ id: seccion.id, nombre: 'Ítems', items: [] })
      v.secciones[0].items.push(item)
    })
    // El evento que agrega es discreto: React ya pintó la fila cuando corre el timeout.
    setTimeout(() => {
      const el = document.getElementById(`cant-${item.id}`) as HTMLInputElement | null
      el?.focus()
    }, 0)
  }

  // Material del catálogo: entra con el proveedor más barato y su precio neto ya cargados.
  const [eligiendo, setEligiendo] = useState(false)
  const agregarMateriales = (ids: string[]) => {
    const { materiales: catalogo, precios } = useStore.getState()
    const nuevos = ids.flatMap<ItemCotizacion>((id) => {
      const m = catalogo.find((x) => x.id === id)
      if (!m) return []
      const mejor = precios.filter((p) => p.materialId === id).sort((a, b) => precioNeto(a) - precioNeto(b))[0]
      return [
        {
          id: uid('it'),
          tipo: 'material',
          materialId: m.id,
          descripcion: m.descripcion,
          unidad: m.unidad,
          cantidad: 1,
          vuMO: 0,
          vuMaterial: mejor ? precioNeto(mejor) : 0,
          proveedorId: mejor?.proveedorId ?? null,
          cantInstalada: null,
        },
      ]
    })
    nuevos.forEach(agregar)
  }
  const crearMaterialLibre = (descripcion: string) =>
    agregar({ id: uid('it'), tipo: 'material', descripcion, unidad: 'Un', cantidad: 1, vuMO: 0, vuMaterial: 0, proveedorId: null, cantInstalada: null })

  const editarOtro = (clave: OtroCosto['clave'], fn: (o: OtroCosto) => void) =>
    editarVersion(proyectoId, (v) => {
      const o = v.otrosCostos.find((x) => x.clave === clave)
      if (o) fn(o)
    })

  // Enter baja al mismo campo de la fila siguiente, como en la hoja de Excel que reemplaza.
  const bajarConEnter = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.target as HTMLElement
    const col = el.dataset.col
    if (e.key !== 'Enter' || !col || el.tagName !== 'INPUT') return
    e.preventDefault()
    const campos = [...document.querySelectorAll<HTMLInputElement>(`input[data-col="${col}"]:not(:disabled)`)]
    campos[campos.indexOf(el as HTMLInputElement) + 1]?.focus()
  }

  if (vistaCliente)
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-xs" aria-label="Ítems de la propuesta">
        <div className="overflow-x-auto">
          <TablaCliente items={preciosCliente ?? []} numeroInicial={1} />
        </div>
        <footer className="flex justify-end gap-3 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px]">
          <span className="text-slate-500">Valor total</span>
          <span className="num font-semibold text-slate-900">{money(totalCliente)}</span>
        </footer>
      </section>
    )

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-xs" aria-label="Ítems de la cotización">
      <TarjetasItems items={seccion.items} numeroInicial={1} />
      <div className="hidden md:block" onKeyDown={bajarConEnter}>
        <Bloque
          icono={<Package />}
          titulo="Materiales"
          ayuda="lo que se compra"
          precio="Costo unitario"
          vacio="Sin materiales. Búscalos en el catálogo o agrega un kit."
          conProveedor
          pie={
            !bloqueada && (
              // El kit trae materiales y su instalación: se ofrece junto al punto donde se empieza a armar la cotización.
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" icon={<Plus />} onClick={() => setEligiendo(true)}>
                  Agregar material
                </Button>
                <Button size="md" variant="ghost" icon={<Boxes />} onClick={onAgregarKit} className="text-brand-800 hover:bg-brand-50 hover:text-brand-900">
                  Agregar kit
                </Button>
              </div>
            )
          }
        >
          {materiales.map((item) => (
            <FilaMaterial
              key={item.id}
              proyectoId={proyectoId}
              item={item}
              bloqueada={bloqueada}
              // En una versión bloqueada no aplica: compararía lo ya vendido con compras posteriores.
              compra={bloqueada ? undefined : ultimaCompra(historico, item.materialId, proyectoId)}
              onNuevoProveedor={() => setItemParaNuevoProveedor(item.id)}
            />
          ))}
        </Bloque>
        <Bloque
          icono={<Wrench />}
          titulo="Mano de obra y otros costos"
          ayuda="lo que cobra Infrasoft y los gastos del proyecto"
          precio="Valor unitario"
          vacio="Sin mano de obra."
          pie={!bloqueada && <AgregarEnLinea tipo="mo" onAgregar={agregar} />}
          despues={
            <>
              <p className="mt-3 border-t border-dashed border-slate-200 px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Otros costos</p>
              {otrosCostos.map((o) => (
                <div key={o.clave} className={cn(rejilla, 'items-start py-1.5 transition-colors hover:bg-slate-50/70')}>
                  <p className="px-2 py-[7px] text-[13px] text-slate-900">{o.nombre}</p>
                  <NumberInput data-col="cant" value={o.cantidad} onChange={(n) => editarOtro(o.clave, (x) => void (x.cantidad = n ?? 0))} aria-label={`Cantidad de ${o.nombre}`} inputClassName={campo} />
                  <NumberInput
                    data-col="precio"
                    value={o.valorUnitario || null}
                    allowEmpty
                    prefix="$"
                    placeholder="0"
                    onChange={(n) => editarOtro(o.clave, (x) => void (x.valorUnitario = n ?? 0))}
                    aria-label={`Valor unitario de ${o.nombre}`}
                    inputClassName={campo}
                  />
                  <div className={cn('num pt-[7px] text-right text-[13px] font-medium', totalOtroCosto(o) ? 'text-slate-900' : 'text-slate-400')}>{money(totalOtroCosto(o))}</div>
                  <div />
                </div>
              ))}
            </>
          }
          separado
        >
          {filasMO.map((f) => (
            <FilaManoObra key={f.clave} proyectoId={proyectoId} seccionId={seccion.id} fila={f} materiales={materiales} bloqueada={bloqueada} />
          ))}
        </Bloque>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-2.5">
        {!bloqueada && seccion.items.length > 0 ? (
          pendientes > 0 ? (
            <Badge tone="warn" dot>
              {pendientes} {pendientes === 1 ? 'ítem sin precio o proveedor' : 'ítems sin precio o proveedor'}
            </Badge>
          ) : (
            <Badge tone="ok" dot>
              Precios completos
            </Badge>
          )
        ) : (
          <span />
        )}
        <dl className="num flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
          <Total etiqueta="Materiales" valor={t.material} />
          <Total etiqueta="Mano de obra" valor={t.mo} />
          <Total etiqueta="Otros costos" valor={totalOtros} />
          <Total etiqueta="Costo total" valor={t.subtotal + totalOtros} fuerte />
        </dl>
      </footer>

      {eligiendo && (
        <SelectorMaterialesModal
          onClose={() => setEligiendo(false)}
          onAgregar={agregarMateriales}
          yaAgregados={materiales.flatMap((m) => (m.materialId ? [m.materialId] : []))}
          etiquetaYa="Ya está en la cotización"
          permitirRepetir
          onCrearLibre={crearMaterialLibre}
        />
      )}
      {itemParaNuevoProveedor && (
        <NuevoProveedorModal
          onClose={() => setItemParaNuevoProveedor(null)}
          onCreado={(proveedorId) => useStore.getState().asignarProveedor(proyectoId, itemParaNuevoProveedor, proveedorId)}
        />
      )}
    </section>
  )
}

function Total({ etiqueta, valor, fuerte }: { etiqueta: string; valor: number; fuerte?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className={cn('m-0', fuerte ? 'font-semibold text-slate-900' : 'font-medium text-slate-800')}>{money(valor)}</dd>
    </div>
  )
}

function Bloque({ icono, titulo, ayuda, precio, vacio, pie, despues, separado, conProveedor, children }: { icono: ReactNode; titulo: string; ayuda: string; precio: string; vacio: string; pie: ReactNode; despues?: ReactNode; separado?: boolean; conProveedor?: boolean; children: ReactNode[] }) {
  return (
    <div role="group" aria-label={titulo} className={cn('pb-3', separado && 'border-t border-slate-200')}>
      <div className={cn(conProveedor ? rejillaMaterial : rejilla, 'items-end pt-3.5 pb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase')}>
        <div className="flex items-center gap-2 text-slate-900 [&>svg]:size-4 [&>svg]:text-brand-700">
          {icono}
          {titulo}
          <span className="font-normal tracking-normal text-slate-500 normal-case">· {ayuda}</span>
        </div>
        {conProveedor && <div>Proveedor</div>}
        <div className="text-right">Cantidad</div>
        <div className="text-right">{precio}</div>
        <div className="text-right">Total</div>
        <div />
      </div>
      {children.length > 0 ? <div>{children}</div> : <p className="px-4 py-2 text-[13px] text-slate-500">{vacio}</p>}
      {pie && <div className="px-4 pt-2">{pie}</div>}
      {despues}
    </div>
  )
}

/** Campos de la fila: sin borde hasta que se pasa el cursor, para que la tabla se lea como tabla y no como formulario. */
const campo =
  'h-8 border-transparent bg-transparent px-2 text-[13px] shadow-none hover:border-slate-300 hover:bg-white focus:bg-white disabled:border-transparent disabled:bg-transparent disabled:text-slate-800'

function Descripcion({ valor, onChange, etiqueta }: { valor: string; onChange: (v: string) => void; etiqueta: string }) {
  // Se ajusta en varias líneas en vez de cortarse: hay que poder leer qué ítem es cada fila.
  return (
    <textarea
      rows={1}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={etiqueta}
      className="block min-h-8 w-full min-w-0 resize-none rounded-md border border-transparent px-2 py-[7px] text-[13px] leading-snug text-slate-900 [field-sizing:content] hover:border-slate-300 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/25 focus:outline-none disabled:bg-transparent"
    />
  )
}

function Cantidad({ id, valor, unidad, onChange, onUnidad, disabled, etiqueta }: { id: string; valor: number; unidad: Unidad; onChange?: (n: number) => void; onUnidad?: () => void; disabled?: boolean; etiqueta: string }) {
  return (
    <div className="relative">
      <NumberInput id={`cant-${id}`} data-col="cant" value={valor} onChange={(n) => onChange?.(n ?? 0)} disabled={disabled} aria-label={etiqueta} inputClassName={cn(campo, 'pr-10')} />
      <button
        type="button"
        onClick={onUnidad}
        disabled={disabled || !onUnidad}
        title="Cambiar unidad"
        aria-label={`Unidad: ${unidad === 'Un' ? 'unidades' : 'metros'}. Cambiar`}
        className="absolute top-1/2 right-1 h-6 min-w-8 -translate-y-1/2 cursor-pointer rounded bg-slate-100 px-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-brand-100 hover:text-brand-900 disabled:cursor-default disabled:bg-transparent disabled:hover:text-slate-600"
      >
        {UNIDAD[unidad]}
      </button>
    </div>
  )
}

function TotalFila({ valor, falta, texto }: { valor: number; falta: boolean; texto: string }) {
  return falta ? (
    <div className="pt-[7px] text-right text-[13px] font-medium whitespace-nowrap text-amber-800">{texto}</div>
  ) : (
    <div className="num pt-[7px] text-right text-[13px] font-medium whitespace-nowrap text-slate-900">{money(valor)}</div>
  )
}

function useEditarItem(proyectoId: string) {
  const editarVersion = useStore((s) => s.editarVersion)
  return (itemId: string, fn: (i: ItemCotizacion, s: Seccion) => void) =>
    editarVersion(proyectoId, (v) => {
      for (const s of v.secciones) {
        const i = s.items.find((x) => x.id === itemId)
        if (i) return fn(i, s)
      }
    })
}

function FilaMaterial({ proyectoId, item, bloqueada, compra, onNuevoProveedor }: { proyectoId: string; item: ItemCotizacion; bloqueada?: boolean; compra?: CompraMaterial; onNuevoProveedor: () => void }) {
  const editar = useEditarItem(proyectoId)
  const asignarProveedor = useStore((s) => s.asignarProveedor)
  const sinPrecio = item.vuMaterial <= 0

  // Al terminar de digitar el costo de un proveedor que no tenía precio para este material, queda en su catálogo
  // para las próximas cotizaciones. Un precio que ya existía no se pisa: puede ser un precio negociado solo para este proyecto.
  const guardarEnCatalogo = () => {
    const { precios, proveedores, guardarPrecioDigitado, notificar } = useStore.getState()
    const { materialId, proveedorId, vuMaterial } = item
    if (!materialId || !proveedorId || vuMaterial <= 0) return
    if (precios.some((p) => p.materialId === materialId && p.proveedorId === proveedorId)) return
    guardarPrecioDigitado(materialId, proveedorId, vuMaterial)
    notificar(`${moneyUnit(vuMaterial)} quedó en el catálogo de ${nombreProveedor(proveedores, proveedorId)} para ${item.descripcion}`)
  }

  return (
    <div className={cn(rejillaMaterial, 'group items-start py-1.5 transition-colors hover:bg-slate-50/70')}>
      <Descripcion valor={item.descripcion} onChange={(d) => editar(item.id, (i) => void (i.descripcion = d))} etiqueta="Descripción del material" />
      <SelectorPrecio
        item={item}
        compra={compra}
        bloqueada={bloqueada}
        onNuevoProveedor={onNuevoProveedor}
        onElegir={(proveedorId, precio) => {
          if (precio === undefined) asignarProveedor(proyectoId, item.id, proveedorId)
          else
            editar(item.id, (i) => {
              i.proveedorId = proveedorId
              i.vuMaterial = precio
            })
        }}
      />
      <Cantidad
        id={item.id}
        valor={item.cantidad}
        unidad={item.unidad}
        onChange={(n) => editar(item.id, (i) => void (i.cantidad = n))}
        onUnidad={() => editar(item.id, (i) => void (i.unidad = i.unidad === 'Un' ? 'Mts' : 'Un'))}
        etiqueta={`Cantidad de ${item.descripcion}`}
      />
      <div className="min-w-0" onBlur={bloqueada ? undefined : guardarEnCatalogo}>
        <NumberInput
          data-col="precio"
          value={sinPrecio ? null : item.vuMaterial}
          allowEmpty
          decimals={3}
          prefix="$"
          placeholder="Falta"
          onChange={(n) => editar(item.id, (i) => void (i.vuMaterial = r3(n ?? 0)))}
          aria-label={`Costo unitario de ${item.descripcion}`}
          inputClassName={cn(campo, sinPrecio && !bloqueada && 'border-amber-200 bg-amber-50/70 placeholder:text-amber-700')}
        />
        {!bloqueada && <FuentePrecio item={item} compra={compra} />}
      </div>
      <TotalFila valor={itemMaterial(item)} falta={sinPrecio} texto="Falta precio" />
      <Quitar bloqueada={bloqueada} etiqueta={`Quitar ${item.descripcion}${tieneMOUnida(item) ? ' y su instalación' : ''}`} onClick={() => editar(item.id, (_, s) => void (s.items = s.items.filter((x) => x.id !== item.id)))} />
    </div>
  )
}

function FilaManoObra({ proyectoId, seccionId, fila, materiales, bloqueada }: { proyectoId: string; seccionId: string; fila: FilaMO; materiales: ItemCotizacion[]; bloqueada?: boolean }) {
  const editar = useEditarItem(proyectoId)
  const editarVersion = useStore((s) => s.editarVersion)
  const { item, unida } = fila
  const descripcion = unida ? etiquetaMO(item) : item.descripcion
  const sinValor = item.vuMO <= 0

  const conSeccion = (fn: (s: Seccion) => void) =>
    editarVersion(proyectoId, (v) => {
      const s = v.secciones.find((x) => x.id === seccionId)
      if (s) fn(s)
    })

  /** Cambiar de dónde sale la cantidad: de un material de la sección (queda unida a él) o propia. */
  const vincular = (materialId: string) =>
    conSeccion((s) => {
      const origen = s.items.find((x) => x.id === item.id)
      if (!origen) return
      const destino = materialId ? s.items.find((x) => x.id === materialId) : undefined
      if (destino?.id === origen.id) return
      const nombre = unida ? etiquetaMO(origen) : origen.descripcion
      if (destino) {
        destino.vuMO = origen.vuMO
        destino.descripcionMO = nombre
      }
      if (unida) {
        if (!destino)
          s.items.splice(s.items.indexOf(origen) + 1, 0, {
            id: uid('it'),
            tipo: 'mo',
            descripcion: nombre,
            unidad: origen.unidad,
            cantidad: origen.cantidad,
            vuMO: origen.vuMO,
            vuMaterial: 0,
            proveedorId: null,
            cantInstalada: origen.cantInstalada,
          })
        origen.vuMO = 0
        delete origen.descripcionMO
      } else if (destino) {
        s.items = s.items.filter((x) => x.id !== origen.id)
      }
    })

  const quitar = () =>
    unida
      ? editar(item.id, (i) => {
          i.vuMO = 0
          delete i.descripcionMO
        })
      : editar(item.id, (_, s) => void (s.items = s.items.filter((x) => x.id !== item.id)))

  return (
    <div className={cn(rejilla, 'group items-start py-1.5 transition-colors hover:bg-slate-50/70')}>
      <Descripcion
        valor={descripcion}
        onChange={(d) => editar(item.id, (i) => void (unida ? (i.descripcionMO = d) : (i.descripcion = d)))}
        etiqueta="Descripción de la mano de obra"
      />
      <div className="min-w-0">
        <Cantidad
          id={unida ? `mo-${item.id}` : item.id}
          valor={item.cantidad}
          unidad={item.unidad}
          disabled={unida}
          onChange={(n) => editar(item.id, (i) => void (i.cantidad = n))}
          onUnidad={unida ? undefined : () => editar(item.id, (i) => void (i.unidad = i.unidad === 'Un' ? 'Mts' : 'Un'))}
          etiqueta={`Cantidad de ${descripcion}`}
        />
        {bloqueada ? (
          unida && <p className="mt-1 truncate px-1 text-xs leading-[18px] text-slate-500">Igual al material</p>
        ) : (
          <select
            value={unida ? item.id : ''}
            onChange={(e) => vincular(e.target.value)}
            aria-label={`De dónde sale la cantidad de ${descripcion}`}
            className={cn(
              'mt-1 w-full cursor-pointer truncate rounded border-0 bg-transparent px-1 py-px text-xs leading-[18px] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-none',
              unida ? 'font-medium text-brand-800' : 'text-slate-500',
            )}
          >
            <option value="">Cantidad propia</option>
            {materiales.map((m) => (
              <option key={m.id} value={m.id} disabled={m.id !== item.id && tieneMOUnida(m)}>
                {m.id === item.id ? 'Igual al material' : `Igual a ${m.descripcion}`}
              </option>
            ))}
          </select>
        )}
      </div>
      <NumberInput
        data-col="precio"
        value={sinValor ? null : item.vuMO}
        allowEmpty
        decimals={3}
        prefix="$"
        placeholder="Falta"
        onChange={(n) =>
          editar(item.id, (i) => {
            // Al editar la instalación de un material se fija su nombre: así la fila no desaparece si el valor queda en 0.
            if (unida && i.descripcionMO === undefined) i.descripcionMO = etiquetaMO(i)
            i.vuMO = r3(n ?? 0)
          })
        }
        aria-label={`Valor unitario de ${descripcion}`}
        inputClassName={cn(campo, sinValor && !bloqueada && 'border-amber-200 bg-amber-50/70 placeholder:text-amber-700')}
      />
      <TotalFila valor={itemMO(item)} falta={sinValor} texto="Falta valor" />
      <Quitar bloqueada={bloqueada} etiqueta={`Quitar ${descripcion}`} onClick={quitar} />
    </div>
  )
}

function Quitar({ bloqueada, etiqueta, onClick }: { bloqueada?: boolean; etiqueta: string; onClick: () => void }) {
  if (bloqueada) return <div />
  return (
    <IconButton label={etiqueta} onClick={onClick} className="text-slate-400 hover:text-red-700">
      <Trash2 />
    </IconButton>
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
