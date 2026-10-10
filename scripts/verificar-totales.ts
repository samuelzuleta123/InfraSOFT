// Verifica que el cotizador del proyecto 1 cuadre con los totales esperados.
import { proyectos } from '../src/data/proyectos'
import { resumen, versionVigente } from '../src/lib/calc'
import { money } from '../src/lib/format'

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
process.exit(ok ? 0 : 1)
