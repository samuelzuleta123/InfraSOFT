// Proyectos de demostración adicionales (p4–p13) para ver el sistema con volumen.
// Clientes, consecutivos y documentos de estos proyectos son ficticios.
import { precioNeto } from '@/lib/calc'
import { generarOrdenes } from '@/lib/compras'
import type {
  Adjunto,
  CambioEstado,
  Cliente,
  Etapa,
  FacturaCliente,
  FacturaProveedor,
  FotoObra,
  FormaPago,
  ItemCotizacion,
  OrdenCompra,
  OtroCosto,
  Proyecto,
  Unidad,
  VersionCotizacion,
} from '@/types'
import { materiales, precios } from './catalogo'

const I = 'prv-ingram'
const E = 'prv-edv'
const R = 'prv-rg'

export const clientesDemo: Cliente[] = [
  { id: 'cli-esmeralda', nombre: 'Agroindustrial La Esmeralda S.A.S.', nit: '900.418.226-3', direccion: 'Km 4 vía Santa Rosa – Chinchiná', ciudad: 'Santa Rosa de Cabal, Risaralda', contacto: 'Andrés Gómez · Coordinador de sistemas', telefono: '300 000 0012', correo: 'sistemas@laesmeralda.example' },
  { id: 'cli-ejeandino', nombre: 'Distribuidora Eje Andino S.A.S.', nit: '901.237.554-1', direccion: 'Parque industrial La Romelia, bodega 7', ciudad: 'Dosquebradas, Risaralda', contacto: 'Luisa Fernanda Ríos · Jefe administrativa', telefono: '300 000 0013', correo: 'administracion@ejeandino.example' },
  { id: 'cli-mirador', nombre: 'Hotel Mirador del Otún S.A.S.', nit: '900.982.310-6', direccion: 'Avenida del Río # 32-18', ciudad: 'Pereira, Risaralda', contacto: 'Jorge Ocampo · Gerente de operaciones', telefono: '300 000 0014', correo: 'operaciones@hotelmirador.example' },
  { id: 'cli-santalucia', nombre: 'Centro Médico Santa Lucía IPS', nit: '901.055.871-9', direccion: 'Carrera 12 # 18-40', ciudad: 'Pereira, Risaralda', contacto: 'Diana Marcela Toro · Líder de TI', telefono: '300 000 0015', correo: 'ti@santalucia.example' },
  { id: 'cli-cerritos', nombre: 'Conjunto Residencial Torres de Cerritos', nit: '900.736.402-5', direccion: 'Vía Cerritos km 6', ciudad: 'Pereira, Risaralda', contacto: 'Mauricio Salazar · Administrador', telefono: '300 000 0016', correo: 'administracion@torrescerritos.example' },
  { id: 'cli-alpes', nombre: 'Colegio Campestre Los Alpes', nit: '891.409.663-0', direccion: 'Vereda La Florida, km 2', ciudad: 'Pereira, Risaralda', contacto: 'Paula Andrea Cardona · Coordinadora de compras', telefono: '300 000 0017', correo: 'compras@colegiolosalpes.example' },
]

// ── Constructores ──────────────────────────────────────────────────────

let n = 0
const precioDe = (materialId: string, proveedorId: string | null) => {
  const candidatos = precios.filter((p) => p.materialId === materialId && (!proveedorId || p.proveedorId === proveedorId))
  return candidatos.length ? Math.min(...candidatos.map(precioNeto)) : 0
}

/** Ítem de catálogo: descripción, unidad y precio salen del catálogo del proveedor elegido. */
const m = (materialId: string, cantidad: number, vuMO: number, proveedorId: string | null, instalada: number | null = null): ItemCotizacion => {
  const mat = materiales.find((x) => x.id === materialId)!
  return {
    id: `dit-${++n}`,
    materialId,
    descripcion: mat.descripcion,
    unidad: mat.unidad,
    cantidad,
    vuMO,
    vuMaterial: precioDe(materialId, proveedorId),
    proveedorId,
    cantInstalada: instalada,
  }
}

/** Ítem solo de mano de obra. */
const mo = (descripcion: string, unidad: Unidad, cantidad: number, vuMO: number, instalada: number | null = null): ItemCotizacion => ({
  id: `dit-${++n}`,
  descripcion,
  unidad,
  cantidad,
  vuMO,
  vuMaterial: 0,
  proveedorId: null,
  cantInstalada: instalada,
})

const otros = (siso = 1, polizas: [number, number] = [0, 0], viaticos: [number, number] = [0, 0], transporte: [number, number] = [0, 0]): OtroCosto[] => [
  { clave: 'siso', nombre: 'SG-SST', cantidad: siso, valorUnitario: 150_000 },
  { clave: 'polizas', nombre: 'Pólizas', cantidad: polizas[0], valorUnitario: polizas[1] },
  { clave: 'viaticos', nombre: 'Viáticos', cantidad: viaticos[0], valorUnitario: viaticos[1] },
  { clave: 'transporte', nombre: 'Transporte / Flete', cantidad: transporte[0], valorUnitario: transporte[1] },
]

