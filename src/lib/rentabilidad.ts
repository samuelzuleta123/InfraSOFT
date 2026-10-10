import type { Proyecto } from '@/types'
import { liquidacion, resumen } from './calc'

export interface FilaRentabilidad {
  proyecto: Proyecto
  /** Fecha de aprobación de la cotización: define el período. */
  fecha: string
  cerrado: boolean
  precio: number
  costoReal: number
  utilidadEstimada: number
  utilidadReal: number
  margenReal: number
}

/** Proyectos con cotización aprobada. En los que siguen en curso, lo no registrado en obra se toma como cotizado. */
export function filasRentabilidad(proyectos: Proyecto[]): FilaRentabilidad[] {
  return proyectos.flatMap((p) => {
    const v = p.cotizacion.versiones.find((x) => x.estado === 'aprobada')
    if (!v) return []
    const l = liquidacion(v)
    return [
      {
        proyecto: p,
        fecha: v.historial.find((h) => h.estado === 'aprobada')?.fecha ?? p.creado,
        cerrado: !!p.facturaCliente,
        precio: resumen(v).precioVigente,
        costoReal: l.costoReal,
        utilidadEstimada: l.utilidadEstimada,
        utilidadReal: l.utilidadRealObra,
        margenReal: l.margenRealObra,
      },
    ]
  })
}

export function totalizar(filas: FilaRentabilidad[]) {
  const precio = filas.reduce((a, f) => a + f.precio, 0)
  const utilidadReal = filas.reduce((a, f) => a + f.utilidadReal, 0)
  return {
    precio,
    costoReal: filas.reduce((a, f) => a + f.costoReal, 0),
    utilidadEstimada: filas.reduce((a, f) => a + f.utilidadEstimada, 0),
    utilidadReal,
    margenReal: precio > 0 ? (utilidadReal / precio) * 100 : 0,
  }
}
