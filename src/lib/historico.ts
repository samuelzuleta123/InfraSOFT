// Histórico de precios reales de compra: lo que cada proveedor facturó por un material en
// cada proyecto. Se deriva de los datos (factura → línea de la OC → ítem de la cotización →
// material); no se guarda nada aparte.
import { pct } from './format'
import type { FacturaProveedor, ISODate, ItemCotizacion, LineaFactura, LineaOC, OrdenCompra, Proyecto } from '@/types'

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9/"]+/g, ' ')
    .trim()

export interface ParFacturaOC {
  lf: LineaFactura | null
  lo: LineaOC | null
}

/** Empareja cada línea de la factura con su línea de la OC por descripción. Las líneas de OC sin facturar quedan al final. */
export function emparejar(f: FacturaProveedor, oc: OrdenCompra): ParFacturaOC[] {
  const usadas = new Set<string>()
  const pares: ParFacturaOC[] = f.lineas.map((lf) => {
    const n = normal(lf.descripcion)
    const lo = oc.lineas.find((l) => !usadas.has(l.id) && (normal(l.descripcion) === n || normal(l.descripcion).includes(n) || n.includes(normal(l.descripcion)))) ?? null
    if (lo) usadas.add(lo.id)
    return { lf, lo }
  })
  for (const lo of oc.lineas.filter((l) => !usadas.has(l.id))) pares.push({ lf: null, lo })
  return pares
}

export interface CompraMaterial {
  materialId: string
  fecha: ISODate
  proveedorId: string
  proyectoId: string
  ocConsecutivo: string
  /** Número de la factura del proveedor; null si la OC aún no tiene factura. */
  factura: string | null
  cantidad: number
  /** Precio unitario facturado (o el ordenado, si todavía no hay factura). */
  precio: number
  /** Precio unitario de la OC, para ver si el proveedor cobró lo acordado. */
  precioOC: number
}

function materialDeItem(proyectos: Proyecto[], proyectoId: string, itemId: string | null) {
  if (!itemId) return undefined
  const p = proyectos.find((x) => x.id === proyectoId)
  for (const v of p?.cotizacion.versiones ?? [])
    for (const s of v.secciones) {
      const i = s.items.find((x) => x.id === itemId)
      if (i) return i.materialId
    }
  return undefined
}

/** Todas las compras de materiales, de la más reciente a la más antigua. */
export function historicoCompras(proyectos: Proyecto[], ordenes: OrdenCompra[], facturas: FacturaProveedor[]): CompraMaterial[] {
  const compras: CompraMaterial[] = []
  for (const oc of ordenes) {
    const facturasOC = facturas.filter((f) => f.ocId === oc.id)
    const facturadas = new Set<string>()
    for (const f of facturasOC)
      for (const { lf, lo } of emparejar(f, oc)) {
        if (!lf || !lo) continue
        const materialId = materialDeItem(proyectos, oc.proyectoId, lo.itemId)
        if (!materialId) continue
        facturadas.add(lo.id)
        compras.push({ materialId, fecha: f.fecha, proveedorId: f.proveedorId ?? oc.proveedorId, proyectoId: oc.proyectoId, ocConsecutivo: oc.consecutivo, factura: f.numero, cantidad: lf.cantidad, precio: lf.precioUnitario, precioOC: lo.precioUnitario })
      }
    // Lo ordenado y aún sin factura también cuenta como referencia de precio.
    for (const lo of oc.lineas) {
      if (facturadas.has(lo.id)) continue
      const materialId = materialDeItem(proyectos, oc.proyectoId, lo.itemId)
      if (!materialId) continue
      compras.push({ materialId, fecha: oc.fecha, proveedorId: oc.proveedorId, proyectoId: oc.proyectoId, ocConsecutivo: oc.consecutivo, factura: null, cantidad: lo.cantidad, precio: lo.precioUnitario, precioOC: lo.precioUnitario })
    }
  }
  return compras.sort((a, b) => b.fecha.localeCompare(a.fecha) || (a.factura ? 0 : 1) - (b.factura ? 0 : 1))
}

/** Variación del precio digitado frente a la última compra: a partir de este umbral se avisa en el cotizador. */
export const UMBRAL_VARIACION_PRECIO = 0.1

/** Última compra del material, sin contar el proyecto que se está cotizando. */
export function ultimaCompra(compras: CompraMaterial[], materialId: string | undefined, excluirProyectoId?: string) {
  if (!materialId) return undefined
  return compras.find((c) => c.materialId === materialId && c.proyectoId !== excluirProyectoId)
}

export interface ComparacionPrecio {
  compra: CompraMaterial
  /** Variación del precio cotizado frente a la última compra (0,1 = 10 % más caro). */
  variacion: number
  fuera: boolean
}

/**
 * Variación con signo para mostrar: "+137 %", "-12 %". Cerca de -100 % lleva un decimal ("-99,9 %"):
 * redondeado diría que el material es gratis, y casi siempre es un precio digitado sin ceros.
 */
export function textoVariacion(variacion: number): string {
  const p = variacion * 100
  const decimales = Math.abs(p) >= 99.5 && Math.abs(p) < 100 ? 1 : 0
  return `${p > 0 ? '+' : ''}${pct(p, decimales)}`
}

/** Un precio 100 veces mayor o menor que la última compra casi siempre es un error de ceros al digitar. */
export const posibleErrorDeCeros = (c: ComparacionPrecio) => c.variacion <= -0.99 || c.variacion >= 99

/**
 * Compara el precio unitario de material de un ítem con lo que su mismo proveedor cobró en la última compra (en otro proyecto).
 * Contra otro proveedor no se compara: que cobre distinto es normal, y el aviso existe para atrapar errores de digitación.
 */
export function compararConUltimaCompra(compras: CompraMaterial[], item: ItemCotizacion, proyectoId: string): ComparacionPrecio | undefined {
  if (!item.materialId || !item.proveedorId) return undefined
  const compra = compras.find((c) => c.materialId === item.materialId && c.proveedorId === item.proveedorId && c.proyectoId !== proyectoId)
  if (!compra || item.vuMaterial <= 0 || compra.precio <= 0) return undefined
  const variacion = (item.vuMaterial - compra.precio) / compra.precio
  return { compra, variacion, fuera: Math.abs(variacion) >= UMBRAL_VARIACION_PRECIO }
}
