import type { ISODate } from '@/types'

/** $1.234.567 — pesos colombianos sin decimales. */
export function money(n: number | null | undefined): string {
  const v = Math.round(n ?? 0)
  const abs = Math.abs(v).toLocaleString('es-CO', { maximumFractionDigits: 0 })
  return `${v < 0 ? '-' : ''}$${abs}`
}

/** Diferencia con signo explícito: +$12.000 / -$3.500 */
export function moneySigned(n: number): string {
  const v = Math.round(n)
  if (v === 0) return '$0'
  return `${v > 0 ? '+' : '-'}${money(Math.abs(v))}`
}

export function num(n: number, decimals = 0): string {
  return n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

export function pct(n: number, decimals = 1): string {
  if (!isFinite(n)) return '—'
  return `${n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`
}

/** AAAA-MM-DD → DD/MM/AAAA */
export function fecha(iso: ISODate | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Fecha "de hoy" del mockup. Fija para que la demo sea reproducible. */
export const HOY: ISODate = '2026-10-10'

export function diasEntre(desde: ISODate, hasta: ISODate): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10))
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10))
  return Math.round((b - a) / 86_400_000)
}

export function sumarDias(iso: ISODate, dias: number): ISODate {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)))
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Interpreta texto colombiano: "1.234.567,50" → 1234567.5 ; "" → null */
export function parseNumero(s: string): number | null {
  const t = s.replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (t === '' || t === '-') return null
  const n = Number(t)
  return isFinite(n) ? n : null
}

/** Para mostrar en un input mientras se edita: 65743.2 → "65.743,2" */
export function numeroEditable(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  return n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

export function uid(prefijo = 'id'): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}