/** Al cerrar o entregar, lo no registrado en obra se toma como instalado según lo cotizado. */
const completarInstalado = (secciones: VersionCotizacion['secciones']) =>
  secciones.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, cantInstalada: i.cantInstalada ?? i.cantidad })) }))

interface VersionSpec {
  nombre: string
  creada: string
  secciones: [string, ItemCotizacion[]][]
  otros: OtroCosto[]
  precioFinal: number | null
  historial: [CambioEstado['estado'], string][]
}

interface ProyectoSpec {
  id: string
  codigo: string
  nombre: string
  clienteId: string
  sede: string
  etapa: Etapa
  creado: string
  alcance: string
  tiempoEntrega: string
  levantamiento: { fecha: string; medidas: [string, string][]; ruta: string; origen: string; destino: string; obs?: string }
  fotos: string[]
  fotosObra?: string[]
  versiones: VersionSpec[]
  ocCliente?: { numero: string; fecha: string; valor?: number }
  seriales?: [string, string, string][]
  imprevistos?: [string, string][]
  entrega?: { fecha: string; remision: string; garantia: string; certificacion?: string; acta?: string; fotos?: number }
  facturaCliente?: Omit<FacturaCliente, 'valorBruto'>
  consecutivo: string
}

const tono = (i: number) => [210, 30, 160, 200, 15, 260, 120, 45, 185][i % 9]

function construir(spec: ProyectoSpec): Proyecto {
  const versiones: VersionCotizacion[] = spec.versiones.map((v, idx) => {
    let secciones = v.secciones.map(([nombre, items], j) => ({ id: `${spec.id}-v${idx + 1}-s${j + 1}`, nombre, items }))
    const ultima = idx === spec.versiones.length - 1
    if (ultima && spec.etapa >= 4) secciones = completarInstalado(secciones)
    if (!ultima) secciones = secciones.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, id: `${i.id}-v${idx + 1}`, cantInstalada: null })) }))
    return {
      id: `${spec.id}-v${idx + 1}`,
      nombre: v.nombre,
      creada: v.creada,
      secciones,
      otrosCostos: v.otros,
      utilidadPct: null,
      ajustesPct: null,
      precioFinal: v.precioFinal,
      estado: v.historial.at(-1)![0],
      historial: v.historial.map(([estado, fecha]) => ({ estado, fecha })),
    }
  })
  const vigente = versiones.find((v) => v.estado === 'aprobada') ?? versiones.at(-1)!
  // Los proyectos cerrados llevan fotos genéricas reales (public/fotos, ver CREDITOS.json).
  const url = (id: string) => (spec.facturaCliente ? `/fotos/${id}.jpg` : undefined)
  const fotos: FotoObra[] = [
    ...spec.fotos.map((titulo, i) => ({ id: `${spec.id}-f${i + 1}`, titulo, etapa: 'levantamiento' as const, tono: tono(i) })),
    ...(spec.fotosObra ?? []).map((titulo, i) => ({ id: `${spec.id}-fo${i + 1}`, titulo, etapa: 'ejecucion' as const, tono: tono(i + 4) })),
  ].map((f) => ({ ...f, url: url(f.id) }))
  const pdf = (nombre?: string): Adjunto | null => (nombre ? { nombre, tipo: 'pdf' } : null)
  return {
    id: spec.id,
    codigo: spec.codigo,
    nombre: spec.nombre,
    clienteId: spec.clienteId,
    sede: spec.sede,
    responsable: 'Coordinación técnica Infrasoft',
    etapa: spec.etapa,
    creado: spec.creado,
    levantamiento: {
      fecha: spec.levantamiento.fecha,
      responsable: 'Coordinación técnica Infrasoft',
      medidas: spec.levantamiento.medidas.map(([etiqueta, valor]) => ({ etiqueta, valor })),
      rutaTuberia: spec.levantamiento.ruta,
      rackOrigen: spec.levantamiento.origen,
      rackDestino: spec.levantamiento.destino,
      observaciones: spec.levantamiento.obs ?? '',
    },
    fotos,
    cotizacion: {
      consecutivo: spec.consecutivo,
      alcance: spec.alcance,
      tiempoEntrega: spec.tiempoEntrega,
      condiciones: 'Forma de pago: crédito 30 días.\nValidez de la oferta: 30 días.\nGarantía: 1 año sobre la instalación.',
      versiones,
      versionActivaId: versiones.at(-1)!.id,
    },
    ocCliente: spec.ocCliente
      ? { numero: spec.ocCliente.numero, fecha: spec.ocCliente.fecha, valor: spec.ocCliente.valor ?? vigente.precioFinal ?? 0, adjunto: { nombre: `${spec.ocCliente.numero}.pdf`, tipo: 'pdf' } }
      : null,
    imprevistos: (spec.imprevistos ?? []).map(([fecha, texto], i) => ({ id: `${spec.id}-imp${i}`, fecha, texto, foto: { nombre: `imprevisto_${i + 1}.jpg`, tipo: 'img' } })),
    seriales: (spec.seriales ?? []).map(([equipo, referencia, serial], i) => ({ id: `${spec.id}-ser${i}`, equipo, referencia, serial })),
    entrega: spec.entrega
      ? {
          fotosSeleccionadas: fotos.filter((f) => f.etapa === 'ejecucion').slice(0, spec.entrega.fotos ?? 4).map((f) => f.id),
          certificacion: pdf(spec.entrega.certificacion),
          actaFirmada: pdf(spec.entrega.acta),
          fechaEntrega: spec.entrega.fecha,
          garantia: spec.entrega.garantia,
          remision: spec.entrega.remision,
        }
      : { fotosSeleccionadas: [], certificacion: null, actaFirmada: null, fechaEntrega: null, garantia: '', remision: '' },
    facturaCliente: spec.facturaCliente && vigente.precioFinal ? { ...spec.facturaCliente, valorBruto: vigente.precioFinal } : null,
  }
}

