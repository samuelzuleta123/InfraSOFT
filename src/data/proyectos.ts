import type { ItemCotizacion, OtroCosto, Proyecto, Unidad } from '@/types'

let n = 0
const it = (
  descripcion: string,
  unidad: Unidad,
  cantidad: number,
  vuMO: number,
  vuMaterial: number,
  opts: { materialId?: string; proveedorId?: string | null; instalada?: number | null } = {},
): ItemCotizacion => ({
  id: `it-${++n}`,
  descripcion,
  unidad,
  cantidad,
  vuMO,
  vuMaterial,
  materialId: opts.materialId,
  proveedorId: opts.proveedorId ?? null,
  cantInstalada: opts.instalada ?? null,
})

const otros = (siso: [number, number], polizas: [number, number], viaticos: [number, number], transporte: [number, number]): OtroCosto[] => [
  { clave: 'siso', nombre: 'SISO', cantidad: siso[0], valorUnitario: siso[1] },
  { clave: 'polizas', nombre: 'Pólizas', cantidad: polizas[0], valorUnitario: polizas[1] },
  { clave: 'viaticos', nombre: 'Viáticos', cantidad: viaticos[0], valorUnitario: viaticos[1] },
  { clave: 'transporte', nombre: 'Transporte / Flete', cantidad: transporte[0], valorUnitario: transporte[1] },
]

const entregaVacia = () => ({
  fotosSeleccionadas: [],
  certificacion: null,
  actaFirmada: null,
  fechaEntrega: null,
  garantia: '',
  remision: '',
})

// ─────────────────────────────────────────────────────────────────────
// Proyecto 1 — cerrado. Ciclo completo.
// Totales esperados v2: MO $1.613.500 · materiales $3.099.500 · otros $450.000 · costo $5.163.000
// ─────────────────────────────────────────────────────────────────────

const redDeDatosP1 = () => [
  it('Patch cord UTP Cat 6 x 3 mts', 'Un', 2, 1_000, 22_000, { materialId: 'm01', instalada: 2 }),
  it('Switch Aruba JL680A (1 Rack CCM)', 'Un', 1, 0, 420_000, { materialId: 'm02', proveedorId: 'prv-ingram', instalada: 1 }),
  it('Transceiver Aruba R9D16A', 'Un', 2, 0, 140_000, { materialId: 'm03', instalada: 2 }),
  it('ODF para rack', 'Un', 1, 10_000, 480_000, { materialId: 'm04', instalada: 1 }),
  it('Placa para 12 hilos para la caja industrial', 'Un', 1, 25_000, 190_000, { materialId: 'm05', instalada: 1 }),
  it('Caja fibra óptica industrial Laumayer', 'Un', 1, 50_000, 220_000, { materialId: 'm06', instalada: 1 }),
  it('F.O. 6H MM tipo exterior con armadura VFO0350', 'Mts', 55, 2_500, 4_300, { materialId: 'm07', instalada: 58 }),
  it('Patch cord fibra óptica LC/LC multimodo 3 mts', 'Un', 2, 2_000, 55_000, { materialId: 'm08', instalada: 2 }),
  it('Pigtail OM3 multimodo LC (pigtail y fusión)', 'Un', 12, 60_000, 14_000, { materialId: 'm09', instalada: 12 }),
  it('Certificación fibra óptica por hilo', 'Un', 6, 30_000, 0, { instalada: 6 }),
  it('Marcación racks y tubería', 'Un', 20, 4_500, 0, { instalada: 22 }),
]

