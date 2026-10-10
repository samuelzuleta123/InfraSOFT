import type { Proyecto } from '@/types'
import { fecha } from './format'

/** Mismo formato que la empresa usa hoy en las observaciones del POS (ver FE 500): una línea por concepto. */
export function textoObservaciones(p: Proyecto) {
  const lineas: string[] = []
  lineas.push(`${p.nombre}${p.ocCliente ? `, según orden de compra ${p.ocCliente.numero}` : ''}.`)
  const porReferencia = new Map<string, string[]>()
  for (const s of p.seriales) porReferencia.set(`${s.equipo} ${s.referencia}`, [...(porReferencia.get(`${s.equipo} ${s.referencia}`) ?? []), s.serial])
  for (const [ref, seriales] of porReferencia)
    lineas.push(seriales.length === 1 ? `${ref}: S/N: ${seriales[0]}` : `${ref}: ${seriales.map((sn, i) => `S/N${i + 1}: ${sn}`).join(', ')}`)
  if (p.entrega.garantia) lineas.push(p.entrega.garantia)
  if (p.entrega.remision) lineas.push(`Entregados con Remisión No. ${p.entrega.remision}${p.entrega.fechaRemision ? `, ${fecha(p.entrega.fechaRemision)}` : ''}`)
  return lineas.map((l) => `- ${l}`).join('\n')
}