// ── Proyectos ──────────────────────────────────────────────────────────

const specs: ProyectoSpec[] = [
  {
    id: 'p4',
    codigo: 'PRY-2025-012',
    consecutivo: 'COT-2025-031',
    nombre: 'Cableado estructurado 24 puntos – Oficinas administrativas',
    clienteId: 'cli-esmeralda',
    sede: 'Finca La Esmeralda · Oficinas administrativas',
    etapa: 5,
    creado: '2025-03-03',
    alcance: 'Suministro e instalación de 24 puntos de red categoría 6 con canaleta, gabinete de pared con patch panel y switch PoE, certificación y marcación de todos los puntos.',
    tiempoEntrega: '15 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2025-03-05',
      medidas: [['Puntos de red', '24'], ['Recorrido promedio por punto', '30 m'], ['Canaleta superficial', '140 m']],
      ruta: 'Canaleta superficial por muros del área administrativa hasta el gabinete de pared ubicado en archivo; tramos de canaleta metálica en la bodega.',
      origen: 'Gabinete de pared 9U nuevo – Archivo',
      destino: 'Puestos de trabajo de oficinas y bodega',
    },
    fotos: ['Oficinas administrativas', 'Ubicación del gabinete', 'Bodega de insumos'],
    fotosObra: ['Canaleta instalada', 'Gabinete con patch panel', 'Certificación de puntos', 'Puestos de trabajo'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2025-03-10',
        secciones: [
          ['Cableado', [m('m30', 720, 1_500, R, 745), m('m31', 48, 0, R), m('m32', 24, 0, R), m('m33', 24, 0, R), m('m01', 24, 0, R), mo('Instalación, marcación y certificación de punto', 'Un', 24, 38_000)]],
          ['Cuarto técnico', [m('m42', 1, 120_000, R), m('m43', 1, 45_000, R), m('m44', 2, 10_000, R), m('m45', 1, 20_000, E), m('m55', 1, 80_000, I)]],
          ['Canalización', [m('m34', 140, 2_000, R, 152), m('m52', 12, 18_000, E)]],
        ],
        otros: otros(1, [0, 0], [0, 0], [2, 80_000]),
        precioFinal: 14_200_000,
        historial: [['borrador', '2025-03-10'], ['enviada', '2025-03-11'], ['aprobada', '2025-03-14']],
      },
    ],
    ocCliente: { numero: 'OC-2025-0187', fecha: '2025-03-18' },
    seriales: [['Switch', 'Aruba Instant On 1930 JL684A', 'CN5BKD71QT']],
    entrega: { fecha: '2025-04-15', remision: '241', garantia: 'Garantía de 1 año en la instalación y en la certificación de puntos.', certificacion: 'Certificacion_24_puntos.pdf', acta: 'Acta_conformidad_Esmeralda.pdf' },
    facturaCliente: { numero: 'FE 412', fecha: '2025-04-21', vencimiento: '2025-05-21', ivaPct: 19, formaPago: 'Crédito 30 días' },
  },
  {
    id: 'p5',
    codigo: 'PRY-2026-008',
    consecutivo: 'COT-2026-034',
    nombre: 'Enlace de fibra monomodo entre bodegas',
    clienteId: 'cli-ejeandino',
    sede: 'Parque industrial La Romelia · Bodegas 3 y 7',
    etapa: 4,
    creado: '2026-06-22',
    alcance: 'Tendido aéreo de fibra óptica monomodo ADSS de 12 hilos entre las bodegas 3 y 7, empalme en mufa, ODF en ambos extremos, fusión, certificación OTDR y transceivers SFP+ 10G.',
    tiempoEntrega: '12 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-06-24',
      medidas: [['Distancia entre bodegas', '390 m'], ['Postes intermedios', '7'], ['Hilos', '12 monomodo']],
      ruta: 'Tendido aéreo por la postería interna del parque industrial con herrajes de retención; mufa de empalme en el poste P4.',
      origen: 'Rack principal – Bodega 3',
      destino: 'Gabinete de comunicaciones – Bodega 7',
    },
    fotos: ['Postería interna', 'Rack bodega 3', 'Gabinete bodega 7'],
    fotosObra: ['Tendido de fibra ADSS', 'Mufa en poste P4', 'Fusión en ODF', 'Certificación OTDR'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-07-01',
        secciones: [
          ['Fibra óptica', [m('m47', 420, 2_800, R, 436), m('m51', 14, 15_000, E), m('m50', 1, 180_000, R), m('m49', 2, 0, R), m('m48', 24, 25_000, R), m('m04', 2, 10_000, R), mo('Certificación OTDR por hilo', 'Un', 24, 18_000)]],
          ['Equipos activos', [m('m64', 4, 0, I)]],
        ],
        otros: otros(1, [1, 220_000], [0, 0], [1, 120_000]),
        precioFinal: 12_400_000,
        historial: [['borrador', '2026-07-01'], ['enviada', '2026-07-02'], ['aprobada', '2026-07-08']],
      },
    ],
    ocCliente: { numero: 'OC-EA-2026-311', fecha: '2026-07-10' },
    seriales: [
      ['Transceiver', 'SFP+ 10G LR', 'AJ71KQ2201'],
      ['Transceiver', 'SFP+ 10G LR', 'AJ71KQ2207'],
      ['Transceiver', 'SFP+ 10G LR', 'AJ71KQ2213'],
      ['Transceiver', 'SFP+ 10G LR', 'AJ71KQ2219'],
    ],
    entrega: { fecha: '2026-09-30', remision: '279', garantia: 'Garantía de 1 año en la instalación.', certificacion: 'Reporte_OTDR_12_hilos.pdf' },
  },
  {
    id: 'p6',
    codigo: 'PRY-2026-011',
    consecutivo: 'COT-2026-044',
    nombre: 'Red Wi-Fi para habitaciones y zonas comunes',
    clienteId: 'cli-mirador',
    sede: 'Hotel · Pisos 1 a 3 y terraza',
    etapa: 3,
    creado: '2026-07-15',
    alcance: 'Suministro e instalación de 11 access points Aruba Instant On (9 interiores y 2 exteriores), cableado Cat 6 hasta cada punto, gabinete con switch PoE y configuración de red de huéspedes.',
    tiempoEntrega: '20 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-07-17',
      medidas: [['Habitaciones', '36'], ['Access points interiores', '9'], ['Access points exteriores', '2 (terraza)']],
      ruta: 'Cableado por cielo raso de corredores hasta el gabinete del cuarto de servicios del piso 2.',
      origen: 'Gabinete de pared – Cuarto de servicios piso 2',
      destino: 'Corredores pisos 1 a 3 y terraza',
      obs: 'Trabajos en corredores solo entre 9:00 y 17:00 para no afectar a los huéspedes.',
    },
    fotos: ['Corredor piso 2', 'Terraza', 'Cuarto de servicios'],
    fotosObra: ['AP instalado en corredor', 'Gabinete con switch PoE'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-07-28',
        secciones: [
          ['Inalámbrico', [m('m40', 9, 45_000, I, 6), m('m57', 2, 60_000, I)]],
          ['Cableado', [m('m30', 520, 1_500, R, 380), m('m31', 22, 0, R, 14), m('m33', 11, 0, R), mo('Certificación de punto', 'Un', 11, 18_000, 6)]],
          ['Equipos activos', [m('m55', 1, 80_000, I, 1), m('m42', 1, 120_000, R, 1), m('m43', 1, 45_000, R, 1)]],
        ],
        otros: otros(1, [1, 190_000], [0, 0], [3, 60_000]),
        precioFinal: 18_900_000,
        historial: [['borrador', '2026-07-28'], ['enviada', '2026-07-29'], ['aprobada', '2026-08-05']],
      },
    ],
    ocCliente: { numero: 'HMO-0457', fecha: '2026-08-08' },
    seriales: [['Switch', 'Aruba Instant On 1930 JL684A', 'CN6CLM02RX']],
    imprevistos: [['2026-09-14', 'Muros en concreto en el pasillo del piso 3: se cambió la ruta a canaleta superficial en 24 m.']],
  },
  {
    id: 'p7',
    codigo: 'PRY-2026-016',
    consecutivo: 'COT-2026-055',
    nombre: 'Cuarto técnico: rack, UPS y organización',
    clienteId: 'cli-santalucia',
    sede: 'Sede principal · Cuarto técnico, sótano',
    etapa: 2,
    creado: '2026-08-28',
    alcance: 'Instalación de rack de 42U con organizadores y patch panels, UPS online de 3 kVA con tablero y circuito dedicado, y peinado y marcación del cableado existente.',
    tiempoEntrega: '10 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-08-31',
      medidas: [['Área del cuarto', '9 m²'], ['Cables existentes por peinar', '≈ 60'], ['Distancia al tablero general', '15 m']],
      ruta: 'Circuito regulado desde el tablero general del sótano en tubería existente hasta el nuevo tablero del cuarto técnico.',
      origen: 'Tablero general – Sótano',
      destino: 'Rack 42U nuevo – Cuarto técnico',
    },
    fotos: ['Cuarto técnico actual', 'Cableado sin organizar', 'Tablero general'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-09-10',
        secciones: [
          ['Rack', [m('m41', 1, 180_000, R), m('m44', 4, 10_000, R), m('m43', 2, 45_000, R), m('m45', 2, 20_000, E)]],
          ['Energía', [m('m54', 1, 250_000, I), m('m62', 1, 120_000, E), m('m61', 4, 15_000, E), m('m60', 60, 1_800, E)]],
          ['Organización', [mo('Peinado y marcación de cableado existente', 'Un', 1, 650_000)]],
        ],
        otros: otros(1, [1, 200_000]),
        precioFinal: 11_600_000,
        historial: [['borrador', '2026-09-10'], ['enviada', '2026-09-11'], ['aprobada', '2026-09-22']],
      },
    ],
    ocCliente: { numero: 'CMSL-2026-0932', fecha: '2026-09-25' },
  },
  {
    id: 'p8',
    codigo: 'PRY-2026-020',
    consecutivo: 'COT-2026-063',
    nombre: 'Radioenlace portería – administración',
    clienteId: 'cli-cerritos',
    sede: 'Conjunto · Portería y edificio de administración',
    etapa: 1,
    creado: '2026-09-18',
    alcance: 'Suministro e instalación de radioenlace punto a punto de 5 GHz entre la portería y la administración, con gabinetes en ambos extremos, cableado y pruebas de desempeño.',
    tiempoEntrega: '8 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-09-21',
      medidas: [['Distancia del enlace', '280 m'], ['Línea de vista', 'Despejada'], ['Altura de montaje', '6 m']],
      ruta: 'Mástiles en la cubierta de la portería y de la administración; cable UTP hasta los gabinetes interiores.',
      origen: 'Portería principal',
      destino: 'Oficina de administración',
    },
    fotos: ['Cubierta de portería', 'Vista hacia administración'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-09-28',
        secciones: [['Radioenlace', [m('m56', 1, 220_000, I), m('m42', 2, 120_000, R), m('m30', 60, 1_500, R), m('m58', 10, 0, R), mo('Alineación y pruebas del enlace', 'Un', 1, 180_000)]]],
        otros: otros(1),
        precioFinal: 4_900_000,
        historial: [['borrador', '2026-09-28'], ['enviada', '2026-09-29']],
      },
    ],
  },
  {
    id: 'p9',
    codigo: 'PRY-2026-021',
    consecutivo: 'COT-2026-066',
    nombre: 'Canalización y circuito regulado – Sala de sistemas',
    clienteId: 'cli-alpes',
    sede: 'Sede campestre · Sala de sistemas',
    etapa: 1,
    creado: '2026-10-02',
    alcance: 'Canalización en tubería PVC y canaleta metálica para 30 equipos de cómputo y circuito eléctrico regulado con tablero independiente.',
    tiempoEntrega: '10 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-10-05',
      medidas: [['Equipos de cómputo', '30'], ['Perímetro de la sala', '42 m'], ['Distancia al tablero general', '28 m']],
      ruta: 'Canaleta metálica perimetral a 40 cm del piso; acometida en tubería PVC por cielo raso desde el tablero general.',
      origen: 'Tablero general – Bloque B',
      destino: 'Sala de sistemas',
    },
    fotos: ['Sala de sistemas', 'Tablero general bloque B'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-10-06',
        secciones: [
          ['Canalización', [m('m53', 40, 6_000, null), m('m59', 12, 8_000, null), m('m52', 10, 18_000, null)]],
          ['Energía', [m('m60', 180, 1_800, null), m('m61', 6, 15_000, null), m('m62', 1, 120_000, null)]],
        ],
        otros: otros(1),
        precioFinal: null,
        historial: [['borrador', '2026-10-06']],
      },
    ],
  },
  {
    id: 'p10',
    codigo: 'PRY-2026-017',
    consecutivo: 'COT-2026-057',
    nombre: 'Ampliación de 12 puntos de red – Laboratorio',
    clienteId: 'cli-alpes',
    sede: 'Sede campestre · Laboratorio de ciencias',
    etapa: 1,
    creado: '2026-09-01',
    alcance: 'Ampliación de 12 puntos de red categoría 6 en el laboratorio de ciencias, con canalización y certificación de puntos.',
    tiempoEntrega: '8 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-09-03',
      medidas: [['Puntos nuevos', '12'], ['Recorrido promedio', '30 m']],
      ruta: 'Desde el gabinete del bloque C por cielo raso hasta el laboratorio; bajantes en canaleta.',
      origen: 'Gabinete bloque C',
      destino: 'Laboratorio de ciencias',
    },
    fotos: ['Laboratorio de ciencias', 'Gabinete bloque C'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-09-07',
        secciones: [
          ['Cableado', [m('m30', 360, 1_500, R), m('m31', 24, 0, R), m('m32', 12, 0, R), m('m33', 12, 0, R), mo('Instalación y certificación de punto', 'Un', 12, 38_000)]],
          ['Canalización', [m('m52', 8, 18_000, E)]],
          ['Equipos activos', [m('m55', 1, 80_000, I)]],
        ],
        otros: otros(1),
        precioFinal: 8_200_000,
        historial: [['borrador', '2026-09-07'], ['enviada', '2026-09-08'], ['rechazada', '2026-09-15']],
      },
      {
        nombre: 'v2',
        creada: '2026-09-18',
        secciones: [
          ['Cableado', [m('m30', 360, 1_500, R), m('m31', 24, 0, R), m('m32', 12, 0, R), m('m33', 12, 0, R), mo('Instalación y certificación de punto', 'Un', 12, 38_000)]],
          ['Canalización', [m('m34', 60, 2_000, R)]],
        ],
        otros: otros(1),
        precioFinal: 3_900_000,
        historial: [['borrador', '2026-09-18'], ['enviada', '2026-09-19']],
      },
    ],
  },
  {
    id: 'p11',
    codigo: 'PRY-2026-005',
    consecutivo: 'COT-2026-018',
    nombre: 'Reubicación de rack y peinado de cableado – Cuarto de control',
    clienteId: 'cli-papeles',
    sede: 'Planta Puerto Caldas · Cuarto de control',
    etapa: 5,
    creado: '2026-04-06',
    alcance: 'Reubicación del rack de comunicaciones del cuarto de control a rack nuevo de 42U, instalación de organizadores y patch panels, y peinado y marcación de todo el cableado.',
    tiempoEntrega: '5 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-04-08',
      medidas: [['Cables por reubicar', '≈ 48'], ['Equipos en rack', '6']],
      ruta: 'Traslado dentro del mismo cuarto de control, 3 m hacia el muro norte.',
      origen: 'Rack actual – Cuarto de control',
      destino: 'Rack 42U nuevo – Muro norte',
      obs: 'Ventana de mantenimiento de planta: domingo de 6:00 a 14:00.',
    },
    fotos: ['Rack actual', 'Cableado del cuarto de control'],
    fotosObra: ['Rack nuevo instalado', 'Cableado peinado', 'Marcación de patch panel'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-04-14',
        secciones: [
          ['Rack', [m('m41', 1, 180_000, R), m('m44', 3, 10_000, R), m('m45', 1, 20_000, E)]],
          ['Cableado', [m('m43', 2, 45_000, R), m('m33', 48, 0, R), mo('Peinado y marcación de cableado', 'Un', 1, 850_000)]],
        ],
        otros: otros(1, [1, 150_000]),
        precioFinal: 5_600_000,
        historial: [['borrador', '2026-04-14'], ['enviada', '2026-04-15'], ['aprobada', '2026-04-20']],
      },
    ],
    ocCliente: { numero: 'LOC-0086204', fecha: '2026-04-22' },
    entrega: { fecha: '2026-05-20', remision: '268', garantia: 'Garantía de 1 año en la instalación.', certificacion: 'Certificacion_cuarto_control.pdf', acta: 'Acta_conformidad_cuarto_control.pdf', fotos: 3 },
    facturaCliente: { numero: 'FE 478', fecha: '2026-05-25', vencimiento: '2026-06-24', ivaPct: 19, formaPago: 'Crédito 30 días' },
  },
  {
    id: 'p12',
    codigo: 'PRY-2026-013',
    consecutivo: 'COT-2026-047',
    nombre: 'Backbone de fibra entre edificios – Planta',
    clienteId: 'cli-papeles',
    sede: 'Planta Puerto Caldas · Edificios de producción y administrativo',
    etapa: 3,
    creado: '2026-07-28',
    alcance: 'Backbone de fibra óptica multimodo entre el edificio de producción y el administrativo con canalización EMT, cajas de paso, ODF, fusión, certificación y transceivers Aruba.',
    tiempoEntrega: '25 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-07-30',
      medidas: [['Distancia entre edificios', '160 m'], ['Tramo en tubería EMT', '120 m'], ['Cajas de paso', '2']],
      ruta: 'Tubería EMT 1" adosada a la estructura del corredor cubierto, con dos cajas de paso intemperie en los cambios de dirección.',
      origen: 'Rack de producción – Edificio de producción',
      destino: 'Rack principal – Edificio administrativo',
    },
    fotos: ['Corredor cubierto', 'Rack de producción', 'Rack principal administrativo'],
    fotosObra: ['Tubería EMT en corredor', 'Caja de paso intemperie'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-08-10',
        secciones: [
          ['Fibra óptica', [m('m07', 180, 2_500, R, 120), m('m09', 24, 60_000, R, 12), m('m04', 2, 10_000, R, 1), mo('Certificación fibra óptica por hilo', 'Un', 12, 30_000)]],
          ['Canalización', [m('m12', 40, 25_000, E, 40), m('m13', 40, 0, E, 40), m('m14', 10, 0, E, 12), m('m16', 2, 80_000, E, 2)]],
          ['Equipos activos', [m('m03', 4, 0, I)]],
        ],
        otros: otros(1, [1, 250_000], [4, 100_000]),
        precioFinal: 13_400_000,
        historial: [['borrador', '2026-08-10'], ['enviada', '2026-08-11'], ['aprobada', '2026-08-18']],
      },
    ],
    ocCliente: { numero: 'LOC-0088745', fecha: '2026-08-20' },
    imprevistos: [['2026-09-22', 'La estructura del corredor no soporta la tubería en el tramo final; se agregaron 2 curvas y soportes adicionales.']],
  },
  {
    id: 'p13',
    codigo: 'PRY-2026-018',
    consecutivo: 'COT-2026-059',
    nombre: 'Wi-Fi exterior para patio de maniobras',
    clienteId: 'cli-ejeandino',
    sede: 'Centro de distribución · Patio de maniobras',
    etapa: 2,
    creado: '2026-09-09',
    alcance: 'Cobertura Wi-Fi exterior del patio de maniobras con 4 access points en poste, cableado F-UTP Cat 6A en tubería PVC y gabinete con switch PoE.',
    tiempoEntrega: '15 días hábiles a partir de la orden de compra',
    levantamiento: {
      fecha: '2026-09-11',
      medidas: [['Área del patio', '5.200 m²'], ['Postes de montaje', '4'], ['Recorrido de cableado', '260 m']],
      ruta: 'Tubería PVC enterrada desde la bodega hasta cada poste, con cajas de paso a la base de cada poste.',
      origen: 'Gabinete nuevo – Bodega de despachos',
      destino: 'Postes P1 a P4 del patio',
    },
    fotos: ['Patio de maniobras', 'Postes existentes', 'Bodega de despachos'],
    versiones: [
      {
        nombre: 'v1',
        creada: '2026-09-23',
        secciones: [
          ['Inalámbrico', [m('m57', 4, 60_000, I), mo('Instalación en poste con brazo', 'Un', 4, 85_000)]],
          ['Cableado', [m('m22', 260, 1_800, R), m('m58', 16, 0, R)]],
          ['Canalización', [m('m53', 30, 6_000, E), m('m59', 6, 8_000, E)]],
          ['Equipos activos', [m('m55', 1, 80_000, I), m('m42', 1, 120_000, R)]],
        ],
        otros: otros(1, [1, 180_000], [0, 0], [1, 90_000]),
        precioFinal: 13_450_000,
        historial: [['borrador', '2026-09-23'], ['enviada', '2026-09-24'], ['aprobada', '2026-09-30']],
      },
    ],
    // El cliente emitió la OC con un descuento que no estaba en la cotización: muestra la alerta.
    ocCliente: { numero: 'OC-EA-2026-388', fecha: '2026-10-03', valor: 13_300_000 },
  },
]

