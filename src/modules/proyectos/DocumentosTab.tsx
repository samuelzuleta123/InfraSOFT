import { useNavigate } from 'react-router-dom'
import { FileText, FolderOpen, Image as ImageIcon, Receipt, ShoppingCart } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import { AdjuntoChip, FechaTexto, FotoPlaceholder } from '@/components/dominio'
import { documentosProyecto, type DocExpediente, type GrupoDoc } from '@/lib/expediente'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Proyecto } from '@/types'

const ORDEN: GrupoDoc[] = ['Cotización', 'Cliente', 'Compras', 'Proveedores', 'Obra', 'Entrega', 'Facturación']

/** Expediente documental: miniaturas que abren la vista previa o el documento generado. */
export function DocumentosTab({ proyecto }: { proyecto: Proyecto }) {
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const proveedores = useStore((s) => s.proveedores)
  const docs = documentosProyecto(proyecto, ordenes, facturas, proveedores)
  const fotos = proyecto.fotos

  return (
    <div className="space-y-6">
      <section aria-labelledby="g-docs">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="g-docs" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            Expediente
            <span className="num rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">{docs.length}</span>
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {ORDEN.filter((g) => docs.some((d) => d.grupo === g)).map((g) => (
              <span key={g} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', estilo[g].franja)} aria-hidden />
                {g}
              </span>
            ))}
          </div>
        </div>
        {docs.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {[...docs]
              .sort((a, b) => ORDEN.indexOf(a.grupo) - ORDEN.indexOf(b.grupo))
              .map((d) => (
                <TarjetaDoc key={d.id} d={d} />
              ))}
          </div>
        ) : (
          <Card>
            <EmptyState icon={<FolderOpen />} title="Aún no hay documentos" description="Las cotizaciones, órdenes de compra, facturas y actas aparecen aquí a medida que avanza el proyecto." />
          </Card>
        )}
      </section>

      <section aria-labelledby="g-fotos">
        <h2 id="g-fotos" className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          Fotos del proyecto
          <span className="num rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">{fotos.length}</span>
        </h2>
        {fotos.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {fotos.map((f) => (
              <FotoBoton key={f.id} titulo={f.titulo} tono={f.tono} url={f.url} etapa={f.etapa} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState icon={<FolderOpen />} title="Sin fotos todavía" />
          </Card>
        )}
      </section>
    </div>
  )
}

function FotoBoton({ titulo, tono, url, etapa }: { titulo: string; tono: number; url?: string; etapa: string }) {
  const abrir = useStore((s) => s.abrirVisor)
  return (
    <button
      type="button"
      onClick={() => abrir({ adjunto: { nombre: `${titulo}.jpg`, tipo: 'img' }, contexto: { tipo: 'foto', titulo, tono, url } })}
      className="group text-left"
    >
      <FotoPlaceholder foto={{ titulo, tono, url }} className="transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-brand-500/60" />
      <span className="mt-1 block text-xs text-slate-500 capitalize">{etapa === 'levantamiento' ? 'Levantamiento' : 'Ejecución'}</span>
    </button>
  )
}

const estilo: Record<GrupoDoc, { franja: string; icono: typeof FileText }> = {
  Cotización: { franja: 'bg-brand-600', icono: FileText },
  Cliente: { franja: 'bg-sky-600', icono: FileText },
  Compras: { franja: 'bg-amber-500', icono: ShoppingCart },
  Proveedores: { franja: 'bg-slate-500', icono: Receipt },
  Obra: { franja: 'bg-orange-500', icono: ImageIcon },
  Entrega: { franja: 'bg-teal-600', icono: FileText },
  Facturación: { franja: 'bg-brand-800', icono: Receipt },
}

function TarjetaDoc({ d }: { d: DocExpediente }) {
  const nav = useNavigate()
  const abrir = useStore((s) => s.abrirVisor)
  const { franja, icono: Icono } = estilo[d.grupo]
  const accion = () => (d.ruta ? nav(d.ruta) : d.adjunto && abrir({ adjunto: d.adjunto, contexto: d.contexto ?? { tipo: 'generico' } }))

  return (
    <article className="group flex flex-col">
      <button type="button" onClick={accion} className="relative block aspect-[3/4] overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`Abrir ${d.tipo} ${d.numero}`}>
        {d.contexto?.tipo === 'foto' ? (
          <span className="absolute inset-0">
            <FotoPlaceholder foto={{ titulo: '', tono: d.contexto.tono, url: d.contexto.url }} className="h-full aspect-auto rounded-none" />
          </span>
        ) : (
          <>
            <span className={cn('absolute inset-x-0 top-0 h-1.5', franja)} aria-hidden />
            <span className="absolute inset-x-4 top-5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <Icono className="size-3" aria-hidden />
              {d.tipo}
            </span>
            <span className="absolute inset-x-4 top-10 bottom-10" aria-hidden>
              <MiniPagina tipo={d.tipo} />
            </span>
            {d.valor !== undefined && <span className="num absolute right-4 bottom-4 text-xs font-semibold text-slate-700">{money(d.valor)}</span>}
            <span className="absolute bottom-4 left-4 text-xs font-semibold text-slate-500 uppercase">{d.ruta ? 'Generado' : d.adjunto?.tipo}</span>
          </>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">{d.ruta ? 'Abrir documento' : 'Vista previa'}</span>
      </button>
      <div className="mt-2 min-w-0">
        <div className="truncate text-xs font-medium text-slate-500">{d.tipo}</div>
        <div className="truncate text-[13px] font-medium text-slate-900" title={d.numero}>
          {d.numero}
        </div>
        <div className="truncate text-xs text-slate-500">
          <FechaTexto iso={d.fecha} />
          {d.detalle && <> · {d.detalle}</>}
        </div>
        {d.extra?.map((a) => (
          <span key={a.nombre} className="mt-1 inline-flex">
            <AdjuntoChip adjunto={a} etiqueta={a.tipo === 'xml' ? 'XML' : a.nombre} contexto={d.contexto} />
          </span>
        ))}
      </div>
    </article>
  )
}

/** Esquema de página según el tipo de documento, para reconocerlo sin leer la etiqueta. */
function MiniPagina({ tipo }: { tipo: string }) {
  const linea = (w: number, k: number) => <span key={k} className="block h-1 rounded bg-slate-200" style={{ width: `${w}%` }} />
  if (tipo === 'Informe de entrega')
    return (
      <span className="block space-y-1.5">
        {linea(80, 0)}
        <span className="grid grid-cols-2 gap-1">
          {[210, 30, 160, 200].map((t) => (
            <span key={t} className="block aspect-[4/3] rounded-sm" style={{ background: `hsl(${t} 20% 80%)` }} />
          ))}
        </span>
        {linea(90, 1)}
        {linea(60, 2)}
      </span>
    )
  if (tipo === 'Acta de conformidad')
    return (
      <span className="relative block h-full space-y-1.5">
        {[100, 95, 100, 70].map(linea)}
        <span className="absolute inset-x-0 bottom-1 grid grid-cols-2 gap-3">
          <span className="block border-t border-slate-400" />
          <span className="block border-t border-slate-400" />
        </span>
        <span className="absolute right-0 bottom-5 size-7 rotate-[-10deg] rounded-full border-2 border-brand-600/60" />
      </span>
    )
  if (tipo === 'Certificación')
    return (
      <span className="block space-y-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="h-1 w-3 rounded bg-slate-300" />
            <span className="h-1 flex-1 rounded bg-slate-100" />
            <span className="h-1.5 w-3 rounded-sm bg-brand-200" />
          </span>
        ))}
      </span>
    )
  if (tipo === 'Remisión')
    return (
      <span className="block space-y-1.5">
        {linea(60, 0)}
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="size-1.5 rounded-sm border border-slate-400" />
            <span className="h-1 flex-1 rounded bg-slate-200" />
          </span>
        ))}
      </span>
    )
  // Cotizaciones, órdenes de compra y facturas: encabezado, tabla y total.
  return (
    <span className="block space-y-1.5">
      <span className="flex justify-between">
        {linea(40, 0)}
        <span className="block h-2 w-6 rounded-sm bg-slate-200" />
      </span>
      <span className="block h-1.5 rounded-sm bg-slate-300" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="flex justify-between gap-2">
          <span className="block h-1 flex-1 rounded bg-slate-100" />
          <span className="block h-1 w-4 rounded bg-slate-200" />
        </span>
      ))}
    </span>
  )
}
