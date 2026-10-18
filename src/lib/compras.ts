import type { OrdenCompra, VersionCotizacion } from '@/types'
import { esMaterial } from './calc'
import { HOY, uid } from './format'

/** Una OC por cada proveedor asignado en la cotización. Solo se compra el material (la mano de obra es propia). */
export function generarOrdenes(
  proyectoId: string,
  version: VersionCotizacion,
  consecutivo: (proveedorId: string, indice: number) => string,
): OrdenCompra[] {
  const porProveedor = new Map<string, OrdenCompra>()
  for (const item of version.secciones.flatMap((s) => s.items)) {
    if (!item.proveedorId || item.vuMaterial <= 0 || item.cantidad <= 0) continue
    let oc = porProveedor.get(item.proveedorId)
    if (!oc) {
      oc = {
        id: uid('oc'),
        consecutivo: consecutivo(item.proveedorId, porProveedor.size),
        proyectoId,
        proveedorId: item.proveedorId,
        proveedorOriginalId: item.proveedorId,
        fecha: HOY,
        lineas: [],
      }
      porProveedor.set(item.proveedorId, oc)
    }
    oc.lineas.push({
      id: uid('lin'),
      itemId: item.id,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precioUnitario: item.vuMaterial,
      cantidadCotizada: item.cantidad,
      precioCotizado: item.vuMaterial,
    })
  }
  return [...porProveedor.values()]
}

/** Materiales a los que les falta proveedor o costo: sin ambos no se puede enviar la cotización ni comprarlos. */
export function materialesIncompletos(v: VersionCotizacion) {
  const materiales = v.secciones.flatMap((s) => s.items).filter(esMaterial)
  const sinProveedor = materiales.filter((i) => !i.proveedorId)
  const sinPrecio = materiales.filter((i) => i.vuMaterial <= 0)
  const total = materiales.filter((i) => !i.proveedorId || i.vuMaterial <= 0).length
  const partes = [
    sinProveedor.length && `${sinProveedor.length} sin proveedor`,
    sinPrecio.length && `${sinPrecio.length} sin precio`,
  ].filter(Boolean)
  return { total, resumen: partes.join(' y ') }
}

/** Ítems con material pero sin proveedor: no entran en ninguna OC. */
export const itemsSinProveedor = (v: VersionCotizacion) =>
  v.secciones.flatMap((s) => s.items).filter((i) => !i.proveedorId && i.vuMaterial > 0)

/** Consecutivo de OC de la empresa: AAMM-NNN (ej. 2610-001). */
export function formatoConsecutivoOC(fechaISO: string, n: number) {
  return `${fechaISO.slice(2, 4)}${fechaISO.slice(5, 7)}-${String(n).padStart(3, '0')}`
}