const proyecto1: Proyecto = {
  id: 'p1',
  codigo: 'PRY-2024-031',
  nombre: 'Instalación F.O. Subestación Eléctrica – Contenedor CCM',
  clienteId: 'cli-papeles',
  sede: 'Planta Puerto Caldas · Subestación eléctrica',
  responsable: 'Coordinación técnica Infrasoft',
  etapa: 5,
  creado: '2024-11-06',
  levantamiento: {
    fecha: '2024-11-08',
    responsable: 'Coordinación técnica Infrasoft',
    medidas: [
      { etiqueta: 'Distancia subestación → contenedor CCM', valor: '48 m' },
      { etiqueta: 'Tramo en tubería EMT 1"', valor: '36 m (12 tubos de 3 m)' },
      { etiqueta: 'Tramo en coraza 1" (ingreso al contenedor)', valor: '6 m' },
      { etiqueta: 'Reserva de fibra por extremo', valor: '3 m' },
      { etiqueta: 'Hilos requeridos', valor: '6 hilos multimodo OM3' },
    ],
    rutaTuberia:
      'Sale del rack de comunicaciones de la subestación por la bandeja existente, baja en tubería EMT 1" por el muro exterior hasta la caja de paso intemperie 30x30 y continúa en coraza 1" hasta el ingreso del contenedor CCM.',
    rackOrigen: 'Rack de comunicaciones – Subestación eléctrica (U 18 a U 20 disponibles)',
    rackDestino: 'Rack CCM dentro del contenedor (switch Aruba JL680A nuevo)',
    observaciones: 'Trabajo en zona energizada: requiere permiso de trabajo y acompañamiento del área eléctrica del cliente.',
  },
  fotos: [
    { id: 'f1', titulo: 'Rack de comunicaciones subestación', etapa: 'levantamiento', tono: 210 },
    { id: 'f2', titulo: 'Muro exterior – ruta de bajante', etapa: 'levantamiento', tono: 30 },
    { id: 'f3', titulo: 'Ingreso al contenedor CCM', etapa: 'levantamiento', tono: 160 },
    { id: 'f4', titulo: 'Tubería EMT instalada', etapa: 'ejecucion', tono: 200 },
    { id: 'f5', titulo: 'Caja de paso Rittal 30x30', etapa: 'ejecucion', tono: 15 },
    { id: 'f6', titulo: 'Fusión de pigtails en ODF', etapa: 'ejecucion', tono: 260 },
    { id: 'f7', titulo: 'Switch JL680A en rack CCM', etapa: 'ejecucion', tono: 190 },
    { id: 'f8', titulo: 'Marcación de racks', etapa: 'ejecucion', tono: 120 },
  ],
  cotizacion: {
    consecutivo: 'COT-2024-118',
    alcance:
      'Suministro e instalación de enlace de fibra óptica multimodo de 6 hilos entre el rack de comunicaciones de la subestación eléctrica y el contenedor CCM, incluyendo canalización en tubería EMT y coraza, fusión y certificación de hilos, suministro e instalación de switch Aruba con transceivers y marcación de racks y tubería.',
    tiempoEntrega: '15 días hábiles a partir de la orden de compra',
    condiciones:
      'Forma de pago: crédito 30 días.\nValidez de la oferta: 30 días.\nGarantía: 1 año sobre la instalación; equipos Aruba con garantía de por vida limitada del fabricante.',
    versionActivaId: 'p1-v2',
    versiones: [
      {
        id: 'p1-v1',
        nombre: 'v1',
        creada: '2024-11-12',
        secciones: [{ id: 'p1-v1-s1', nombre: 'Red de datos', items: redDeDatosP1().map((i) => ({ ...i, id: `${i.id}-v1`, cantInstalada: null })) }],
        otrosCostos: otros([1, 150_000], [0, 150_000], [3, 100_000], [0, 0]),
        utilidadPct: null,
        ajustesPct: null,
        precioFinal: 5_900_000,
        estado: 'rechazada',
        historial: [
          { estado: 'borrador', fecha: '2024-11-12' },
          { estado: 'enviada', fecha: '2024-11-13' },
          { estado: 'rechazada', fecha: '2024-11-18' },
        ],
      },
      {
        id: 'p1-v2',
        nombre: 'v2',
        creada: '2024-11-19',
        secciones: [
          { id: 'p1-s1', nombre: 'Red de datos', items: redDeDatosP1() },
          {
            id: 'p1-s2',
            nombre: 'Canalización',
            items: [
              it('Tubería EMT 1"', 'Un', 12, 25_000, 36_000, { materialId: 'm12', instalada: 13 }),
              it('Unión EMT 1"', 'Un', 12, 0, 3_500, { materialId: 'm13', instalada: 12 }),
              it('Curva EMT 1"', 'Un', 4, 0, 8_000, { materialId: 'm14', instalada: 5 }),
              it('Coraza 1"', 'Mts', 6, 2_500, 7_500, { materialId: 'm15', instalada: 6 }),
              it('Caja de paso intemperie 30x30 Rittal', 'Un', 1, 80_000, 400_000, { materialId: 'm16', instalada: 1 }),
            ],
          },
        ],
        otrosCostos: otros([1, 150_000], [0, 150_000], [3, 100_000], [0, 0]),
        utilidadPct: null,
        ajustesPct: null,
        precioFinal: 7_200_000,
        estado: 'aprobada',
        historial: [
          { estado: 'borrador', fecha: '2024-11-19' },
          { estado: 'enviada', fecha: '2024-11-20' },
          { estado: 'aprobada', fecha: '2024-11-28' },
        ],
      },
    ],
  },
  ocCliente: {
    numero: 'LOC-0081930',
    fecha: '2024-11-29',
    valor: 7_200_000,
    adjunto: { nombre: 'LOC-0081930.pdf', tipo: 'pdf' },
  },
  imprevistos: [
    {
      id: 'imp-1',
      fecha: '2024-12-05',
      texto: 'El recorrido real por el muro exterior requirió 3 m adicionales de fibra y una curva EMT adicional para esquivar una tubería eléctrica existente.',
      foto: { nombre: 'imprevisto_muro.jpg', tipo: 'img' },
    },
  ],
  seriales: [
    { id: 's1', equipo: 'Transceiver', referencia: 'Aruba R9D16A', serial: 'MY2AL8N1Y5' },
    { id: 's2', equipo: 'Transceiver', referencia: 'Aruba R9D16A', serial: 'CN44L8Q02X' },
    { id: 's3', equipo: 'Switch', referencia: 'Aruba JL680A', serial: 'TW45LNR033' },
  ],
  entrega: {
    fotosSeleccionadas: ['f4', 'f5', 'f6', 'f7'],
    certificacion: { nombre: 'Certificacion_FO_6_hilos_CCM.pdf', tipo: 'pdf' },
    actaFirmada: { nombre: 'Acta_conformidad_CCM_firmada.pdf', tipo: 'pdf' },
    fechaEntrega: '2024-12-13',
    garantia: 'Garantía de 1 año en la instalación y garantía de por vida limitada Aruba.',
    remision: '286',
  },
  facturaCliente: {
    numero: 'FE 500',
    fecha: '2024-12-17',
    vencimiento: '2025-01-16',
    valorBruto: 7_200_000,
    ivaPct: 19,
    formaPago: 'Crédito 30 días',
  },
}