export const proyectosDemo: Proyecto[] = specs.map(construir)

// ── Órdenes de compra ──────────────────────────────────────────────────

const ocsDemo: Record<string, { fecha: string; consecutivos: Record<string, string> }> = {
  p4: { fecha: '2025-03-19', consecutivos: { [R]: '2503-004', [E]: '2503-005', [I]: '2503-006' } },
  p5: { fecha: '2026-07-11', consecutivos: { [R]: '2607-008', [E]: '2607-009', [I]: '2607-010' } },
  p6: { fecha: '2026-08-10', consecutivos: { [I]: '2608-014', [R]: '2608-015' } },
  p7: { fecha: '2026-09-26', consecutivos: { [R]: '2609-011', [E]: '2609-012', [I]: '2609-013' } },
  p11: { fecha: '2026-04-23', consecutivos: { [R]: '2604-007', [E]: '2604-008' } },
  p12: { fecha: '2026-08-21', consecutivos: { [R]: '2608-020', [E]: '2608-021', [I]: '2608-022' } },
}

export const ordenesDemo: OrdenCompra[] = Object.entries(ocsDemo).flatMap(([pid, cfg]) => {
  const p = proyectosDemo.find((x) => x.id === pid)!
  const v = p.cotizacion.versiones.find((x) => x.estado === 'aprobada')!
  return generarOrdenes(pid, v, (prov) => cfg.consecutivos[prov]).map((oc) => ({ ...oc, id: `oc-${pid}-${oc.consecutivo}`, fecha: cfg.fecha }))
})

