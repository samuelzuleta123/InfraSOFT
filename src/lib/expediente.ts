// Expediente del proyecto: documentos y línea de tiempo derivados de los datos registrados.
import type { Adjunto, ContextoDoc, FacturaProveedor, ISODate, OrdenCompra, Proveedor, Proyecto } from '@/types'
import { resumen, totalFactura, totalOC } from './calc'

export type GrupoDoc = 'Cotización' | 'Cliente' | 'Compras' | 'Proveedores' | 'Obra' | 'Entrega' | 'Facturación'

export interface DocExpediente {
  id: string
  grupo: GrupoDoc
  tipo: string
  numero: string
  fecha: ISODate | null
  detalle?: string
  /** A quién corresponde (p. ej. el proveedor): va visible en la miniatura en vez de cortarse en el detalle. */
  destacado?: string
  valor?: number
  /** Ruta interna (documentos generados por el sistema) o adjunto con vista previa. */
  ruta?: string
  adjunto?: Adjunto
  contexto?: ContextoDoc
  extra?: Adjunto[]
}

export function documentosProyecto(p: Proyecto, ordenes: OrdenCompra[], facturas: FacturaProveedor[], proveedores: Proveedor[]): DocExpediente[] {
  const prov = (id: string | null) => (id ? (proveedores.find((x) => x.id === id)?.nombre ?? '') : 'Sin proveedor')
  const docs: DocExpediente[] = []
  for (const v of p.cotizacion.versiones)
    docs.push({
      id: `cot-${v.id}`,
      grupo: 'Cotización',
      tipo: 'Cotización',
      numero: `${p.cotizacion.consecutivo}-${v.nombre.toUpperCase()}`,
      fecha: v.creada,
      detalle: v.estado[0].toUpperCase() + v.estado.slice(1),
      valor: resumen(v).precioVigente,
      ruta: `/proyectos/${p.id}/cotizacion/pdf?version=${v.id}`,
    })
  if (p.ocCliente)
    docs.push({
      id: 'oc-cliente',
      grupo: 'Cliente',
      tipo: 'OC del cliente',
      numero: p.ocCliente.numero,
      fecha: p.ocCliente.fecha,
      valor: p.ocCliente.valor,
      adjunto: p.ocCliente.adjunto ?? { nombre: `${p.ocCliente.numero}.pdf`, tipo: 'pdf' },
      contexto: { tipo: 'ocCliente', proyectoId: p.id },
    })
  for (const o of ordenes.filter((x) => x.proyectoId === p.id))
    docs.push({ id: o.id, grupo: 'Compras', tipo: 'OC a proveedor', numero: `OC ${o.consecutivo}`, fecha: o.fecha, destacado: prov(o.proveedorId), valor: totalOC(o), ruta: `/proyectos/${p.id}/oc/${o.id}` })
  for (const f of facturas.filter((x) => x.proyectoId === p.id)) {
    const pdf = f.adjuntos.find((a) => a.tipo === 'pdf')
    docs.push({
      id: f.id,
      grupo: 'Proveedores',
      tipo: 'Factura de proveedor',
      numero: f.numero,
      fecha: f.fecha,
      destacado: prov(f.proveedorId),
      valor: totalFactura(f),
      adjunto: pdf,
      contexto: { tipo: 'facturaProveedor', id: f.id },
      extra: f.adjuntos.filter((a) => a !== pdf),
    })
  }
  p.imprevistos.forEach((i) => {
    if (i.foto) docs.push({ id: i.id, grupo: 'Obra', tipo: 'Foto de imprevisto', numero: i.foto.nombre, fecha: i.fecha, detalle: i.texto, adjunto: i.foto, contexto: { tipo: 'foto', titulo: i.texto, tono: 25 } })
  })
  if (p.entrega.remision)
    docs.push({ id: 'remision', grupo: 'Entrega', tipo: 'Remisión', numero: `Remisión No. ${p.entrega.remision}`, fecha: p.entrega.fechaRemision ?? p.entrega.fechaEntrega, ruta: `/proyectos/${p.id}/entrega/remision` })
  if (p.entrega.fechaEntrega) docs.push({ id: 'informe', grupo: 'Entrega', tipo: 'Informe de entrega', numero: 'Informe de entrega', fecha: p.entrega.fechaEntrega, ruta: `/proyectos/${p.id}/entrega/informe` })
  if (p.entrega.certificacion)
    docs.push({ id: 'cert', grupo: 'Entrega', tipo: 'Certificación', numero: p.entrega.certificacion.nombre, fecha: p.entrega.fechaEntrega, adjunto: p.entrega.certificacion, contexto: { tipo: 'certificacion', proyectoId: p.id } })
  if (p.entrega.actaFirmada)
    docs.push({ id: 'acta', grupo: 'Entrega', tipo: 'Acta de conformidad', numero: 'Acta firmada', fecha: p.entrega.fechaEntrega, adjunto: p.entrega.actaFirmada, contexto: { tipo: 'acta', proyectoId: p.id } })
  if (p.facturaCliente) {
    const fc = p.facturaCliente
    docs.push({
      id: 'fc',
      grupo: 'Facturación',
      tipo: 'Factura al cliente',
      numero: fc.numero,
      fecha: fc.fecha,
      detalle: fc.formaPago,
      valor: fc.valorBruto * (1 + (fc.ivaPct ?? 0) / 100),
      adjunto: { nombre: `${fc.numero.replace(/\s/g, '')}.pdf`, tipo: 'pdf' },
      contexto: { tipo: 'facturaCliente', proyectoId: p.id },
    })
    docs.push({ id: 'liquidacion', grupo: 'Facturación', tipo: 'Liquidación', numero: `Liquidación ${p.codigo}`, fecha: fc.fecha, detalle: 'Documento interno', ruta: `/proyectos/${p.id}/cierre/liquidacion` })
  }
  return docs
}

