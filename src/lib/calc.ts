// Todos los cálculos del sistema se derivan aquí a partir de los datos; nada se guarda precalculado.
import type {
  FacturaProveedor,
  ItemCotizacion,
  LineaOC,
  OrdenCompra,
  PrecioProveedor,
  Proyecto,
  Seccion,
  VersionCotizacion,
} from '@/types'

export const itemMO = (i: ItemCotizacion) => i.cantidad * i.vuMO
export const itemMaterial = (i: ItemCotizacion) => i.cantidad * i.vuMaterial
export const itemSubtotal = (i: ItemCotizacion) => itemMO(i) + itemMaterial(i)

export function totalesSeccion(s: Seccion) {
  let mo = 0
  let material = 0
  for (const i of s.items) {
    mo += itemMO(i)
    material += itemMaterial(i)
  }
  return { mo, material, subtotal: mo + material }
}

export const totalOtros = (v: VersionCotizacion) =>
  v.otrosCostos.reduce((acc, o) => acc + o.cantidad * o.valorUnitario, 0)

export const todosLosItems = (v: VersionCotizacion) => v.secciones.flatMap((s) => s.items)

export interface Resumen {
  mo: number
  material: number
  otros: number
  costo: number
  utilidadPct: number
  ajustesPct: number
  utilidadSugerida: number
  ajustesSugeridos: number
  precioSugerido: number
  precioFinal: number | null
  /** Precio que se usa para todo lo que ve el cliente: final si existe, si no el sugerido. */
  precioVigente: number
  ajustesReales: number
  utilidadReal: number
  margenReal: number // % sobre el precio final
  utilidadSobreCosto: number // % sobre el costo
}

export function resumen(v: VersionCotizacion): Resumen {
  let mo = 0
  let material = 0
  for (const s of v.secciones) {
    const t = totalesSeccion(s)
    mo += t.mo
    material += t.material
  }
  const otros = totalOtros(v)
  const costo = mo + material + otros
  const utilidadPct = v.utilidadPct ?? 0
  const ajustesPct = v.ajustesPct ?? 0
  const utilidadSugerida = costo * (utilidadPct / 100)
  const base = costo + utilidadSugerida
  const ajustesSugeridos = base * (ajustesPct / 100)
  const precioSugerido = base + ajustesSugeridos
  const precioVigente = v.precioFinal ?? precioSugerido
  const ajustesReales = precioVigente * (ajustesPct / 100)
  const utilidadReal = precioVigente - costo - ajustesReales
  return {
    mo,
    material,
    otros,
    costo,
    utilidadPct,
    ajustesPct,
    utilidadSugerida,
    ajustesSugeridos,
    precioSugerido,
    precioFinal: v.precioFinal,
    precioVigente,
    ajustesReales,
    utilidadReal,
    margenReal: precioVigente > 0 ? (utilidadReal / precioVigente) * 100 : 0,
    utilidadSobreCosto: costo > 0 ? (utilidadReal / costo) * 100 : 0,
  }
}

export interface ItemCliente {
  item: ItemCotizacion
  total: number
  unitario: number
}

/**
 * Precios que ve el cliente: el precio vigente se reparte entre los ítems en proporción
 * a su costo directo, de modo que la suma cuadra exactamente con el valor cotizado.
 * Nunca expone proveedores ni costos internos.
 */
export function preciosCliente(v: VersionCotizacion) {
  const r = resumen(v)
  const directo = r.mo + r.material
  const factor = directo > 0 ? r.precioVigente / directo : 0
  const items: ItemCliente[] = []
  let acumulado = 0
  const todos = todosLosItems(v)
  todos.forEach((item, idx) => {
    let total = Math.round(itemSubtotal(item) * factor)
    if (idx === todos.length - 1) total = Math.round(r.precioVigente) - acumulado
    acumulado += total
    items.push({ item, total, unitario: item.cantidad ? total / item.cantidad : 0 })
  })
  const porSeccion = v.secciones.map((s) => ({
    seccion: s,
    items: items.filter((ic) => s.items.some((i) => i.id === ic.item.id)),
  }))
  return {
    total: Math.round(r.precioVigente),
    secciones: porSeccion.map((p) => ({ ...p, total: p.items.reduce((a, b) => a + b.total, 0) })),
  }
}

