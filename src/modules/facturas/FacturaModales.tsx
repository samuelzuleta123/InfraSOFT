import { useState } from 'react'
import { Button, Field, Input, Modal, NumberInput, Select } from '@/components/ui'
import { AdjuntoChip, SubirArchivo } from '@/components/dominio'
import { normal } from '@/lib/buscar'
import { totalFactura, totalOC } from '@/lib/calc'
import { HOY, money, sumarDias, uid } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { FacturaProveedor, FormaPago, Proyecto } from '@/types'
import { ComparacionOC } from './ComparacionOC'

export function AsociarModal({ facturaId, onClose, onDone }: { facturaId: string; onClose: () => void; onDone: () => void }) {
  const f = useStore((s) => s.facturas.find((x) => x.id === facturaId))
  const proyectos = useStore((s) => s.proyectos)
  const ordenes = useStore((s) => s.ordenes)
  const proveedores = useStore((s) => s.proveedores)
  const mutar = useStore((s) => s.mutar)
  const notificar = useStore((s) => s.notificar)
  const [proyectoId, setProyectoId] = useState(f?.proyectoId ?? '')
  // Solo se cargan facturas a proyectos aprobados; se conserva el actual para no perderlo al editar.
  const opciones = proyectos.filter((p) => cotizacionAprobada(p) || p.id === f?.proyectoId)
  const facturas = useStore((s) => s.facturas)
  const ocsProyecto = ordenes.filter((o) => o.proyectoId === proyectoId)
  const facturada = (ocId: string) => facturas.some((x) => x.id !== facturaId && x.ocId === ocId)
  // Igual que al vincular: se propone la OC del proveedor solo si es la única.
  const unicaDelProveedor = (pid: string) => {
    const ocs = ordenes.filter((o) => o.proyectoId === pid && o.proveedorId === f?.proveedorId)
    return ocs.length === 1 ? ocs[0].id : ''
  }
  const sugerida = unicaDelProveedor(proyectoId)
  const [ocId, setOcId] = useState(f?.ocId ?? sugerida)
  if (!f) return null
  const oc = ordenes.find((o) => o.id === ocId)

  const guardar = () => {
    mutar((s) => {
      const x = s.facturas.find((y) => y.id === facturaId)
      if (x) {
        x.proyectoId = proyectoId || null
        x.ocId = ocId || null
      }
    })
    notificar(`Factura ${f.numero} ${f.proyectoId ? 'actualizada' : 'asociada'}${oc ? ` · OC ${oc.consecutivo}` : ''}`)
    onDone()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${f.proyectoId ? 'Editar asociación de la factura' : 'Asociar factura'} ${f.numero}`}
      description={`${nombreProveedor(proveedores, f.proveedorId, 'Sin proveedor')} · total ${money(totalFactura(f))}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!proyectoId}>
            Guardar asociación
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proyecto" htmlFor="as-proy" hint="Solo aparecen proyectos con la cotización aprobada.">
          <Select
            id="as-proy"
            value={proyectoId}
            onChange={(e) => {
              setProyectoId(e.target.value)
              setOcId(unicaDelProveedor(e.target.value))
            }}
          >
            <option value="">Selecciona un proyecto…</option>
            {opciones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orden de compra" htmlFor="as-oc" hint={proyectoId && ocsProyecto.length === 0 ? 'Este proyecto aún no tiene órdenes de compra.' : 'Se toma la OC del proveedor si es la única.'}>
          <Select id="as-oc" value={ocId} onChange={(e) => setOcId(e.target.value)} disabled={!proyectoId}>
            <option value="">Sin OC</option>
            {ocsProyecto.map((o) => (
              <option key={o.id} value={o.id}>
                OC {o.consecutivo} · {nombreProveedor(proveedores, o.proveedorId)} · {money(totalOC(o))}
                {facturada(o.id) ? ' · ya facturada' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {oc && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Vista previa de la comparación</h3>
          <ComparacionOC factura={f} oc={oc} />
        </div>
      )}
    </Modal>
  )
}

const FORMAS: FormaPago[] = ['Contado', 'Crédito 30 días', 'Crédito 45 días', 'Crédito 60 días']
const diasForma = (fp: FormaPago) => (fp === 'Contado' ? 0 : parseInt(fp.replace(/\D/g, ''), 10))
const cotizacionAprobada = (p: Proyecto) => p.cotizacion.versiones.some((v) => v.estado === 'aprobada')
const etiquetaProyecto = (p: Proyecto) => `${p.codigo} · ${p.nombre}`
/** Proyecto cuyo código, nombre o etiqueta coincide con lo escrito, solo si es uno. */
const proyectoEscrito = (proyectos: Proyecto[], texto: string) => {
  const t = normal(texto)
  if (!t) return null
  const coinciden = proyectos.filter((p) => [etiquetaProyecto(p), p.codigo, p.nombre].some((x) => normal(x) === t))
  return coinciden.length === 1 ? coinciden[0] : null
}

export function VincularFacturaModal({ onClose, onVinculada }: { onClose: () => void; onVinculada: () => void }) {
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const mutar = useStore((s) => s.mutar)
  const notificar = useStore((s) => s.notificar)
  // Las OC ya facturadas también se listan (facturas parciales).
  const facturada = (ocId: string) => facturas.some((x) => x.ocId === ocId)
  const ocsDe = (proveedorId: string | null, proyectoId: string | null) => ordenes.filter((o) => o.proyectoId === proyectoId && o.proveedorId === proveedorId)
  // Si el proveedor tiene una sola OC en el proyecto, se toma de entrada; con dos o más se deja elegir.
  const ocUnica = (proveedorId: string | null, proyectoId: string | null) => {
    const ocs = ocsDe(proveedorId, proyectoId)
    return ocs.length === 1 ? ocs[0].id : null
  }
  const [f, setF] = useState<FacturaProveedor>(() => ({
    id: uid('fp'),
    proveedorId: proveedores[0].id,
    proyectoId: null,
    ocId: null,
    numero: '',
    fecha: HOY,
    vencimiento: sumarDias(HOY, 30),
    formaPago: 'Crédito 30 días',
    subtotal: 0,
    iva: 0,
    lineas: [],
    adjuntos: [],
  }))
  const set = (cambios: Partial<FacturaProveedor>) => setF((x) => ({ ...x, ...cambios }))
  const [busquedaProyecto, setBusquedaProyecto] = useState('')
  // Los precios de la OC ya incluyen el IVA: se guarda el total tal cual, sin discriminar IVA, para compararlo con la OC.
  const total = f.subtotal

  const ocs = ocsDe(f.proveedorId, f.proyectoId)
  const pendientes = ocs.filter((o) => !facturada(o.id))
  const ocElegida = ordenes.find((o) => o.id === f.ocId)
  const proyecto = proyectos.find((p) => p.id === f.proyectoId)
  const aprobados = proyectos.filter(cotizacionAprobada)
  const escrito = proyectoEscrito(proyectos, busquedaProyecto)
  const hintProyecto =
    escrito && !cotizacionAprobada(escrito)
      ? 'La cotización de este proyecto aún no está aprobada; registra la aprobación en Compras antes de cargar facturas.'
      : busquedaProyecto && !proyecto
        ? 'Escribe el código o el nombre completo, o elígelo de la lista.'
        : undefined
  const hintOC = !proyecto
    ? 'Elige primero el proyecto.'
    : !f.proveedorId
      ? 'Sin proveedor no se asocia una OC.'
      : ocs.length === 0
        ? 'Este proyecto no tiene OC de este proveedor.'
        : ocElegida && facturada(ocElegida.id)
          ? 'Esta OC ya tiene factura; déjala si es una factura parcial o cambia a «Sin OC».'
          : f.ocId
            ? 'Permite comparar la factura contra la OC.'
            : pendientes.length > 0
              ? `Hay ${pendientes.length === 1 ? '1 OC pendiente' : `${pendientes.length} OC pendientes`} de este proveedor; asóciala para comparar la factura.`
              : ocs.length === 1
                ? `La OC ${ocs[0].consecutivo} de este proveedor ya tiene factura; elígela si es una factura parcial.`
                : 'Las OC de este proveedor ya tienen factura; elige una si es una factura parcial.'

  const guardar = () => {
    if (!proyecto) return
    mutar((s) => {
      s.facturas.unshift(f)
    })
    notificar(`Factura ${f.numero} vinculada al proyecto ${proyecto.codigo}${ocElegida ? ` · OC ${ocElegida.consecutivo}` : ''}`)
    onVinculada()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Vincular factura de proveedor"
      description="Vincula la factura que envió el proveedor al proyecto correspondiente. Los archivos PDF y XML se guardan solo como adjuntos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!proyecto || !f.numero.trim() || total <= 0}>
            Vincular
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proyecto" htmlFor="rf-proy" hint={hintProyecto}>
          <Input
            id="rf-proy"
            list="rf-proy-lista"
            autoComplete="off"
            placeholder="Escribe el código o el nombre…"
            value={busquedaProyecto}
            onChange={(e) => {
              setBusquedaProyecto(e.target.value)
              const p = proyectoEscrito(proyectos, e.target.value)
              const proyectoId = p && cotizacionAprobada(p) ? p.id : null
              set({ proyectoId, ocId: ocUnica(f.proveedorId, proyectoId) })
            }}
          />
          <datalist id="rf-proy-lista">
            {aprobados.map((p) => (
              <option key={p.id} value={etiquetaProyecto(p)} />
            ))}
          </datalist>
        </Field>
        <Field label="Proveedor" htmlFor="rf-prov">
          <Select
            id="rf-prov"
            value={f.proveedorId ?? ''}
            onChange={(e) => {
              const proveedorId = e.target.value || null
              set({ proveedorId, ocId: ocUnica(proveedorId, f.proyectoId) })
            }}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orden de compra" htmlFor="rf-oc" optional hint={hintOC}>
          <Select id="rf-oc" value={f.ocId ?? ''} disabled={ocs.length === 0} onChange={(e) => set({ ocId: e.target.value || null })}>
            <option value="">Sin OC</option>
            {ocs.map((o) => (
              <option key={o.id} value={o.id}>
                OC {o.consecutivo} · {money(totalOC(o))}
                {facturada(o.id) ? ' · ya facturada' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Número de factura" htmlFor="rf-num">
          <Input id="rf-num" value={f.numero} onChange={(e) => set({ numero: e.target.value })} placeholder="Ej. DRG-293076" />
        </Field>
        <Field label="Fecha" htmlFor="rf-fecha">
          <Input id="rf-fecha" type="date" value={f.fecha} onChange={(e) => set({ fecha: e.target.value, vencimiento: sumarDias(e.target.value, diasForma(f.formaPago)) })} />
        </Field>
        <Field label="Forma de pago" htmlFor="rf-fp">
          <Select id="rf-fp" value={f.formaPago} onChange={(e) => set({ formaPago: e.target.value as FormaPago, vencimiento: sumarDias(f.fecha, diasForma(e.target.value as FormaPago)) })}>
            {FORMAS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vencimiento" htmlFor="rf-venc" hint="Se calcula con la forma de pago; puedes ajustarlo.">
          <Input id="rf-venc" type="date" value={f.vencimiento} onChange={(e) => set({ vencimiento: e.target.value })} />
        </Field>
        <Field label="Notas" htmlFor="rf-notas" optional>
          <Input id="rf-notas" value={f.notas ?? ''} onChange={(e) => set({ notas: e.target.value })} placeholder="Remisiones, OC de referencia…" />
        </Field>
        <Field label="Total de la factura" htmlFor="rf-total" hint="Valor total emitido por el proveedor; se compara directo con el total de la OC.">
          <NumberInput id="rf-total" value={total || null} allowEmpty prefix="$" onChange={(n) => set({ subtotal: n ?? 0 })} />
        </Field>
      </div>
      {ocElegida && total > 0 && (
        <div className="mt-4">
          <ComparacionOC factura={f} oc={ocElegida} />
        </div>
      )}
      <Field label="Adjuntos (PDF y XML)" className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {f.adjuntos.map((a, i) => (
            <AdjuntoChip key={i} adjunto={a} onRemove={() => set({ adjuntos: f.adjuntos.filter((_, j) => j !== i) })} />
          ))}
          <SubirArchivo accept=".pdf,.xml" multiple label="Adjuntar PDF / XML" onFile={(a) => setF((x) => ({ ...x, adjuntos: [...x.adjuntos, a] }))} />
        </div>
      </Field>
    </Modal>
  )
}