export type TipoEvento = 'proyecto' | 'cotizacion' | 'aprobada' | 'rechazada' | 'cliente' | 'compra' | 'factura' | 'obra' | 'entrega' | 'cierre'

export interface Evento {
  fecha: ISODate
  tipo: TipoEvento
  titulo: string
  detalle?: string
  valor?: number
  doc?: DocExpediente
}

/** Línea de tiempo del proyecto, de lo más antiguo a lo más reciente. */
export function historialProyecto(p: Proyecto, ordenes: OrdenCompra[], facturas: FacturaProveedor[], proveedores: Proveedor[]): Evento[] {
  const docs = documentosProyecto(p, ordenes, facturas, proveedores)
  const doc = (id: string) => docs.find((d) => d.id === id)
  const prov = (id: string | null) => (id ? (proveedores.find((x) => x.id === id)?.nombre ?? '') : 'Sin proveedor')
  const ev: Evento[] = [{ fecha: p.creado, tipo: 'proyecto', titulo: 'Proyecto creado', detalle: `${p.codigo} · ${p.sede}` }]
  if (p.levantamiento)
    ev.push({
      fecha: p.levantamiento.fecha,
      tipo: 'obra',
      titulo: 'Levantamiento en sitio',
      detalle: `${p.levantamiento.medidas.length} medidas · ${p.fotos.filter((f) => f.etapa === 'levantamiento').length} fotos · ${p.levantamiento.rackOrigen} → ${p.levantamiento.rackDestino}`,
    })
  for (const v of p.cotizacion.versiones)
    for (const h of v.historial) {
      const nombre = `Cotización ${p.cotizacion.consecutivo} ${v.nombre}`
      const titulo = { borrador: `${nombre} creada`, enviada: `${nombre} enviada al cliente`, aprobada: `${nombre} aprobada`, rechazada: `${nombre} rechazada` }[h.estado]
      ev.push({
        fecha: h.fecha,
        tipo: h.estado === 'aprobada' ? 'aprobada' : h.estado === 'rechazada' ? 'rechazada' : 'cotizacion',
        titulo,
        detalle: h.motivo ? `Motivo: ${h.motivo}${h.nota ? ` · ${h.nota}` : ''}` : undefined,
        valor: h.estado === 'borrador' ? undefined : resumen(v).precioVigente,
        doc: doc(`cot-${v.id}`),
      })
    }
  if (p.ocCliente) ev.push({ fecha: p.ocCliente.fecha, tipo: 'cliente', titulo: `OC del cliente ${p.ocCliente.numero} recibida`, valor: p.ocCliente.valor, doc: doc('oc-cliente') })
  for (const o of ordenes.filter((x) => x.proyectoId === p.id))
    ev.push({ fecha: o.fecha, tipo: 'compra', titulo: `Orden de compra ${o.consecutivo} emitida`, detalle: prov(o.proveedorId), valor: totalOC(o), doc: doc(o.id) })
  for (const f of facturas.filter((x) => x.proyectoId === p.id))
    ev.push({ fecha: f.fecha, tipo: 'factura', titulo: `Factura ${f.numero} de proveedor recibida`, detalle: `${prov(f.proveedorId)}${f.pagada ? ' · pagada' : ''}`, valor: totalFactura(f), doc: doc(f.id) })
  for (const i of p.imprevistos) ev.push({ fecha: i.fecha, tipo: 'obra', titulo: 'Imprevisto registrado en obra', detalle: i.texto, doc: doc(i.id) })
  if (p.entrega.remision && (p.entrega.fechaRemision ?? p.entrega.fechaEntrega))
    ev.push({ fecha: (p.entrega.fechaRemision ?? p.entrega.fechaEntrega)!, tipo: 'entrega', titulo: `Remisión No. ${p.entrega.remision}`, detalle: `${p.seriales.length} equipos con serial`, doc: doc('remision') })
  if (p.entrega.fechaEntrega) {
    ev.push({ fecha: p.entrega.fechaEntrega, tipo: 'entrega', titulo: 'Entrega e informe al cliente', detalle: p.entrega.certificacion ? 'Con certificación adjunta' : undefined, doc: doc('informe') })
    if (p.entrega.actaFirmada) ev.push({ fecha: p.entrega.fechaEntrega, tipo: 'entrega', titulo: 'Acta de conformidad firmada', doc: doc('acta') })
  }
  if (p.facturaCliente) ev.push({ fecha: p.facturaCliente.fecha, tipo: 'cierre', titulo: `Factura ${p.facturaCliente.numero} emitida al cliente`, detalle: p.facturaCliente.formaPago, valor: doc('fc')?.valor, doc: doc('fc') })
  // Orden estable: por fecha y, en la misma fecha, en el orden lógico del flujo.
  return ev.map((e, i) => ({ e, i })).sort((a, b) => a.e.fecha.localeCompare(b.e.fecha) || a.i - b.i).map(({ e }) => e)
}