export const precioNeto = (p: Pick<PrecioProveedor, 'precioLista' | 'descuentoPct'>) =>
  p.precioLista * (1 - (p.descuentoPct ?? 0) / 100)

// Cada línea se redondea al peso, como lo hacen las facturas de los proveedores.
export const totalLineaOC = (l: LineaOC) => Math.round(l.cantidad * l.precioUnitario)
export const totalOC = (oc: OrdenCompra) => oc.lineas.reduce((a, l) => a + totalLineaOC(l), 0)
export const totalCotizadoLineaOC = (l: LineaOC) => Math.round((l.cantidadCotizada ?? 0) * (l.precioCotizado ?? 0))
export const totalCotizadoOC = (oc: OrdenCompra) => oc.lineas.reduce((a, l) => a + totalCotizadoLineaOC(l), 0)

export const totalFactura = (f: FacturaProveedor) => f.subtotal + f.iva

// ── Ejecución ──────────────────────────────────────────────────────────

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'

/** Umbral visual del semáforo: hasta 100 % verde, hasta 110 % amarillo, más rojo. */
export const UMBRAL_AMARILLO = 1.1

export function semaforo(presupuesto: number, real: number | null): Semaforo {
  if (real === null) return 'gris'
  if (presupuesto <= 0) return real > 0 ? 'rojo' : 'verde'
  const ratio = real / presupuesto
  if (ratio <= 1) return 'verde'
  if (ratio <= UMBRAL_AMARILLO) return 'amarillo'
  return 'rojo'
}

export const costoRealItem = (i: ItemCotizacion) =>
  i.cantInstalada === null ? null : i.cantInstalada * (i.vuMO + i.vuMaterial)

export function avanceEjecucion(v: VersionCotizacion) {
  const items = todosLosItems(v)
  const presupuesto = items.reduce((a, i) => a + itemSubtotal(i), 0)
  const registrados = items.filter((i) => i.cantInstalada !== null)
  const real = items.reduce((a, i) => a + (costoRealItem(i) ?? 0), 0)
  const presupuestoRegistrado = registrados.reduce((a, i) => a + itemSubtotal(i), 0)
  return {
    presupuesto,
    real,
    presupuestoRegistrado,
    registrados: registrados.length,
    total: items.length,
    semaforo: registrados.length ? semaforo(presupuestoRegistrado, real) : ('gris' as Semaforo),
  }
}

// ── Liquidación ────────────────────────────────────────────────────────

export function liquidacion(v: VersionCotizacion) {
  const r = resumen(v)
  const filas = todosLosItems(v).map((i) => {
    const instalada = i.cantInstalada ?? i.cantidad
    return {
      item: i,
      cotizada: i.cantidad,
      instalada,
      diferencia: instalada - i.cantidad,
      moReal: instalada * i.vuMO,
      materialReal: instalada * i.vuMaterial,
    }
  })
  const moReal = filas.reduce((a, f) => a + f.moReal, 0)
  const materialReal = filas.reduce((a, f) => a + f.materialReal, 0)
  const costoReal = moReal + materialReal + r.otros
  const utilidadRealObra = r.precioVigente - costoReal - r.ajustesReales
  return {
    filas,
    moCotizada: r.mo,
    moReal,
    materialReal,
    costoReal,
    utilidadEstimada: r.utilidadReal,
    utilidadRealObra,
    margenEstimado: r.margenReal,
    margenRealObra: r.precioVigente > 0 ? (utilidadRealObra / r.precioVigente) * 100 : 0,
  }
}

// ── Helpers de proyecto ────────────────────────────────────────────────

export const versionActiva = (p: Proyecto) =>
  p.cotizacion.versiones.find((v) => v.id === p.cotizacion.versionActivaId) ?? p.cotizacion.versiones[0]

/** La versión aprobada manda para compras, ejecución y cierre; si no hay, la activa. */
export const versionVigente = (p: Proyecto) =>
  p.cotizacion.versiones.find((v) => v.estado === 'aprobada') ?? versionActiva(p)