// ─────────────────────────────────────────────────────────────────────
// Proyecto 2 — en ejecución. Compras y facturas de proveedor.
// ─────────────────────────────────────────────────────────────────────

const proyecto2: Proyecto = {
  id: 'p2',
  codigo: 'PRY-2026-014',
  nombre: 'Cableado estructurado Cat 6A – Edificio administrativo',
  clienteId: 'cli-papeles',
  sede: 'Planta Puerto Caldas · Edificio administrativo, piso 2',
  responsable: 'Coordinación técnica Infrasoft',
  etapa: 3,
  creado: '2026-08-10',
  levantamiento: {
    fecha: '2026-08-12',
    responsable: 'Coordinación técnica Infrasoft',
    medidas: [
      { etiqueta: 'Puntos de red requeridos', valor: '16 puntos Cat 6A' },
      { etiqueta: 'Recorrido promedio por punto', valor: '19 m' },
      { etiqueta: 'Bandeja portacable a instalar', valor: '36 m (12 tramos de 3 m)' },
      { etiqueta: 'Altura de cielo raso', valor: '2,70 m' },
    ],
    rutaTuberia:
      'Bandeja tipo malla sobre cielo raso del corredor principal; bajantes en tubo IMC 1" hasta cajas de paso 20x20 y coraza americana en los últimos tramos hacia los puestos de trabajo.',
    rackOrigen: 'Rack principal – Cuarto técnico piso 1',
    rackDestino: 'Gabinete de piso – Piso 2 (switch Aruba Instant On 1930 nuevo)',
    observaciones: 'Trabajo en horario no laboral (sábados) para no afectar la operación administrativa.',
  },
  fotos: [
    { id: 'f21', titulo: 'Corredor principal piso 2', etapa: 'levantamiento', tono: 220 },
    { id: 'f22', titulo: 'Cuarto técnico piso 1', etapa: 'levantamiento', tono: 200 },
    { id: 'f23', titulo: 'Bandeja instalada sobre cielo raso', etapa: 'ejecucion', tono: 40 },
    { id: 'f24', titulo: 'Bajantes IMC', etapa: 'ejecucion', tono: 140 },
  ],
  cotizacion: {
    consecutivo: 'COT-2026-052',
    alcance:
      'Suministro e instalación de 16 puntos de cableado estructurado categoría 6A con canalización en bandeja tipo malla y tubería IMC, gabinete de piso con switch Aruba Instant On y certificación de todos los puntos.',
    tiempoEntrega: '20 días hábiles a partir de la orden de compra',
    condiciones: 'Forma de pago: crédito 30 días.\nValidez de la oferta: 30 días.\nGarantía: 1 año sobre la instalación.',
    versionActivaId: 'p2-v1',
    versiones: [
      {
        id: 'p2-v1',
        nombre: 'v1',
        creada: '2026-08-20',
        secciones: [
          {
            id: 'p2-s1',
            nombre: 'Canalización',
            items: [
              it('Tubo galv. IMC 1" x 3 mts', 'Un', 5, 18_000, 65_743.2, { materialId: 'm20', proveedorId: 'prv-rg', instalada: 5 }),
              it('Unión galv. IMC 1"', 'Un', 15, 0, 4_622.4, { materialId: 'm21', proveedorId: 'prv-rg', instalada: 15 }),
              it('Unión galv. IMC 1-1/2"', 'Un', 10, 0, 8_791.2, { materialId: 'm23', proveedorId: 'prv-rg', instalada: 10 }),
              it('Bandeja portacable tipo malla 54x300 mm', 'Un', 12, 35_000, 118_500, { materialId: 'm25', proveedorId: 'prv-edv', instalada: 12 }),
              it('Caja de paso metálica 20x20', 'Un', 10, 15_000, 38_900, { materialId: 'm26', proveedorId: 'prv-edv', instalada: 6 }),
              it('Curva galv. IMC 1"', 'Un', 25, 4_000, 12_300, { materialId: 'm27', proveedorId: 'prv-edv', instalada: 18 }),
              it('Coraza americana 1"', 'Mts', 50, 2_500, 6_754.1, { materialId: 'm28', proveedorId: 'prv-edv', instalada: 58 }),
            ],
          },
          {
            id: 'p2-s2',
            nombre: 'Cableado',
            items: [
              it('Cable F-UTP Cat 6A LSZH', 'Mts', 305, 1_800, 2_650, { materialId: 'm22', proveedorId: 'prv-rg', instalada: 330 }),
              it('Instalación y certificación de punto Cat 6A', 'Un', 16, 38_000, 0, { instalada: 9 }),
            ],
          },
          {
            id: 'p2-s3',
            nombre: 'Equipos activos',
            items: [
              it('Switch Aruba Instant On 1930 24G 4SFP+ JL682A', 'Un', 1, 60_000, 1_101_297, { materialId: 'm24', proveedorId: 'prv-ingram', instalada: 1 }),
              it('Flete equipos', 'Un', 1, 0, 13_000, { proveedorId: 'prv-ingram', instalada: 1 }),
            ],
          },
        ],
        otrosCostos: otros([1, 150_000], [1, 180_000], [0, 0], [2, 90_000]),
        utilidadPct: null,
        ajustesPct: null,
        precioFinal: 9_850_000,
        estado: 'aprobada',
        historial: [
          { estado: 'borrador', fecha: '2026-08-20' },
          { estado: 'enviada', fecha: '2026-08-21' },
          { estado: 'aprobada', fecha: '2026-08-28' },
        ],
      },
    ],
  },
  ocCliente: {
    numero: 'LOC-0089412',
    fecha: '2026-08-31',
    valor: 9_850_000,
    adjunto: { nombre: 'LOC-0089412.pdf', tipo: 'pdf' },
  },
  imprevistos: [
    {
      id: 'imp-21',
      fecha: '2026-10-03',
      texto: 'Ducto existente obstruido en el tramo del pasillo del piso 2. Se rehízo la ruta en coraza: se requirieron 8 m adicionales y más cable F-UTP.',
      foto: { nombre: 'ducto_obstruido.jpg', tipo: 'img' },
    },
  ],
  seriales: [{ id: 's21', equipo: 'Switch', referencia: 'Aruba Instant On 1930 JL682A', serial: 'SG3AL7K0QH' }],
  entrega: entregaVacia(),
  facturaCliente: null,
}

