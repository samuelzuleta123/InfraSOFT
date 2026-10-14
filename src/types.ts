// Fechas en ISO (AAAA-MM-DD); se muestran como DD/MM/AAAA.
export type ISODate = string

export type Unidad = 'Un' | 'Mts'

export interface Cliente {
  id: string
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  contacto?: string
}

export interface Proveedor {
  id: string
  nombre: string
  nit: string
  ciudad: string
}

export type CategoriaMaterial = 'Fibra óptica' | 'Cableado' | 'Canalización' | 'Equipos activos' | 'Inalámbrico' | 'Racks y gabinetes' | 'Energía'

export interface Material {
  id: string
  codigo: string
  descripcion: string
  unidad: Unidad
  categoria: CategoriaMaterial
}

/** Precio vigente de un material en un proveedor. El % de descuento lo digita el usuario (null = 0). */
export interface PrecioProveedor {
  id: string
  materialId: string
  proveedorId: string
  precioLista: number
  descuentoPct: number | null
  fecha: ISODate
}

export interface HistorialPrecio {
  id: string
  materialId: string
  proveedorId: string
  precioLista: number
  descuentoPct: number | null
  fecha: ISODate
}

export interface ItemCotizacion {
  id: string
  materialId?: string
  descripcion: string
  unidad: Unidad
  cantidad: number
  vuMO: number
  vuMaterial: number
  proveedorId: string | null
  /** Cantidad instalada en obra (bitácora). null = sin registrar. */
  cantInstalada: number | null
}

export interface Seccion {
  id: string
  nombre: string
  items: ItemCotizacion[]
}

export type OtroCostoClave = 'siso' | 'polizas' | 'viaticos' | 'transporte'

export interface OtroCosto {
  clave: OtroCostoClave
  nombre: string
  cantidad: number
  valorUnitario: number
}

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'

export interface CambioEstado {
  estado: EstadoCotizacion
  fecha: ISODate
}

export interface VersionCotizacion {
  id: string
  nombre: string // v1, v2…
  creada: ISODate
  secciones: Seccion[]
  otrosCostos: OtroCosto[]
  utilidadPct: number | null
  ajustesPct: number | null
  precioFinal: number | null
  estado: EstadoCotizacion
  historial: CambioEstado[]
}

export interface Cotizacion {
  consecutivo: string
  alcance: string
  tiempoEntrega: string
  condiciones: string
  versiones: VersionCotizacion[]
  versionActivaId: string
}

export interface Adjunto {
  nombre: string
  tipo: 'pdf' | 'xml' | 'img' | 'otro'
  url?: string
}

export interface OCCliente {
  numero: string
  fecha: ISODate
  valor: number
  adjunto: Adjunto | null
}

export interface LineaOC {
  id: string
  itemId: string | null
  descripcion: string
  unidad: Unidad
  cantidad: number
  precioUnitario: number
  /** Valores de la cotización al momento de generar, para resaltar diferencias. */
  cantidadCotizada: number | null
  precioCotizado: number | null
}

export interface OrdenCompra {
  id: string
  consecutivo: string
  proyectoId: string
  proveedorId: string
  proveedorOriginalId: string
  fecha: ISODate
  lineas: LineaOC[]
}

export type FormaPago = 'Contado' | 'Crédito 30 días' | 'Crédito 45 días' | 'Crédito 60 días'

export interface LineaFactura {
  id: string
  /** Código del producto en el sistema del proveedor. */
  codigo?: string
  descripcion: string
  cantidad: number
  /** Precio unitario neto (después del descuento de la línea). */
  precioUnitario: number
  /** Precio de lista y % de descuento tal como vienen en la factura, cuando el proveedor los discrimina. */
  precioLista?: number
  descuentoPct?: number
}

export interface FacturaProveedor {
  id: string
  proveedorId: string
  numero: string
  fecha: ISODate
  vencimiento: ISODate
  formaPago: FormaPago
  subtotal: number
  iva: number
  lineas: LineaFactura[]
  notas?: string
  adjuntos: Adjunto[]
  proyectoId: string | null
  ocId: string | null
  /** Marcada como pagada por el usuario. Las pagadas salen de “por vencer”. */
  pagada?: boolean
}

export interface Imprevisto {
  id: string
  fecha: ISODate
  texto: string
  foto: Adjunto | null
}

export interface SerialEquipo {
  id: string
  equipo: string
  referencia: string
  serial: string
}

export interface FotoObra {
  id: string
  titulo: string
  etapa: 'levantamiento' | 'ejecucion'
  tono: number // para generar el placeholder
  /** Imagen real; sin ella se dibuja el placeholder. */
  url?: string
}

export interface Levantamiento {
  fecha: ISODate
  responsable: string
  medidas: { etiqueta: string; valor: string }[]
  rutaTuberia: string
  rackOrigen: string
  rackDestino: string
  observaciones: string
}

export interface Entrega {
  fotosSeleccionadas: string[]
  certificacion: Adjunto | null
  actaFirmada: Adjunto | null
  fechaEntrega: ISODate | null
  garantia: string
  remision: string
  fechaRemision?: ISODate | null
}

export interface FacturaCliente {
  numero: string
  fecha: ISODate
  vencimiento: ISODate
  valorBruto: number
  ivaPct: number | null
  formaPago: FormaPago
}

export type Etapa = 1 | 2 | 3 | 4 | 5

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  clienteId: string
  sede: string
  responsable: string
  etapa: Etapa
  creado: ISODate
  levantamiento: Levantamiento | null
  fotos: FotoObra[]
  cotizacion: Cotizacion
  ocCliente: OCCliente | null
  imprevistos: Imprevisto[]
  seriales: SerialEquipo[]
  entrega: Entrega
  facturaCliente: FacturaCliente | null
}

export interface KitItem {
  materialId?: string
  descripcion: string
  unidad: Unidad
  cantidad: number
  vuMO: number
}

export interface Kit {
  id: string
  nombre: string
  descripcion: string
  items: KitItem[]
}

/** Contexto con el que el visor dibuja un adjunto (vista previa sin descarga). */
export type ContextoDoc =
  | { tipo: 'facturaProveedor'; id: string }
  | { tipo: 'ocCliente'; proyectoId: string }
  | { tipo: 'facturaCliente'; proyectoId: string }
  | { tipo: 'certificacion'; proyectoId: string }
  | { tipo: 'acta'; proyectoId: string }
  | { tipo: 'foto'; titulo: string; tono: number; url?: string }
  | { tipo: 'generico' }
