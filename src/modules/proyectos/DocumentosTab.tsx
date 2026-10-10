import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, FileSignature, FileSpreadsheet, FileText, Receipt, ReceiptText, ShoppingCart } from 'lucide-react'
import { Badge, Card, CardHeader } from '@/components/ui'
import { AdjuntoChip, EstadoCotBadge, FechaTexto } from '@/components/dominio'
import { resumen, totalFactura, totalOC } from '@/lib/calc'
import { money } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { Adjunto, Proyecto } from '@/types'

interface Doc {
  numero: ReactNode
  detalle?: ReactNode
  fecha?: string | null
  valor?: number
  extra?: ReactNode
  adjuntos?: Adjunto[]
  to?: string
}

export function DocumentosTab({ proyecto }: { proyecto: Proyecto }) {
  const ordenes = useStore((s) => s.ordenes).filter((o) => o.proyectoId === proyecto.id)
  const facturas = useStore((s) => s.facturas).filter((f) => f.proyectoId === proyecto.id)
  const proveedores = useStore((s) => s.proveedores)
  const fc = proyecto.facturaCliente
  const pid = proyecto.id

  const grupos: { tipo: string; icon: ReactNode; docs: Doc[] }[] = [
    {
      tipo: 'Cotizaciones',
      icon: <FileSpreadsheet />,
      docs: proyecto.cotizacion.versiones.map((v) => ({
        numero: `${proyecto.cotizacion.consecutivo}-${v.nombre.toUpperCase()}`,
        fecha: v.creada,
        valor: resumen(v).precioVigente,
        extra: <EstadoCotBadge estado={v.estado} />,
        to: `/proyectos/${pid}/cotizacion/pdf`,
      })),
    },
    {
      tipo: 'Orden de compra del cliente',
      icon: <ClipboardCheck />,
      docs: proyecto.ocCliente
        ? [{ numero: proyecto.ocCliente.numero, fecha: proyecto.ocCliente.fecha, valor: proyecto.ocCliente.valor, adjuntos: proyecto.ocCliente.adjunto ? [proyecto.ocCliente.adjunto] : [] }]
        : [],
    },
    {
      tipo: 'Órdenes de compra a proveedores',
      icon: <ShoppingCart />,
      docs: ordenes.map((o) => ({ numero: `OC ${o.consecutivo}`, detalle: nombreProveedor(proveedores, o.proveedorId), fecha: o.fecha, valor: totalOC(o), to: `/proyectos/${pid}/oc/${o.id}` })),
    },
    {
      tipo: 'Facturas de proveedores',
      icon: <ReceiptText />,
      docs: facturas.map((f) => ({ numero: f.numero, detalle: nombreProveedor(proveedores, f.proveedorId), fecha: f.fecha, valor: totalFactura(f), adjuntos: f.adjuntos, to: `/facturas?f=${f.id}` })),
    },
    {
      tipo: 'Informe de entrega',
      icon: <FileText />,
      docs: proyecto.entrega.fechaEntrega
        ? [
            {
              numero: 'Informe de entrega',
              fecha: proyecto.entrega.fechaEntrega,
              adjuntos: proyecto.entrega.certificacion ? [proyecto.entrega.certificacion] : [],
              to: `/proyectos/${pid}/entrega/informe`,
            },
          ]
        : [],
    },
    {
      tipo: 'Acta de conformidad',
      icon: <FileSignature />,
      docs: proyecto.entrega.actaFirmada ? [{ numero: 'Acta de conformidad firmada', fecha: proyecto.entrega.fechaEntrega, adjuntos: [proyecto.entrega.actaFirmada] }] : [],
    },
    {
      tipo: 'Factura al cliente',
      icon: <Receipt />,
      docs: fc ? [{ numero: fc.numero, detalle: fc.formaPago, fecha: fc.fecha, valor: fc.valorBruto * (1 + (fc.ivaPct ?? 0) / 100), to: `/proyectos/${pid}/cierre` }] : [],
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {grupos.map((g) => (
        <Card key={g.tipo}>
          <CardHeader
            title={
              <span className="flex items-center gap-2 [&>svg]:size-4 [&>svg]:text-slate-400">
                {g.icon}
                {g.tipo}
              </span>
            }
            actions={<Badge>{g.docs.length}</Badge>}
          />
          {g.docs.length === 0 ? (
            <p className="px-5 py-5 text-[13px] text-slate-400">Aún no hay documentos de este tipo.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {g.docs.map((d, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    {d.to ? (
                      <Link to={d.to} className="font-medium text-brand-800 hover:underline">
                        {d.numero}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{d.numero}</span>
                    )}
                    <div className="text-xs text-slate-500">
                      {d.detalle && <>{d.detalle} · </>}
                      <FechaTexto iso={d.fecha} />
                    </div>
                    {d.adjuntos && d.adjuntos.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {d.adjuntos.map((a) => (
                          <AdjuntoChip key={a.nombre} adjunto={a} />
                        ))}
                      </div>
                    )}
                  </div>
                  {d.extra}
                  {d.valor !== undefined && <span className="num text-sm font-medium text-slate-900">{money(d.valor)}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}
