import { Navigate, useParams } from 'react-router-dom'
import { BarraDocumento, HojaCarta, MembreteInfrasoft, PieInfrasoft } from '@/components/Documento'
import { versionVigente } from '@/lib/calc'
import { fecha, HOY } from '@/lib/format'
import { useCliente, useProyecto } from '@/store/useStore'

/** Remisión de entrega generada desde el proyecto: equipos con serial y materiales instalados. */
export function RemisionPage() {
  const { id } = useParams()
  const proyecto = useProyecto(id)
  const cliente = useCliente(proyecto?.clienteId)
  if (!proyecto || !cliente) return <Navigate to="/proyectos" replace />

  const e = proyecto.entrega
  const materiales = versionVigente(proyecto)
    .secciones.flatMap((s) => s.items)
    .filter((i) => i.vuMaterial > 0)
  const Th = 'py-1.5 text-left text-[10px] font-semibold tracking-wider text-slate-500 uppercase'

  return (
    <div>
      <BarraDocumento volver={`/proyectos/${proyecto.id}/entrega`} volverTexto="Volver a entrega" />
      <HojaCarta>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand-500 pb-5">
          <MembreteInfrasoft />
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Remisión de entrega</div>
            <div className="num text-lg font-semibold text-slate-900">No. {e.remision || '—'}</div>
            <div className="num text-xs text-slate-500">Pereira, {fecha(e.fechaRemision ?? e.fechaEntrega ?? HOY)}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Entregado a</div>
            <div className="mt-1 font-semibold text-slate-900">{cliente.nombre}</div>
            <div>NIT {cliente.nit}</div>
            <div>{cliente.direccion}</div>
            <div>{cliente.ciudad}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Proyecto</div>
            <div className="mt-1 font-semibold text-slate-900">{proyecto.nombre}</div>
            <div>{proyecto.sede}</div>
            {proyecto.ocCliente && <div>Orden de compra {proyecto.ocCliente.numero}</div>}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Equipos entregados</h2>
          {proyecto.seriales.length ? (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className={Th}>Equipo</th>
                  <th className={Th}>Referencia</th>
                  <th className={Th}>Serial</th>
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
          ) : (
            <p className="mt-1 text-slate-500">Sin equipos con serial registrados en la bitácora.</p>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Materiales instalados</h2>
          <table className="mt-2 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-300">
                <th className={Th}>#</th>
                <th className={Th}>Descripción</th>
                <th className={Th}>Und.</th>
                <th className={`${Th} text-right`}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((i, n) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="num py-1.5 text-slate-400">{n + 1}</td>
                  <td className="py-1.5">{i.descripcion}</td>
                  <td className="py-1.5">{i.unidad}</td>
                  <td className="num py-1.5 text-right">{(i.cantInstalada ?? i.cantidad).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {e.garantia && (
          <section className="mt-6">
            <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Garantía</h2>
            <p className="mt-1">{e.garantia}</p>
          </section>
        )}

        <section className="mt-16 grid grid-cols-2 gap-10">
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Entrega</div>
            <div className="text-slate-500">Infrasoft Services S.A.S.</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5 text-xs">
            <div className="font-semibold">Recibe</div>
            <div className="text-slate-500">{cliente.nombre} · Nombre, C.C. y fecha</div>
          </div>
        </section>
        <PieInfrasoft />
      </HojaCarta>
    </div>
  )
}
