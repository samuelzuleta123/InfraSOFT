import type { Cliente, FacturaProveedor, OrdenCompra, Proyecto } from '@/types'

export interface Resultado {
  proyecto: Proyecto
  /** Qué documento coincidió, para mostrarlo en la lista. */
  coincidencia: string | null
  tab?: string
}

export const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s\-.]/g, '')

/** Busca proyectos por nombre, cliente o cualquier número de documento (cotización, OC, factura, remisión). */
export function buscarProyectos(q: string, proyectos: Proyecto[], clientes: Cliente[], ordenes: OrdenCompra[], facturas: FacturaProveedor[]): Resultado[] {
  const t = normal(q)
  if (!t) return proyectos.map((p) => ({ proyecto: p, coincidencia: null }))
  const out: Resultado[] = []
  for (const p of proyectos) {
    const cliente = clientes.find((c) => c.id === p.clienteId)
    const docs: [string, string, string?][] = [
      ...p.cotizacion.versiones.map((v) => [`${p.cotizacion.consecutivo} ${v.nombre}`, 'Cotización', 'cotizacion'] as [string, string, string]),
      [p.cotizacion.consecutivo, 'Cotización', 'cotizacion'],
    ]
    if (p.ocCliente) docs.push([p.ocCliente.numero, 'OC del cliente', 'compras'])
    for (const oc of ordenes.filter((o) => o.proyectoId === p.id)) docs.push([oc.consecutivo, 'OC a proveedor', 'compras'])
    for (const f of facturas.filter((f) => f.proyectoId === p.id)) {
      docs.push([f.numero, 'Factura de proveedor', 'documentos'])
      if (f.notas) docs.push([f.notas, 'Factura de proveedor', 'documentos'])
    }
    if (p.facturaCliente) docs.push([p.facturaCliente.numero, 'Factura al cliente', 'cierre'])
    if (p.entrega.remision) docs.push([`Remisión ${p.entrega.remision}`, 'Remisión', 'entrega'])
    for (const s of p.seriales) docs.push([s.serial, 'Serial', 'ejecucion'])

    const doc = docs.find(([n]) => normal(n).includes(t))
    if (doc) {
      out.push({ proyecto: p, coincidencia: `${doc[1]} ${doc[0]}`, tab: doc[2] })
      continue
    }
    if ([p.nombre, p.codigo, p.sede, cliente?.nombre ?? '', cliente?.nit ?? ''].some((x) => normal(x).includes(t))) out.push({ proyecto: p, coincidencia: null })
  }
  return out
}
