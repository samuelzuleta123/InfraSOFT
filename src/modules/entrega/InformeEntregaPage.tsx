import { Navigate, useParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { FotoPlaceholder } from '@/components/dominio'
import { fecha, HOY } from '@/lib/format'
import type { Proyecto } from '@/types'
import { useCliente, useProyecto } from '@/store/useStore'
import { fraseGarantia } from '@/lib/observaciones'

function Encabezado({ titulo, proyecto }: { titulo: string; proyecto: Proyecto }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
      <MembreteInfrasoft />
      <div className="text-right">
        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{titulo}</div>
        <div className="text-sm font-semibold text-slate-900">{proyecto.codigo}</div>
        <div className="num text-xs text-slate-500">Pereira, {fecha(proyecto.entrega.fechaEntrega ?? HOY)}</div>
      </div>
    </header>
  )
}

/** Informe técnico de lo ejecutado: alcance, fotos, equipos, certificación y garantía. */
export function InformeEntregaPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const e = proyecto.entrega
  const fotos = proyecto.fotos.filter((f) => e.fotosSeleccionadas.includes(f.id))

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/entrega`} volverTexto="Volver a entrega" />
      <HojaCarta>
        <Encabezado titulo="Informe de entrega" proyecto={proyecto} />
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Cliente</div>
            <div className="mt-1 font-semibold text-slate-900">{cliente.nombre}</div>
            <div>NIT {cliente.nit}</div>
            <div>{cliente.direccion}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>{proyecto.sede}</div>
            {proyecto.ocCliente && <div>OC del cliente {proyecto.ocCliente.numero}</div>}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Trabajos realizados</h2>
          <p className="mt-1 text-justify whitespace-pre-line">{proyecto.entrega.trabajosRealizados || proyecto.cotizacion.alcance}</p>
        </section>

        {fotos.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Registro fotográfico</h2>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {fotos.map((f) => (
                <FotoPlaceholder key={f.id} foto={f} className="rounded-sm" />
              ))}
            </div>
          </section>
        )}

        {proyecto.seriales.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Equipos instalados</h2>
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-300 text-left text-[10px] tracking-wider text-slate-500 uppercase">
                  <th className="py-1.5 font-semibold">Equipo</th>
                  <th className="py-1.5 font-semibold">Referencia</th>
                  <th className="py-1.5 font-semibold">Serial</th>
                </tr>
              </thead>
              <tbody>
                {proyecto.seriales.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-1.5">{s.equipo}</td>
                    <td className="py-1.5">{s.referencia}</td>
                    <td className="py-1.5 font-mono">{s.serial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Certificación</h2>
            <p className="mt-1">{e.certificacion ? `Se adjunta: ${e.certificacion.nombre}` : 'Pendiente por adjuntar.'}</p>
          </div>
          <div>
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Garantía</h2>
            <p className="mt-1">{e.garantia || 'Según condiciones de la cotización.'}</p>
          </div>
        </section>
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}

/** Acta de entrega y recibo a satisfacción: documento aparte, se imprime para que el cliente la firme. */
export function ActaEntregaPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const e = proyecto.entrega
  const fechaEntrega = fecha(e.fechaEntrega ?? HOY)

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/entrega`} volverTexto="Volver a entrega" />
      <HojaCarta>
        <Encabezado titulo="Acta de conformidad" proyecto={proyecto} />
        <h1 className="mt-8 text-center text-base font-semibold tracking-wide text-slate-900 uppercase">Acta de entrega y recibo a satisfacción</h1>
        <p className="mt-6 text-justify">
          En {cliente.ciudad}, a la fecha {fechaEntrega}, {cliente.nombre}, identificada con NIT {cliente.nit}, recibe a satisfacción por parte de Infrasoft Services S.A.S. los trabajos
          correspondientes al proyecto <strong>“{proyecto.nombre}”</strong>
          {proyecto.ocCliente && (
            <>
              , ejecutados según la orden de compra <strong>{proyecto.ocCliente.numero}</strong>
            </>
          )}
          .
        </p>
        <p className="mt-4 text-justify whitespace-pre-line">{e.trabajosRealizados || proyecto.cotizacion.alcance}</p>
        <p className="mt-4 text-justify">
          El cliente declara que los trabajos fueron revisados y se encuentran en funcionamiento.{e.garantia.trim() && <> {fraseGarantia(e.garantia)}</>}
        </p>
        <div className="mt-6">
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Observaciones</div>
          <div className="mt-2 space-y-6">
            <div className="border-b border-slate-300" />
            <div className="border-b border-slate-300" />
          </div>
        </div>
        <section className="mt-20 grid grid-cols-2 gap-10">
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Entrega</div>
            <div className="text-slate-500">Infrasoft Services S.A.S.</div>
            <div className="mt-3 text-slate-500">Nombre: ______________________</div>
            <div className="mt-1 text-slate-500">C.C.: _________________________</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Recibe</div>
            <div className="text-slate-500">{cliente.nombre}</div>
            <div className="mt-3 text-slate-500">Nombre: ______________________</div>
            <div className="mt-1 text-slate-500">C.C.: _________________________</div>
          </div>
        </section>
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}
