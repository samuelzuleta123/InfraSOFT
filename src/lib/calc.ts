// Todos los cálculos del sistema se derivan aquí a partir de los datos; nada se guarda precalculado.
import type {
  FacturaProveedor,
  ItemCotizacion,
  LineaOC,
  OtroCosto,
  OrdenCompra,
  PrecioProveedor,
  Proyecto,
  Seccion,
  VersionCotizacion,
} from '@/types'
import { r3 } from './format'

// Los unitarios llevan hasta 3 decimales; cada total de línea se redondea al peso para que
// la suma de las líneas impresas sea exactamente el total del documento.
export const itemMO = (i: ItemCotizacion) => Math.round(i.cantidad * i.vuMO)
export const itemMaterial = (i: ItemCotizacion) => Math.round(i.cantidad * i.vuMaterial)
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

export const totalOtroCosto = (o: OtroCosto) => Math.round(o.cantidad * o.valorUnitario)
export const totalOtros = (v: VersionCotizacion) => v.otrosCostos.reduce((acc, o) => acc + totalOtroCosto(o), 0)

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

/** Reparte un total entre los ítems con unitarios de 3 decimales; devuelve las líneas y el residuo que no se pudo absorber. */
function repartir(v: VersionCotizacion, total: number) {
  const r = resumen(v)
  const directo = r.mo + r.material
  const factor = directo > 0 ? total / directo : 0
  const lineas: ItemCliente[] = todosLosItems(v).map((item) => {
    const unitario = item.cantidad ? r3((itemSubtotal(item) * factor) / item.cantidad) : 0
    return { item, unitario, total: Math.round(item.cantidad * unitario) }
  })
  let residuo = total - lineas.reduce((a, l) => a + l.total, 0)
  if (residuo === 0) return { lineas, residuo }

  // Primero cantidad 1 y luego las de menor cantidad: son las que pueden llegar a un total exacto.
  const candidatas = lineas.filter((l) => l.item.cantidad > 0).sort((a, b) => a.item.cantidad - b.item.cantidad || b.total - a.total)
  const ajustar = (l: ItemCliente, objetivo: number) => {
    const unitario = r3(objetivo / l.item.cantidad)
    const nuevo = Math.round(l.item.cantidad * unitario)
    if (nuevo < 0) return
    residuo -= nuevo - l.total
    l.unitario = unitario
    l.total = nuevo
  }

  // 1. Una sola línea absorbe todo el residuo de forma exacta (siempre posible con hasta 1.000 unidades).
  const exacta = candidatas.find((l) => {
    const objetivo = l.total + residuo
    return objetivo >= 0 && Math.round(l.item.cantidad * r3(objetivo / l.item.cantidad)) === objetivo
  })
  if (exacta) ajustar(exacta, exacta.total + residuo)

  // 2. Si ninguna puede sola (todas con más de 1.000 unidades), el residuo se reparte de a poco entre varias.
  for (let pasada = 0; residuo !== 0 && pasada < 5; pasada++)
    for (const l of candidatas) {
      if (residuo === 0) break
      ajustar(l, l.total + residuo)
    }
  return { lineas, residuo }
}

export interface ItemCliente {
  item: ItemCotizacion
  total: number
  unitario: number
}

/**
 * Precios que ve el cliente: el precio vigente se reparte entre los ítems en proporción
 * a su costo directo. El unitario lleva 3 decimales y el total de cada línea es
 * cantidad × unitario redondeado al peso, así que cualquiera puede recalcular el documento
 * y la suma de las líneas da el valor cotizado. Nunca expone proveedores ni costos internos.
 *
 * `cuadra` es falso solo cuando el precio no se puede repartir exacto (p. ej. una única línea
 * de más de 1.000 unidades): en ese caso `precioCuadrable` sugiere el precio final más cercano que sí.
 */
export function preciosCliente(v: VersionCotizacion) {
  const total = Math.round(resumen(v).precioVigente)
  const { lineas, residuo } = repartir(v, total)
  const secciones = v.secciones.map((s) => {
    const items = lineas.filter((ic) => s.items.some((i) => i.id === ic.item.id))
    return { seccion: s, items, total: items.reduce((a, b) => a + b.total, 0) }
  })
  return { total, secciones, cuadra: residuo === 0 }
}

/** Precio final más cercano al vigente que se reparte exacto al peso; null si no hay ítems donde repartirlo. */
export function precioCuadrable(v: VersionCotizacion): number | null {
  const base = Math.round(resumen(v).precioVigente)
  for (let d = 0; d <= 50; d++)
    for (const candidato of d === 0 ? [base] : [base + d, base - d])
      if (candidato >= 0 && repartir(v, candidato).residuo === 0) return candidato
  return null
}

export const precioNeto = (p: Pick<PrecioProveedor, 'precioLista' | 'descuentoPct'>) =>
  r3(p.precioLista * (1 - (p.descuentoPct ?? 0) / 100))

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
  i.cantInstalada === null ? null : Math.round(i.cantInstalada * i.vuMO) + Math.round(i.cantInstalada * i.vuMaterial)

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
      moReal: Math.round(instalada * i.vuMO),
      materialReal: Math.round(instalada * i.vuMaterial),
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
