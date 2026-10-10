// Vista previa de documentos adjuntos. En el mockup los archivos no se descargan:
// los documentos con datos (facturas, OC, actas) se dibujan a partir de la información del sistema.
import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Eye, FileCode2, FileText, Image as ImageIcon, X } from 'lucide-react'
import { Logotipo } from '@/components/Marca'
import { FotoPlaceholder } from '@/components/dominio'
import { totalFactura } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { fecha, money } from '@/lib/format'
import { textoObservaciones } from '@/lib/observaciones'
import { useStore, type DocVisor } from '@/store/useStore'

export function VisorDocumento() {
  const visor = useStore((s) => s.visor)
  const cerrar = useStore((s) => s.cerrarVisor)
  const abierto = !!visor
  const { pathname } = useLocation()
  // Al cambiar de página (p. ej. con “atrás” del navegador) la vista previa no queda flotando.
  useEffect(() => cerrar(), [pathname, cerrar])
  useEffect(() => {
    if (!abierto) return
    // En captura y sin propagar: Escape cierra solo el visor, no el modal o panel que quede debajo.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      cerrar()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [abierto, cerrar])
  if (!visor) return null
  const { adjunto } = visor
  const Icono = adjunto.tipo === 'xml' ? FileCode2 : adjunto.tipo === 'img' ? ImageIcon : FileText
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950/80 animate-[fade_150ms_ease-out]" role="dialog" aria-modal="true" aria-label={`Vista previa de ${adjunto.nombre}`}>
      <header className="flex items-center gap-3 border-b border-white/10 bg-slate-950/60 px-4 py-3 text-white sm:px-6">
        <Icono className={cn('size-5 shrink-0', adjunto.tipo === 'pdf' ? 'text-red-400' : adjunto.tipo === 'xml' ? 'text-brand-400' : 'text-slate-300')} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{adjunto.nombre}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="size-3.5" aria-hidden />
            Vista previa · en el mockup los archivos no se descargan
          </div>
        </div>
        <button autoFocus onClick={cerrar} className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Cerrar vista previa">
          <X className="size-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-8" onClick={cerrar}>
        <div className="mx-auto w-full max-w-[8.5in]" onClick={(e) => e.stopPropagation()}>
          <Contenido doc={visor} />
        </div>
      </div>
    </div>
  )
}

function Hoja({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn('min-h-[9in] bg-white px-6 py-8 text-[12px] leading-relaxed text-slate-800 shadow-2xl sm:px-12 sm:py-10', className)}>{children}</article>
}

const Etiqueta = ({ children }: { children: ReactNode }) => <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{children}</div>

function Contenido({ doc }: { doc: DocVisor }) {
  const { adjunto, contexto } = doc
  const facturas = useStore((s) => s.facturas)
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const clientes = useStore((s) => s.clientes)

  // Archivo cargado durante la demo: se muestra tal cual.
  if (adjunto.url && adjunto.tipo === 'img') return <img src={adjunto.url} alt={adjunto.nombre} className="mx-auto max-h-[80dvh] rounded-md shadow-2xl" />
  if (adjunto.url && adjunto.tipo === 'pdf') return <iframe src={`${adjunto.url}#toolbar=0`} title={adjunto.nombre} className="h-[80dvh] w-full rounded-md bg-white shadow-2xl" />

  if (contexto.tipo === 'foto') return <FotoPlaceholder foto={contexto} className="mx-auto aspect-[4/3] w-full rounded-md shadow-2xl" />

  if (contexto.tipo === 'facturaProveedor') {
    const f = facturas.find((x) => x.id === contexto.id)
    const prov = proveedores.find((p) => p.id === f?.proveedorId)
    if (!f || !prov) return <Generica nombre={adjunto.nombre} />
    if (adjunto.tipo === 'xml')
      return (
        <pre className="overflow-x-auto rounded-md bg-slate-900 p-6 font-mono text-[12px] leading-relaxed text-slate-200 shadow-2xl">
          {`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${f.numero}</cbc:ID>
  <cbc:IssueDate>${f.fecha}</cbc:IssueDate>
  <cbc:DueDate>${f.vencimiento}</cbc:DueDate>
  <cac:AccountingSupplierParty>
    <cbc:RegistrationName>${prov.nombre}</cbc:RegistrationName>
    <cbc:CompanyID>${prov.nit.replace(/\./g, '')}</cbc:CompanyID>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cbc:RegistrationName>INFRASOFT SERVICES SAS</cbc:RegistrationName>
    <cbc:CompanyID>900712766-3</cbc:CompanyID>
  </cac:AccountingCustomerParty>
${f.lineas
  .map(
    (l, i) => `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity>${l.cantidad}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${Math.round(l.cantidad * l.precioUnitario)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Description>${l.descripcion}</cbc:Description></cac:Item>
  </cac:InvoiceLine>`,
  )
  .join('\n')}
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="COP">${f.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${f.subtotal + f.iva}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`}
        </pre>
      )
    const conDescuento = f.lineas.some((l) => l.descuentoPct !== undefined)
    return (
      <Hoja>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-300 pb-4">
          <div>
            <div className="text-lg font-bold text-slate-900 uppercase">{prov.nombre}</div>
            <div>NIT {prov.nit} · {prov.ciudad}</div>
          </div>
          <div className="rounded border border-slate-400 px-4 py-2 text-right">
            <div className="text-[10px] font-semibold tracking-wider uppercase">Factura electrónica de venta</div>
            <div className="text-base font-bold">{f.numero}</div>
          </div>
        </header>
        <section className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Etiqueta>Cliente</Etiqueta>
            <div className="font-medium">INFRASOFT SERVICES SAS</div>
            <div>NIT 900.712.766-3 · Calle 4 No. 15-55, Pereira</div>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Etiqueta>Fecha</Etiqueta>
            <span className="num">{fecha(f.fecha)}</span>
            <Etiqueta>Vence</Etiqueta>
            <span className="num">{fecha(f.vencimiento)}</span>
            <Etiqueta>Forma de pago</Etiqueta>
            <span>{f.formaPago}</span>
            <Etiqueta>O.C.</Etiqueta>
            <span>{f.notas?.match(/OC (?:de la empresa )?([\d-]+)/)?.[1] ?? '—'}</span>
          </div>
        </section>
        {f.lineas.length ? (
          <table className="mt-5 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-y border-slate-400 text-left text-[10px] uppercase">
                <th className="py-1.5 pr-2">Código</th>
                <th className="py-1.5">Descripción</th>
                <th className="py-1.5 text-right">Cant.</th>
                <th className="py-1.5 text-right">V. unit.</th>
                {conDescuento && <th className="py-1.5 text-right">Dto %</th>}
                <th className="py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {f.lineas.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-2 font-mono text-[10px]">{l.codigo ?? '—'}</td>
                  <td className="py-1.5">{l.descripcion}</td>
                  <td className="num py-1.5 text-right">{l.cantidad.toLocaleString('es-CO')}</td>
                  <td className="num py-1.5 text-right">{money(l.precioLista ?? l.precioUnitario)}</td>
                  {conDescuento && <td className="num py-1.5 text-right">{l.descuentoPct ?? 0}</td>}
                  <td className="num py-1.5 text-right">{money(l.cantidad * l.precioUnitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-6 text-slate-500">Detalle de ítems no registrado en el sistema.</p>
        )}
        <div className="mt-4 ml-auto w-64 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="num">{money(f.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA</span>
            <span className="num">{money(f.iva)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-400 pt-1 font-bold">
            <span>Total</span>
            <span className="num">{money(totalFactura(f))}</span>
          </div>
        </div>
        {f.notas && <p className="mt-6 text-[11px] text-slate-600">Observaciones: {f.notas}</p>}
      </Hoja>
    )
  }

  const p = 'proyectoId' in contexto ? proyectos.find((x) => x.id === contexto.proyectoId) : undefined
  const cli = clientes.find((c) => c.id === p?.clienteId)
  if (!p || !cli) return <Generica nombre={adjunto.nombre} />

  if (contexto.tipo === 'ocCliente' && p.ocCliente)
    return (
      <Hoja>
        <header className="flex items-start justify-between border-b-2 border-slate-700 pb-4">
          <div>
            <div className="text-lg font-bold text-slate-900">{cli.nombre}</div>
            <div>NIT {cli.nit}</div>
            <div>{cli.direccion}</div>
          </div>
          <div className="text-right">
            <Etiqueta>Orden de compra</Etiqueta>
            <div className="text-lg font-bold">{p.ocCliente.numero}</div>
            <div className="num">{fecha(p.ocCliente.fecha)}</div>
          </div>
        </header>
        <section className="mt-5">
          <Etiqueta>Proveedor</Etiqueta>
          <div className="font-medium">Infrasoft Services S.A.S. · NIT 900.712.766-3</div>
        </section>
        <table className="mt-5 w-full border-collapse">
          <thead>
            <tr className="border-y border-slate-400 text-left text-[10px] uppercase">
              <th className="py-1.5">Descripción</th>
              <th className="py-1.5 text-right">Cant.</th>
              <th className="py-1.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 align-top">
              <td className="py-2 pr-6">
                <div className="font-medium">{p.nombre}</div>
                <div className="text-slate-600">Según cotización {p.cotizacion.consecutivo}.</div>
              </td>
              <td className="num py-2 text-right">1</td>
              <td className="num py-2 text-right">{money(p.ocCliente.valor)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-64 border-t border-slate-400 pt-1 text-right font-bold">
          Valor antes de impuestos <span className="num ml-2">{money(p.ocCliente.valor)}</span>
        </div>
        <p className="mt-10 text-[11px] text-slate-500">Documento del cliente. Representación simulada para el mockup a partir de los datos registrados.</p>
      </Hoja>
    )

  if (contexto.tipo === 'facturaCliente' && p.facturaCliente) {
    const fc = p.facturaCliente
    const iva = fc.valorBruto * ((fc.ivaPct ?? 0) / 100)
    return (
      <Hoja>
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="text-[11px]">
            <div className="font-bold">INFRASOFT SERVICES SAS</div>
            <div>900.712.766-3 · Calle 4 No 15 55</div>
            <div>(57) 3168743177 · Pereira - Colombia</div>
            <div>comercial@infrasoft.net.co</div>
          </div>
          <div className="text-right">
            <Logotipo tamano="md" />
            <div className="mt-2 text-base font-bold">Factura electrónica de venta</div>
            <div className="text-base font-bold">N°. {fc.numero}</div>
          </div>
        </header>
        <section className="mt-5 grid grid-cols-2 gap-4 text-[11px]">
          <div>
            <div>
              <b>Cliente:</b> {cli.nombre}
            </div>
            <div>
              <b>NIT:</b> {cli.nit}
            </div>
            <div>
              <b>Dirección:</b> {cli.direccion}
            </div>
          </div>
          <div className="text-right">
            <div>
              <b>Expedición:</b> <span className="num">{fecha(fc.fecha)}</span>
            </div>
            <div>
              <b>Vencimiento:</b> <span className="num">{fecha(fc.vencimiento)}</span>
            </div>
            <div>
              <b>Forma de pago:</b> {fc.formaPago}
            </div>
          </div>
        </section>
        <table className="mt-5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-400 text-left text-[10px] uppercase">
              <th className="py-1.5">Ítem</th>
              <th className="py-1.5">Descripción</th>
              <th className="py-1.5 text-right">Cant.</th>
              <th className="py-1.5 text-right">Vr. unitario</th>
              <th className="py-1.5 text-right">Impto.</th>
              <th className="py-1.5 text-right">Vr. total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-1.5">1</td>
              <td className="py-1.5">{p.nombre}</td>
              <td className="num py-1.5 text-right">1</td>
              <td className="num py-1.5 text-right">{money(fc.valorBruto)}</td>
              <td className="num py-1.5 text-right">{fc.ivaPct ?? 0} %</td>
              <td className="num py-1.5 text-right">{money(fc.valorBruto + iva)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-6">
          <div>
            <Etiqueta>Observaciones</Etiqueta>
            <p className="mt-1 text-[11px] whitespace-pre-line">{textoObservaciones(p)}</p>
            {p.ocCliente && (
              <p className="mt-2 text-[11px]">
                <b>Orden de compra:</b> {p.ocCliente.numero}
              </p>
            )}
          </div>
          <div className="w-56 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Total bruto</span>
              <span className="num">{money(fc.valorBruto)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA {fc.ivaPct ?? 0} %</span>
              <span className="num">{money(iva)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-400 pt-1 font-bold">
              <span>Total a pagar</span>
              <span className="num">{money(fc.valorBruto + iva)}</span>
            </div>
          </div>
        </div>
        <p className="mt-10 text-[10px] text-slate-500">Factura emitida en el POS de la empresa. Representación simulada para el mockup.</p>
      </Hoja>
    )
  }

  if (contexto.tipo === 'acta')
    return (
      <Hoja className="relative bg-[#fbfaf6]">
        <div className="flex items-start justify-between">
          <Logotipo tamano="sm" />
          <div className="text-right text-[11px] text-slate-500">{p.codigo}</div>
        </div>
        <h2 className="mt-8 text-center text-sm font-semibold tracking-wide uppercase">Acta de entrega y recibo a satisfacción</h2>
        <p className="mt-5 text-justify">
          {cli.nombre}, NIT {cli.nit}, recibe a satisfacción por parte de Infrasoft Services S.A.S. los trabajos del proyecto “{p.nombre}”
          {p.ocCliente && <> según la orden de compra {p.ocCliente.numero}</>}, entregados el {fecha(p.entrega.fechaEntrega)}.
        </p>
        <p className="mt-3 text-justify">{p.cotizacion.alcance}</p>
        <div className="mt-20 grid grid-cols-2 gap-10">
          <div className="relative border-t border-slate-500 pt-1.5 text-[11px]">
            <svg viewBox="0 0 160 40" className="absolute -top-12 left-4 h-12 w-40 text-slate-700" aria-hidden>
              <path d="M5 30c15-25 25-25 30-5s15 10 25-10 20 15 30 5 25-15 35 0 15 5 30-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Entrega · Infrasoft Services S.A.S.
          </div>
          <div className="relative border-t border-slate-500 pt-1.5 text-[11px]">
            <svg viewBox="0 0 160 40" className="absolute -top-12 left-6 h-12 w-40 text-blue-900" aria-hidden>
              <path d="M5 25c10-20 20 10 30-5s10-15 20 0 15 15 25-10 10 20 30 5 20-15 40 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Recibe · {cli.nombre}
          </div>
        </div>
        <div className="absolute right-12 bottom-24 rotate-[-8deg] rounded-md border-2 border-brand-700 px-4 py-2 text-center text-brand-700 opacity-80">
          <div className="text-xs font-bold tracking-widest uppercase">Recibido</div>
          <div className="num text-[11px]">{fecha(p.entrega.fechaEntrega)}</div>
        </div>
        <p className="absolute bottom-6 left-12 text-[10px] text-slate-400">Copia escaneada · representación simulada para el mockup</p>
      </Hoja>
    )

  if (contexto.tipo === 'certificacion')
    return (
      <Hoja>
        <div className="flex items-start justify-between border-b border-slate-300 pb-3">
          <div>
            <div className="text-base font-bold">Reporte de certificación</div>
            <div className="text-slate-600">{p.nombre}</div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            {p.codigo}
            <br />
            {fecha(p.entrega.fechaEntrega)}
          </div>
        </div>
        <p className="mt-4 text-slate-600">Resultados del equipo de certificación adjuntos por el técnico. El mockup no incluye las mediciones reales; se muestra la estructura del reporte.</p>
        <div className="mt-5 space-y-2" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-16 text-[11px] text-slate-500">Hilo {i + 1}</span>
              <span className="h-2 flex-1 rounded bg-slate-100" />
              <span className="h-4 w-12 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </Hoja>
    )

  return <Generica nombre={adjunto.nombre} />
}

function Generica({ nombre }: { nombre: string }) {
  return (
    <Hoja>
      <div className="text-base font-semibold">{nombre}</div>
      <p className="mt-2 text-slate-500">Archivo adjunto de demostración.</p>
      <div className="mt-8 space-y-3" aria-hidden>
        {[92, 100, 85, 96, 70, 100, 88, 60].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
        ))}
      </div>
    </Hoja>
  )
}
