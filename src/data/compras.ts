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

// Órdenes de compra del proyecto 1 (cerrado), emitidas tras la OC del cliente LOC-0081930.
const consecutivosP1: Record<string, string> = { 'prv-rg': '2411-018', 'prv-edv': '2411-019', 'prv-ingram': '2411-020' }
const p1 = proyectos.find((p) => p.id === 'p1')!

export const ordenesCompra: OrdenCompra[] = [
  ...generarOrdenes(p1.id, versionVigente(p1), (proveedorId) => consecutivosP1[proveedorId]).map((oc) => ({ ...oc, id: `oc-p1-${oc.consecutivo}`, fecha: '2024-11-30' })),
  ...generarOrdenes(p2.id, versionVigente(p2), (proveedorId) => consecutivosP2[proveedorId][0]).map((oc) => ({ ...oc, fecha: consecutivosP2[oc.proveedorId][1] })),
]

const ocDe = (proveedorId: string) => ordenesCompra.find((o) => o.proyectoId === 'p2' && o.proveedorId === proveedorId)!.id

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
      { id: 'l1', codigo: '25-4054', descripcion: 'Tubo galv. IMC 1" x 3 mts', cantidad: 5, precioUnitario: 65_743.2 },
      { id: 'l2', codigo: '25-2082', descripcion: 'Unión galv. IMC 1"', cantidad: 15, precioUnitario: 4_622.4 },
      { id: 'l3', codigo: '53-2100', descripcion: 'Cable F-UTP Cat 6A LSZH', cantidad: 305, precioUnitario: 2_772 },
      { id: 'l4', codigo: '25-2086', descripcion: 'Unión galv. IMC 1-1/2"', cantidad: 10, precioUnitario: 8_791.2 },
    ],
    notas: 'Pedido DPD-631241 · La factura no trae número de orden de compra',
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
    lineas: [
      { id: 'l1', codigo: '1301-160544', descripcion: 'Reducción 1 1/2" - 1" macho-hembra galvanizada', cantidad: 4, precioLista: 12_837, descuentoPct: 22, precioUnitario: 12_837 * (1 - 22 / 100) },
      { id: 'l2', codigo: '1306-160322', descripcion: 'Coraza 1" LT americana', cantidad: 34, precioLista: 9_802, descuentoPct: 23, precioUnitario: 9_802 * (1 - 23 / 100) },
      { id: 'l3', codigo: '1306-RL-824', descripcion: 'Conector recto 1 1/2" LT para coraza', cantidad: 12, precioLista: 10_114, descuentoPct: 25, precioUnitario: 10_114 * (1 - 25 / 100) },
      { id: 'l4', codigo: '1306-LTS-100', descripcion: 'Conector recto 1" LT para coraza', cantidad: 16, precioLista: 5_640, descuentoPct: 25, precioUnitario: 5_640 * (1 - 25 / 100) },
      { id: 'l5', codigo: '1301-160693', descripcion: 'Tubo 1" IMC galvanizado 3 mts (importado)', cantidad: 20, precioLista: 38_106, descuentoPct: 22, precioUnitario: 38_106 * (1 - 22 / 100) },
      { id: 'l6', codigo: '1301-160662', descripcion: 'Tubo 1 1/2" IMC galvanizado 3 mts (importado)', cantidad: 30, precioLista: 53_036, descuentoPct: 22, precioUnitario: 53_036 * (1 - 22 / 100) },
      { id: 'l7', codigo: '1301-ALX-150M', descripcion: 'Tubo 1 1/2" IMC galvanizado 3 mts (Impordecol)', cantidad: 2, precioLista: 107_361, descuentoPct: 23, precioUnitario: 107_361 * (1 - 23 / 100) },
    ],
    notas: 'Remisiones SO-929113 y SO-928925 · La factura no trae número de orden de compra',
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
      { id: 'l1', codigo: 'JL680A', descripcion: 'Switch Aruba Instant On 1930 8G 2SFP JL680A', cantidad: 3, precioUnitario: 367_099 },
      { id: 'l2', codigo: 'FREIGHT', descripcion: 'Flete', cantidad: 1, precioUnitario: 13_000 },
    ],
    notas: 'OC de la empresa 2608-031 · Pedido 7111402465',
    adjuntos: [
      { nombre: '1004401950.pdf', tipo: 'pdf' },
      { nombre: '1004401950.xml', tipo: 'xml' },
    ],
    proyectoId: 'p2',
    ocId: ocDe('prv-ingram'),
  },
]
