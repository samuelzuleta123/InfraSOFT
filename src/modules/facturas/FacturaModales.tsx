import { useState } from 'react'
import { Button, Field, Input, Modal, NumberInput, Select } from '@/components/ui'
import { AdjuntoChip, SubirArchivo } from '@/components/dominio'
import { totalOC } from '@/lib/calc'
import { HOY, money, sumarDias, uid } from '@/lib/format'
import { nombreProveedor, useStore } from '@/store/useStore'
import type { FacturaProveedor, FormaPago } from '@/types'
import { ComparacionOC } from './ComparacionOC'

export function AsociarModal({ facturaId, onClose, onDone }: { facturaId: string; onClose: () => void; onDone: () => void }) {
  const f = useStore((s) => s.facturas.find((x) => x.id === facturaId))
  const proyectos = useStore((s) => s.proyectos)
  const ordenes = useStore((s) => s.ordenes)
  const proveedores = useStore((s) => s.proveedores)
  const mutar = useStore((s) => s.mutar)
  const notificar = useStore((s) => s.notificar)
  const [proyectoId, setProyectoId] = useState(f?.proyectoId ?? '')
  const ocsProyecto = ordenes.filter((o) => o.proyectoId === proyectoId)
  const sugerida = ocsProyecto.find((o) => o.proveedorId === f?.proveedorId)
  const [ocId, setOcId] = useState(f?.ocId ?? sugerida?.id ?? '')
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
    notificar(`Factura ${f.numero} asociada${oc ? ` a la OC ${oc.consecutivo}` : ''}`)
    onDone()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Asociar factura ${f.numero}`}
      description={`${nombreProveedor(proveedores, f.proveedorId)} · subtotal ${money(f.subtotal)}`}
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
        <Field label="Proyecto" htmlFor="as-proy">
          <Select
            id="as-proy"
            value={proyectoId}
            onChange={(e) => {
              setProyectoId(e.target.value)
              setOcId(ordenes.find((o) => o.proyectoId === e.target.value && o.proveedorId === f.proveedorId)?.id ?? '')
            }}
          >
            <option value="">Selecciona un proyecto…</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orden de compra" htmlFor="as-oc" hint={proyectoId && ocsProyecto.length === 0 ? 'Este proyecto aún no tiene órdenes de compra.' : 'Se sugiere la OC del mismo proveedor.'}>
          <Select id="as-oc" value={ocId} onChange={(e) => setOcId(e.target.value)} disabled={!proyectoId}>
            <option value="">Sin OC</option>
            {ocsProyecto.map((o) => (
              <option key={o.id} value={o.id}>
                OC {o.consecutivo} · {nombreProveedor(proveedores, o.proveedorId)} · {money(totalOC(o))}
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
/** Tarifas de IVA en Colombia: general, reducida y exento/excluido. */
const TARIFAS_IVA = [19, 5, 0] as const
const calcularIva = (subtotal: number, tarifa: number) => Math.round((subtotal * tarifa) / 100)

export function RegistrarFacturaModal({ onClose, onCreada }: { onClose: () => void; onCreada: (asociada: boolean) => void }) {
  const proveedores = useStore((s) => s.proveedores)
  const proyectos = useStore((s) => s.proyectos)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  const mutar = useStore((s) => s.mutar)
  const notificar = useStore((s) => s.notificar)
  // OC del proveedor que aún no tienen factura: elegir una deja la factura asociada a su proyecto sin pasar por "Sin asignar".
  const ocsPendientes = (proveedorId: string) => ordenes.filter((o) => o.proveedorId === proveedorId && !facturas.some((x) => x.ocId === o.id))
  // Si el proveedor tiene una sola OC pendiente, se propone de entrada.
  const conOC = (proveedorId: string) => {
    const ocs = ocsPendientes(proveedorId)
    const unica = ocs.length === 1 ? ocs[0] : null
    return { ocId: unica?.id ?? null, proyectoId: unica?.proyectoId ?? null }
  }
  const [f, setF] = useState<FacturaProveedor>(() => ({
    id: uid('fp'),
    proveedorId: proveedores[0].id,
    numero: '',
    fecha: HOY,
    vencimiento: sumarDias(HOY, 30),
    formaPago: 'Crédito 30 días',
    subtotal: 0,
    iva: 0,
    lineas: [],
    adjuntos: [],
    ...conOC(proveedores[0].id),
  }))
  const set = (cambios: Partial<FacturaProveedor>) => setF((x) => ({ ...x, ...cambios }))
  // El IVA se calcula solo con la tarifa; si la factura trae otro valor (líneas con tarifas mixtas), se ajusta a mano.
  const [tarifa, setTarifa] = useState<number>(19)

  const pendientes = ocsPendientes(f.proveedorId)
  const ocElegida = ordenes.find((o) => o.id === f.ocId)

  const guardar = () => {
    mutar((s) => {
      s.facturas.unshift(f)
    })
    const proyecto = proyectos.find((p) => p.id === f.proyectoId)
    notificar(ocElegida && proyecto ? `Factura ${f.numero} asociada a la OC ${ocElegida.consecutivo} (${proyecto.codigo})` : `Factura ${f.numero} registrada en “Sin asignar”`)
    onCreada(!!f.proyectoId)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Registrar factura de proveedor"
      description="Los archivos PDF y XML se guardan solo como adjuntos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!f.numero.trim() || f.subtotal <= 0}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proveedor" htmlFor="rf-prov">
          <Select id="rf-prov" value={f.proveedorId} onChange={(e) => set({ proveedorId: e.target.value, ...conOC(e.target.value) })}>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Orden de compra"
          htmlFor="rf-oc"
          hint={pendientes.length === 0 ? 'Este proveedor no tiene OC pendientes de factura: quedará en “Sin asignar”.' : 'Al elegirla, la factura queda asociada a su proyecto.'}
        >
          <Select
            id="rf-oc"
            value={f.ocId ?? ''}
            disabled={pendientes.length === 0}
            onChange={(e) => {
              const oc = ordenes.find((o) => o.id === e.target.value)
              set({ ocId: oc?.id ?? null, proyectoId: oc?.proyectoId ?? null })
            }}
          >
            <option value="">Sin OC · asociar después</option>
            {pendientes.map((o) => (
              <option key={o.id} value={o.id}>
                OC {o.consecutivo} · {proyectos.find((p) => p.id === o.proyectoId)?.codigo} · {money(totalOC(o))}
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
        <Field label="Subtotal" htmlFor="rf-sub">
          <NumberInput id="rf-sub" value={f.subtotal || null} allowEmpty prefix="$" onChange={(n) => set({ subtotal: n ?? 0, iva: calcularIva(n ?? 0, tarifa) })} />
        </Field>
        <Field label="Tarifa de IVA" htmlFor="rf-tarifa">
          <Select
            id="rf-tarifa"
            value={tarifa}
            onChange={(e) => {
              const t = Number(e.target.value)
              setTarifa(t)
              set({ iva: calcularIva(f.subtotal, t) })
            }}
          >
            {TARIFAS_IVA.map((t) => (
              <option key={t} value={t}>
                {t === 0 ? '0 % (exento o excluido)' : `${t} %`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="IVA" htmlFor="rf-iva" hint={`Se calcula con el ${tarifa} % del subtotal. Ajústalo si la factura trae otro valor.`}>
          <NumberInput id="rf-iva" value={f.iva || null} allowEmpty prefix="$" placeholder="0" onChange={(n) => set({ iva: n ?? 0 })} />
        </Field>
      </div>
      <div className="mt-4 flex items-baseline justify-between rounded-md bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-600">Total</span>
        <span className="num text-lg font-semibold text-slate-900">{money(f.subtotal + f.iva)}</span>
      </div>
      {ocElegida && f.subtotal > 0 && (
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
