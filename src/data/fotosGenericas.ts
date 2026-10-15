// Fotos genéricas reales (public/fotos, créditos en CREDITOS.json) para los proyectos de prueba que no tienen fotos propias.
// Cada foto se asigna por lo que dice su título; si varias sirven, se reparte entre ellas para no repetir siempre la misma.

const reglas: [RegExp, string[]][] = [
  [/otdr|certific/, ['p4-fo3']],
  [/fusi|mufa|odf|fibra|adss/, ['f6']],
  [/marcaci/, ['f8', 'p11-fo3']],
  [/sin organizar|desorden/, ['p11-f1']],
  [/peinad|organizaci/, ['p11-fo2']],
  [/patch panel|switch|gabinete/, ['f7', 'p4-fo2', 'p4-f2']],
  [/rack|cuarto tecnico|cuarto de control|datos/, ['f1', 'p11-fo1', 'p11-f2']],
  [/canaleta|bandeja|cielo raso/, ['p4-fo1']],
  [/tuber|emt|imc|bajante/, ['f4']],
  [/caja de paso|caja/, ['f5']],
  [/tablero|ccm|ups/, ['f3']],
  [/muro|poste|exterior|cubierta|patio|terraza|porteria|vista/, ['f2']],
  [/oficina|puesto|laboratorio|sala|corredor|habitaci|ap instalado/, ['p4-f1', 'p4-fo4']],
  [/bodega|nave|cuarto|despacho/, ['p4-f3']],
]

const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function fotoGenerica(titulo: string, semilla: number): string {
  const t = normal(titulo)
  const opciones = reglas.find(([re]) => re.test(t))?.[1] ?? ['f1', 'f7', 'p11-f2']
  return `/fotos/${opciones[semilla % opciones.length]}.jpg`
}