// ─────────────────────────────────────────────────────────────────────
// Proyecto 3 — cotización enviada, pendiente de respuesta.
// ─────────────────────────────────────────────────────────────────────

const proyecto3: Proyecto = {
  id: 'p3',
  codigo: 'PRY-2026-019',
  nombre: 'Ampliación red inalámbrica – Bodega de producto terminado',
  clienteId: 'cli-papeles',
  sede: 'Planta Puerto Caldas · Bodega de producto terminado',
  responsable: 'Coordinación técnica Infrasoft',
  etapa: 1,
  creado: '2026-09-24',
  levantamiento: {
    fecha: '2026-09-26',
    responsable: 'Coordinación técnica Infrasoft',
    medidas: [
      { etiqueta: 'Área de bodega', valor: '1.800 m²' },
      { etiqueta: 'Altura de montaje de AP', valor: '6 m' },
      { etiqueta: 'Access points requeridos', valor: '6' },
    ],
    rutaTuberia: 'Cable por bandeja existente de la bodega hasta cada punto de montaje en columna.',
    rackOrigen: 'Gabinete de bodega existente',
    rackDestino: 'Puntos de montaje en columnas C2, C5, C8, F2, F5 y F8',
    observaciones: 'Se requiere plataforma elevadora suministrada por el cliente.',
  },
  fotos: [
    { id: 'f31', titulo: 'Nave de bodega', etapa: 'levantamiento', tono: 30 },
    { id: 'f32', titulo: 'Gabinete existente', etapa: 'levantamiento', tono: 210 },
  ],
  cotizacion: {
    consecutivo: 'COT-2026-061',
    alcance:
      'Suministro, instalación y configuración de 6 access points Aruba Instant On para cobertura inalámbrica de la bodega de producto terminado, incluyendo cableado Cat 6 hasta cada punto.',
    tiempoEntrega: '10 días hábiles a partir de la orden de compra',
    condiciones: 'Forma de pago: crédito 30 días.\nValidez de la oferta: 30 días.',
    versionActivaId: 'p3-v1',
    versiones: [
      {
        id: 'p3-v1',
        nombre: 'v1',
        creada: '2026-09-30',
        secciones: [
          {
            id: 'p3-s1',
            nombre: 'Red inalámbrica',
            items: [
              it('Access point Aruba Instant On AP22', 'Un', 6, 45_000, 520_000, { materialId: 'm40', proveedorId: 'prv-ingram' }),
              it('Cable UTP Cat 6', 'Mts', 180, 1_500, 1_950, { materialId: 'm30', proveedorId: 'prv-rg' }),
              it('Jack Cat 6', 'Un', 12, 0, 12_500, { materialId: 'm31', proveedorId: 'prv-rg' }),
              it('Patch cord UTP Cat 6 x 1 mt', 'Un', 6, 0, 9_500, { materialId: 'm33', proveedorId: 'prv-rg' }),
              it('Configuración y puesta en marcha', 'Un', 1, 350_000, 0),
            ],
          },
        ],
        otrosCostos: otros([1, 150_000], [0, 0], [0, 0], [0, 0]),
        utilidadPct: null,
        ajustesPct: null,
        precioFinal: 6_150_000,
        estado: 'enviada',
        historial: [
          { estado: 'borrador', fecha: '2026-09-30' },
          { estado: 'enviada', fecha: '2026-10-01' },
        ],
      },
    ],
  },
  ocCliente: null,
  imprevistos: [],
  seriales: [],
  entrega: entregaVacia(),
  facturaCliente: null,
}

export const proyectos: Proyecto[] = [proyecto1, proyecto2, proyecto3]
