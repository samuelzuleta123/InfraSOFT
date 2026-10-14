// Verifica que el cotizador del proyecto 1 cuadre con los totales esperados y que los
// precios al cliente cuadren al peso en todas las cotizaciones (cantidad × unitario = total
// de línea y la suma de líneas = valor cotizado).
import { proyectos } from '../src/data/proyectos'
import { proyectosDemo } from '../src/data/demo'
import { ordenesCompra, facturasProveedor } from '../src/data/compras'
import { facturasDemo, ordenesDemo } from '../src/data/demo'
import { precioCuadrable, preciosCliente, resumen, versionVigente } from '../src/lib/calc'
import { money, parseNumero, r3 } from '../src/lib/format'
import { historicoCompras } from '../src/lib/historico'
import type { ItemCotizacion, VersionCotizacion } from '../src/types'

const esperado = { mo: 1_613_500, material: 3_099_500, otros: 450_000, costo: 5_163_000 }
const r = resumen(versionVigente(proyectos[0]))
let ok = true
for (const k of Object.keys(esperado) as (keyof typeof esperado)[]) {
  const bien = Math.round(r[k]) === esperado[k]
  ok &&= bien
  console.log(`${bien ? '✔' : '✘'} ${k.padEnd(9)} ${money(r[k]).padStart(12)}  (esperado ${money(esperado[k])})`)
}
for (const p of proyectos.slice(1)) {
  const x = resumen(versionVigente(p))
  console.log(`  ${p.codigo}: costo ${money(x.costo)} · precio ${money(x.precioVigente)} · utilidad ${money(x.utilidadReal)}`)
}

/**
 * Devuelve el primer descuadre encontrado, o null si el documento cuadra al peso. Si el precio no se
 * puede repartir exacto, debe avisarse (cuadra = false) y el precio sugerido debe cuadrar.
 */
function descuadre(v: VersionCotizacion): string | null {
  const pc = preciosCliente(v)
  if (!pc.cuadra) {
    const sugerido = precioCuadrable(v)
    if (sugerido === null) return `no cuadra y no hay precio sugerido`
    return preciosCliente({ ...v, precioFinal: sugerido }).cuadra ? null : `el precio sugerido ${sugerido} tampoco cuadra`
  }
  const lineas = pc.secciones.flatMap((s) => s.items)
  for (const l of lineas) {
    if (r3(l.unitario) !== l.unitario) return `${l.item.descripcion}: unitario con más de 3 decimales (${l.unitario})`
    if (Math.round(l.item.cantidad * l.unitario) !== l.total) return `${l.item.descripcion}: ${l.item.cantidad} × ${l.unitario} ≠ ${l.total}`
  }
  const suma = lineas.reduce((a, l) => a + l.total, 0)
  if (suma !== pc.total) return `suma de líneas ${suma} ≠ total ${pc.total}`
  const sumaSecciones = pc.secciones.reduce((a, s) => a + s.total, 0)
  if (sumaSecciones !== pc.total) return `suma de secciones ${sumaSecciones} ≠ total ${pc.total}`
  return null
}

let versiones = 0
for (const p of [...proyectos, ...proyectosDemo])
  for (const v of p.cotizacion.versiones) {
    versiones++
    const e = descuadre(v)
    if (e) {
      ok = false
      console.log(`✘ ${p.codigo} ${v.nombre}: ${e}`)
    }
  }
console.log(`${ok ? '✔' : '✘'} precios al cliente cuadran al peso en ${versiones} versiones de cotización`)

// Prueba con cotizaciones aleatorias: cantidades con decimales y de más de 1.000 unidades,
// unitarios con descuento y precios finales “redondos”.
let semilla = 7
const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646
const entre = (a: number, b: number) => a + azar() * (b - a)
let fallas = 0
const PRUEBAS = 2000
for (let n = 0; n < PRUEBAS; n++) {
  const items: ItemCotizacion[] = Array.from({ length: 1 + Math.floor(entre(0, n % 4 === 0 ? 2 : 25)) }, (_, i) => ({
    id: `t${i}`,
    descripcion: `Ítem ${i}`,
    unidad: azar() < 0.5 ? 'Un' : 'Mts',
    cantidad: azar() < 0.15 ? Math.ceil(entre(1000, 6000)) : azar() < 0.3 ? Math.round(entre(1, 800) * 10) / 10 : Math.ceil(entre(0, 120)),
    vuMO: Math.round(entre(0, 90_000)),
    vuMaterial: r3(entre(500, 600_000) * (1 - Math.floor(entre(0, 30)) / 100)),
    proveedorId: null,
    cantInstalada: null,
  }))
  const v: VersionCotizacion = {
    id: 'v',
    nombre: 'v1',
    creada: '2026-10-10',
    secciones: [{ id: 's1', nombre: 'A', items: items.slice(0, 5) }, { id: 's2', nombre: 'B', items: items.slice(5) }],
    otrosCostos: [{ clave: 'siso', nombre: 'SG-SST', cantidad: 1, valorUnitario: Math.round(entre(0, 400_000)) }],
    utilidadPct: Math.round(entre(0, 40)),
    ajustesPct: Math.round(entre(0, 5)),
    precioFinal: azar() < 0.5 ? null : Math.round(entre(1, 50)) * 100_000,
    estado: 'borrador',
    historial: [],
  }
  if (descuadre(v)) fallas++
}
ok &&= fallas === 0
console.log(`${fallas === 0 ? '✔' : '✘'} ${PRUEBAS - fallas} de ${PRUEBAS} cotizaciones aleatorias cuadran al peso`)

// Lectura de números escritos por el usuario (punto o coma como decimal).
const numeros: [string, number][] = [['2650.5', 2650.5], ['7547.54', 7547.54], ['2650.505', 2650.505], ['7.547,54', 7547.54], ['1.234.567', 1234567], ['35.136', 35136]]
const malLeidos = numeros.filter(([t, e]) => parseNumero(t) !== e)
ok &&= malLeidos.length === 0
console.log(`${malLeidos.length ? '✘' : '✔'} números escritos se interpretan bien${malLeidos.length ? `: ${malLeidos.map(([t]) => t).join(', ')}` : ''}`)

// Histórico de compras: la factura DRG-293076 cobró el cable F-UTP a $2.772 frente a $2.650 de la OC.
const historico = historicoCompras([...proyectos, ...proyectosDemo], [...ordenesCompra, ...ordenesDemo], [...facturasProveedor, ...facturasDemo])
const cable = historico.find((c) => c.factura === 'DRG-293076' && c.materialId === 'm22')
const bienHistorico = cable?.precio === 2772 && cable.precioOC === 2650
ok &&= bienHistorico
console.log(`${bienHistorico ? '✔' : '✘'} histórico: ${historico.length} compras; DRG-293076 cable F-UTP ${cable ? `${money(cable.precio)} vs OC ${money(cable.precioOC)}` : 'no encontrado'}`)

process.exit(ok ? 0 : 1)
