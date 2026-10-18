import type { Proyecto } from '@/types'
import { fecha } from './format'

/**
 * La garantía como frase completa para documentos corridos (acta, POS): "2 años en la instalación" →
 * "Garantía: 2 años en la instalación." Si el texto ya empieza por "Garantía", se respeta tal cual.
 */
export function fraseGarantia(garantia: string) {
  const g = garantia.trim()
  if (!g) return ''
  const frase = /^garant[ií]a/i.test(g) ? g : `Garantía: ${g}`
  return /[.!?]$/.test(frase) ? frase : `${frase}.`
}

/** Mismo formato que la empresa usa hoy en las observaciones del POS (ver FE 500): una línea por concepto. */
export function textoObservaciones(p: Proyecto) {
  const lineas: string[] = []
  lineas.push(`${p.nombre}${p.ocCliente ? `, según orden de compra ${p.ocCliente.numero}` : ''}.`)
  const porReferencia = new Map<string, string[]>()
  for (const s of p.seriales) porReferencia.set(`${s.equipo} ${s.referencia}`, [...(porReferencia.get(`${s.equipo} ${s.referencia}`) ?? []), s.serial])
  for (const [ref, seriales] of porReferencia)
    lineas.push(seriales.length === 1 ? `${ref}: S/N: ${seriales[0]}` : `${ref}: ${seriales.map((sn, i) => `S/N${i + 1}: ${sn}`).join(', ')}`)
  if (p.entrega.garantia.trim()) lineas.push(fraseGarantia(p.entrega.garantia))
  if (p.entrega.remision) lineas.push(`Entregados con Remisión No. ${p.entrega.remision}${p.entrega.fechaRemision ? `, ${fecha(p.entrega.fechaRemision)}` : ''}`)
  return lineas.map((l) => `- ${l}`).join('\n')
}