// ── Facturas de proveedor ──────────────────────────────────────────────

interface FacturaSpec {
  proyecto: string | null
  proveedor: string
  numero: string
  fecha: string
  vence: string
  forma: FormaPago
  pagada?: boolean
  /** Ajustes de precio unitario que el proveedor facturó distinto a la OC. */
  ajustes?: Record<string, number>
  notas?: string
}

const facturaSpecs: FacturaSpec[] = [
  { proyecto: 'p4', proveedor: R, numero: 'DRG-271455', fecha: '2025-03-28', vence: '2025-04-27', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p4', proveedor: E, numero: 'EPE26118', fecha: '2025-03-27', vence: '2025-04-26', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p4', proveedor: I, numero: '1004105522', fecha: '2025-03-25', vence: '2025-03-25', forma: 'Contado', pagada: true },
  { proyecto: 'p5', proveedor: R, numero: 'DRG-288310', fecha: '2026-07-22', vence: '2026-08-21', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p5', proveedor: E, numero: 'EPE27561', fecha: '2026-07-20', vence: '2026-08-19', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p5', proveedor: I, numero: '1004356721', fecha: '2026-07-18', vence: '2026-07-18', forma: 'Contado', pagada: true },
  { proyecto: 'p6', proveedor: I, numero: '1004398870', fecha: '2026-08-20', vence: '2026-09-19', forma: 'Crédito 30 días' },
  { proyecto: 'p6', proveedor: R, numero: 'DRG-291044', fecha: '2026-08-25', vence: '2026-10-24', forma: 'Crédito 60 días', ajustes: { m30: 2_010 } },
  { proyecto: 'p11', proveedor: R, numero: 'DRG-279902', fecha: '2026-05-04', vence: '2026-06-03', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p11', proveedor: E, numero: 'EPE27012', fecha: '2026-05-02', vence: '2026-06-01', forma: 'Crédito 30 días', pagada: true },
  { proyecto: 'p12', proveedor: E, numero: 'EPE27904', fecha: '2026-09-01', vence: '2026-10-01', forma: 'Crédito 30 días' },
  { proyecto: 'p12', proveedor: R, numero: 'DRG-292210', fecha: '2026-09-12', vence: '2026-10-12', forma: 'Crédito 30 días', ajustes: { m09: 15_200 } },
  { proyecto: 'p12', proveedor: I, numero: '1004412287', fecha: '2026-09-05', vence: '2026-09-05', forma: 'Contado', pagada: true },
  // Llega sin asignar: corresponde a la OC de Eléctricos del Valle del proyecto 7.
  { proyecto: null, proveedor: E, numero: 'EPE28102', fecha: '2026-10-02', vence: '2026-11-01', forma: 'Crédito 30 días', notas: 'Remisión SO-931207 · Ref. cliente Santa Lucía' },
]

const ocDe = (pid: string, prov: string) => ordenesDemo.find((o) => o.proyectoId === pid && o.proveedorId === prov)

export const facturasDemo: FacturaProveedor[] = facturaSpecs.map((f, i) => {
  // La factura sin asignar toma sus líneas de la OC a la que realmente pertenece.
  const oc = ocDe(f.proyecto ?? 'p7', f.proveedor)!
  const lineas = oc.lineas.map((l, j) => {
    const item = proyectosDemo.flatMap((p) => p.cotizacion.versiones.flatMap((v) => v.secciones.flatMap((s) => s.items))).find((x) => x.id === l.itemId)
    const ajuste = item?.materialId ? f.ajustes?.[item.materialId] : undefined
    return { id: `l${j + 1}`, descripcion: l.descripcion, cantidad: l.cantidad, precioUnitario: ajuste ?? l.precioUnitario }
  })
  const subtotal = Math.round(lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0))
  return {
    id: `fpd-${i + 1}`,
    proveedorId: f.proveedor,
    numero: f.numero,
    fecha: f.fecha,
    vencimiento: f.vence,
    formaPago: f.forma,
    subtotal,
    iva: Math.round(subtotal * 0.19),
    lineas,
    notas: f.notas ?? `OC ${oc.consecutivo}`,
    adjuntos: [
      { nombre: `${f.numero}.pdf`, tipo: 'pdf' },
      { nombre: `${f.numero}.xml`, tipo: 'xml' },
    ],
    proyectoId: f.proyecto,
    ocId: f.proyecto ? oc.id : null,
    pagada: f.pagada,
  }
})
