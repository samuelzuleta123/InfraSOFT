import { versionVigente } from '@/lib/calc'
import { generarOrdenes } from '@/lib/compras'
import type { FacturaProveedor, OrdenCompra } from '@/types'
import { proyectos } from './proyectos'

// Órdenes de compra del proyecto 2, generadas desde su cotización aprobada.
const consecutivosP2: Record<string, [string, string]> = {
  'prv-ingram': ['2608-031', '2026-08-31'],
  'prv-rg': ['2609-004', '2026-09-01'],
  'prv-edv': ['2609-005', '2026-09-01'],
}

const p2 = proyectos.find((p) => p.id === 'p2')!
export const ordenesCompra: OrdenCompra[] = generarOrdenes(p2.id, versionVigente(p2), (proveedorId) => consecutivosP2[proveedorId][0]).map(
  (oc) => ({ ...oc, fecha: consecutivosP2[oc.proveedorId][1] }),
)

const ocDe = (proveedorId: string) => ordenesCompra.find((o) => o.proveedorId === proveedorId)!.id

export const facturasProveedor: FacturaProveedor[] = [
  {
    id: 'fp-rg-293076',
    proveedorId: 'prv-rg',
    numero: 'DRG-293076',
    fecha: '2026-10-06',
    vencimiento: '2026-11-06',
    formaPago: 'Crédito 30 días',
    subtotal: 1_331_424,
    iva: 252_971,
    lineas: [
      { id: 'l1', descripcion: 'Tubo galv. IMC 1" x 3 mts', cantidad: 5, precioUnitario: 65_743.2 },
      { id: 'l2', descripcion: 'Unión galv. IMC 1"', cantidad: 15, precioUnitario: 4_622.4 },
      { id: 'l3', descripcion: 'Cable F-UTP Cat 6A LSZH', cantidad: 305, precioUnitario: 2_772 },
      { id: 'l4', descripcion: 'Unión galv. IMC 1-1/2"', cantidad: 10, precioUnitario: 8_791.2 },
    ],
    adjuntos: [
      { nombre: 'DRG-293076.pdf', tipo: 'pdf' },
      { nombre: 'DRG-293076.xml', tipo: 'xml' },
    ],
    proyectoId: 'p2',
    ocId: ocDe('prv-rg'),
  },
  {
    id: 'fp-edv-28045',
    proveedorId: 'prv-edv',
    numero: 'EPE28045',
    fecha: '2026-10-06',
    vencimiento: '2026-11-05',
    formaPago: 'Crédito 30 días',
    subtotal: 2_456_205,
    iva: 466_679,
    lineas: [],
    notas: 'Remisiones SO-929113 y SO-928925',
    adjuntos: [
      { nombre: 'EPE28045.pdf', tipo: 'pdf' },
      { nombre: 'EPE28045.xml', tipo: 'xml' },
    ],
    proyectoId: null,
    ocId: null,
  },
  {
    id: 'fp-ingram-1004401950',
    proveedorId: 'prv-ingram',
    numero: '1004401950',
    fecha: '2026-09-03',
    vencimiento: '2026-09-03',
    formaPago: 'Contado',
    subtotal: 1_114_297,
    iva: 211_716,
    lineas: [
      { id: 'l1', descripcion: 'Switch Aruba Instant On 1930 24G 4SFP+ JL682A', cantidad: 1, precioUnitario: 1_101_297 },
      { id: 'l2', descripcion: 'Flete', cantidad: 1, precioUnitario: 13_000 },
    ],
    notas: 'OC de la empresa 2608-031',
    adjuntos: [
      { nombre: '1004401950.pdf', tipo: 'pdf' },
      { nombre: '1004401950.xml', tipo: 'xml' },
    ],
    proyectoId: 'p2',
    ocId: ocDe('prv-ingram'),
  },
]
