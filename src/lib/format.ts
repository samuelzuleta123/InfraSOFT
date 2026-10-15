import type { ISODate } from '@/types'

/** $1.234.567 — pesos colombianos sin decimales. */
export function money(n: number | null | undefined): string {
  const v = Math.round(n ?? 0)
  const abs = Math.abs(v).toLocaleString('es-CO', { maximumFractionDigits: 0 })
  return `${v < 0 ? '-' : ''}$${abs}`
}

/** Precisión de los valores unitarios: 3 decimales. Los totales siempre van al peso. */
export const r3 = (n: number) => Math.round(n * 1000) / 1000

/** Valor unitario: $7.547,54 — hasta 3 decimales, solo si los tiene. */
export function moneyUnit(n: number | null | undefined): string {
  const v = r3(n ?? 0)
  const abs = Math.abs(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
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

/** Fecha local de hoy (AAAA-MM-DD). Local y no UTC: en Colombia, después de las 7 p. m. UTC ya es mañana. */
export function hoy(): ISODate {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fecha de hoy al cargar la app. */
export const HOY: ISODate = hoy()

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

/**
 * Interpreta texto colombiano: "1.234.567,50" → 1234567.5 ; "" → null.
 * Sin coma, el punto es separador de miles solo si tiene esa forma exacta ("1.234", "12.345.678");
 * si no, es el decimal ("2650.5" → 2650.5, "7547.54" → 7547.54), como lo escribe un teclado numérico.
 * Caso ambiguo: "35.136" se lee como 35136 (miles), que es la convención es-CO.
 */
export function parseNumero(s: string): number | null {
  const limpio = s.replace(/\$/g, '').replace(/\s/g, '')
  const miles = limpio.includes(',') || /^-?\d{1,3}(\.\d{3})+$/.test(limpio)
  const t = miles ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  if (t === '' || t === '-') return null
  const n = Number(t)
  return isFinite(n) ? n : null
}

/**
 * Formato en vivo de un campo numérico: pone los puntos de miles mientras se digita ("1234567,5" → "1.234.567,5").
 * El punto es siempre separador de miles; un punto recién digitado al final se toma como la coma decimal
 * (así escribe el teclado numérico). Un texto pegado se interpreta completo con parseNumero.
 */
export function numeroEnVivo(digitado: string, anterior: string, decimals: number): string {
  let s = digitado.replace(/[^\d.,-]/g, '')
  // Un 0 que ya estaba no es una cifra del usuario: al escribir encima (antes o después del cursor) se reemplaza, no queda "30" ni "03".
  if (anterior === '0' && /^\d{2}$/.test(s)) s = s.replace('0', '')
  if (s.length > anterior.length + 1) {
    const n = parseNumero(s)
    return n === null ? '' : numeroEditable(n, decimals)
  }
  if (decimals > 0 && s.endsWith('.') && s.slice(0, -1) === anterior && !anterior.includes(',')) s = `${s.slice(0, -1)},`
  const negativo = s.startsWith('-')
  const [entero = '', ...resto] = s.replace(/[-.]/g, '').split(',')
  const conComa = resto.length > 0 && decimals > 0
  const ent = entero.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negativo ? '-' : ''}${ent || (conComa ? '0' : '')}${conComa ? `,${resto.join('').slice(0, decimals)}` : ''}`
}

/** Para mostrar en un input mientras se edita: 65743.2 → "65.743,2" */
export function numeroEditable(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined) return ''
  return n.toLocaleString('es-CO', { maximumFractionDigits: decimals })
}

export function uid(prefijo = 'id'): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}
