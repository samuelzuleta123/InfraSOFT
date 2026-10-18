import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ClipboardCopy, Pencil, Printer } from 'lucide-react'
import { Alert, Button, Card, CardHeader, DL, Field, Input, NumberInput, Select, Textarea } from '@/components/ui'
import { FechaTexto } from '@/components/dominio'
import { liquidacion, resumen, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { textoObservaciones } from '@/lib/observaciones'
import { HOY, money, moneySigned, num, pct, sumarDias, moneyUnit } from '@/lib/format'
import { useStore } from '@/store/useStore'
import { ResultadoProyecto } from './ResultadoProyecto'
import type { FacturaCliente, FormaPago, Proyecto } from '@/types'

const FORMAS: FormaPago[] = ['Contado', 'Crédito 30 días', 'Crédito 45 días', 'Crédito 60 días']
const diasDe = (fp: FormaPago) => Number(fp.match(/\d+/)?.[0] ?? 0)
/** La forma de pago que dicen las condiciones de la cotización ("Forma de pago: crédito 30 días"), si coincide con una conocida. */
const formaDeCondiciones = (texto: string): FormaPago | undefined =>
  /contado/i.test(texto) ? 'Contado' : FORMAS.find((x) => x !== 'Contado' && new RegExp(`cr[eé]dito[^.\\n]*?${diasDe(x)}\\s*d[ií]as`, 'i').test(texto))
const numeroFactura = (n: string) => Number(n.replace(/\D/g, '')) || 0

export function CierreTab({ proyecto }: { proyecto: Proyecto }) {
  return (
    <div className="space-y-5">
      {proyecto.facturaCliente && <ResultadoProyecto proyecto={proyecto} />}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <FacturaClienteCard proyecto={proyecto} />
        <ObservacionesCard proyecto={proyecto} />
      </div>
      <Liquidacion proyecto={proyecto} />
    </div>
  )
}

function FacturaClienteCard({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const notificar = useStore((s) => s.notificar)
  const proyectos = useStore((s) => s.proyectos)
  const fc = proyecto.facturaCliente
  const precio = Math.round(resumen(versionVigente(proyecto)).precioVigente)
  // Todo arranca con datos que ya existen; nada se vuelve a digitar salvo que cambie.
  const otras = proyectos.filter((p) => p.id !== proyecto.id && p.facturaCliente).map((p) => ({ codigo: p.codigo, f: p.facturaCliente! }))
  const ultima = otras.reduce<(typeof otras)[number] | undefined>((a, b) => (!a || numeroFactura(b.f.numero) > numeroFactura(a.f.numero) ? b : a), undefined)
  const prefijo = ultima?.f.numero.match(/^\D*/)?.[0] ?? 'FE '
  const formaInicial = formaDeCondiciones(proyecto.cotizacion.condiciones) ?? 'Crédito 30 días'
  const [editando, setEditando] = useState(!fc)
  const [f, setF] = useState<FacturaCliente>(
    fc ?? {
      numero: ultima ? `${prefijo}${numeroFactura(ultima.f.numero) + 1}` : '',
      fecha: HOY,
      vencimiento: sumarDias(HOY, diasDe(formaInicial)),
      // Lo que el cliente se comprometió a pagar en su OC; sin OC, lo cotizado.
      valorBruto: proyecto.ocCliente?.valor ?? precio,
      ivaPct: ultima?.f.ivaPct ?? null,
      formaPago: formaInicial,
    },
  )
  const repetida = f.numero.trim() ? otras.find((o) => numeroFactura(o.f.numero) === numeroFactura(f.numero) && numeroFactura(f.numero) > 0) : undefined
  const actual = editando ? f : fc!
  const iva = actual.valorBruto * ((actual.ivaPct ?? 0) / 100)

  const guardar = () => {
    editarProyecto(proyecto.id, (p) => {
      p.facturaCliente = f
      p.etapa = 5
    })
    setEditando(false)
    notificar(`Factura ${f.numero} registrada. Proyecto cerrado.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Card>
      <CardHeader
        title="Factura al cliente"
        description="Emitida en el POS de la empresa. Aquí solo se registra."
        actions={
          fc && !editando ? (
            <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => (setF(fc), setEditando(true))}>
              Editar
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-4 p-5">
        {editando ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Número" htmlFor="fc-num" error={repetida && `Ya se usó en ${repetida.codigo}`} hint={ultima ? `Sigue a la ${ultima.f.numero}; cámbialo si el POS va en otro número.` : undefined}>
              <Input id="fc-num" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} placeholder="Ej. FE 500" />
            </Field>
            <Field label="Forma de pago" htmlFor="fc-fp">
              <Select id="fc-fp" value={f.formaPago} onChange={(e) => setF({ ...f, formaPago: e.target.value as FormaPago, vencimiento: sumarDias(f.fecha, diasDe(e.target.value as FormaPago)) })}>
                {FORMAS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" htmlFor="fc-fecha">
              <Input id="fc-fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value, vencimiento: e.target.value ? sumarDias(e.target.value, diasDe(f.formaPago)) : f.vencimiento })} />
            </Field>
            <Field label="Vencimiento" htmlFor="fc-venc" hint="Se calcula con la fecha y la forma de pago.">
              <Input id="fc-venc" type="date" value={f.vencimiento} onChange={(e) => setF({ ...f, vencimiento: e.target.value })} />
            </Field>
            <Field label="Valor bruto" htmlFor="fc-bruto" hint={proyecto.ocCliente ? `De la OC del cliente ${proyecto.ocCliente.numero}.` : 'Lo cotizado (no hay OC del cliente registrada).'}>
              <NumberInput id="fc-bruto" value={f.valorBruto || null} allowEmpty decimals={0} prefix="$" onChange={(n) => setF({ ...f, valorBruto: n ?? 0 })} />
            </Field>
            <Field label="% IVA" htmlFor="fc-iva" hint={ultima?.f.ivaPct != null ? `El de la última factura (${ultima.f.numero}); cámbialo si aplica otro. Vacío = 0 %.` : 'Lo digita el usuario. Vacío = 0 %.'}>
              <NumberInput id="fc-iva" value={f.ivaPct} allowEmpty suffix="%" placeholder="0" onChange={(n) => setF({ ...f, ivaPct: n })} />
            </Field>
          </div>
        ) : (
          <DL
            items={[
              ['Número', <span className="font-semibold">{fc!.numero}</span>],
              ['Fecha', <FechaTexto iso={fc!.fecha} />],
              ['Vencimiento', <FechaTexto iso={fc!.vencimiento} />],
              ['Forma de pago', fc!.formaPago],
            ]}
          />
        )}
        <dl className="rounded-md bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between py-0.5">
            <dt className="text-slate-600">Valor bruto</dt>
            <dd className="num">{money(actual.valorBruto)}</dd>
          </div>
          <div className="flex justify-between py-0.5">
            <dt className="text-slate-600">IVA ({pct(actual.ivaPct ?? 0, 0)})</dt>
            <dd className="num">{money(iva)}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-900">
            <dt>Total</dt>
            <dd className="num">{money(actual.valorBruto + iva)}</dd>
          </div>
        </dl>
        {actual.valorBruto > 0 && Math.round(actual.valorBruto) !== precio && (
          <Alert tone="warn" title="El valor bruto no coincide con el precio cotizado">
            Cotizado {money(precio)} · diferencia {moneySigned(actual.valorBruto - precio)}.
          </Alert>
        )}
        {editando && !proyecto.entrega.actaFirmada && (
          <Alert
            tone="warn"
            title="Falta el acta de conformidad firmada"
            action={
              <Link to={`/proyectos/${proyecto.id}/entrega`} className="shrink-0 self-center text-[13px] font-medium text-amber-900 underline">
                Ir a Entrega
              </Link>
            }
          >
            Para cerrar el proyecto carga primero la copia firmada del acta.
          </Alert>
        )}
        {editando && (
          <div className="flex justify-end gap-2">
            {fc && (
              <Button variant="ghost" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            )}
            <Button variant="primary" onClick={guardar} disabled={!f.numero.trim() || !f.valorBruto || !proyecto.entrega.actaFirmada}>
              Registrar factura y cerrar
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function ObservacionesCard({ proyecto }: { proyecto: Proyecto }) {
  const notificar = useStore((s) => s.notificar)
  const [copiado, setCopiado] = useState(false)
  const texto = textoObservaciones(proyecto)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      // Sin permiso de portapapeles: el texto queda seleccionable en pantalla.
    }
    setCopiado(true)
    notificar('Texto copiado. Pégalo en las observaciones de la factura en el POS.')
    setTimeout(() => setCopiado(false), 2500)
  }
  return (
    <Card>
      <CardHeader title="Observaciones para el POS" description="OC del cliente, seriales, garantía y remisión, listos para pegar en la factura." />
      <div className="space-y-3 p-5">
        <Textarea readOnly value={texto || 'Completa la OC del cliente, los seriales, la garantía y la remisión para generar el texto.'} rows={7} className="bg-slate-50 text-[13px]" onFocus={(e) => e.currentTarget.select()} aria-label="Texto de observaciones" />
        <Button variant="primary" icon={copiado ? <Check /> : <ClipboardCopy />} onClick={copiar} disabled={!texto}>
          {copiado ? 'Copiado' : 'Copiar texto de observaciones'}
        </Button>
      </div>
    </Card>
  )
}

function Liquidacion({ proyecto }: { proyecto: Proyecto }) {
  const l = liquidacion(versionVigente(proyecto))
  const difUtilidad = l.utilidadRealObra - l.utilidadEstimada
  return (
    <Card>
      <CardHeader
        title="Liquidación del proyecto"
        description="Cantidades cotizadas frente a instaladas. Si un ítem no tiene registro de obra, se toma la cantidad cotizada."
        actions={
          <Link
            to={`/proyectos/${proyecto.id}/cierre/liquidacion`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="size-4" aria-hidden />
            Imprimir
          </Link>
        }
      />
      <div className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-5">
          <div className="text-[13px] text-slate-500">Mano de obra real a pagar</div>
          <div className="num mt-1 text-xl font-semibold text-slate-900">{money(l.moReal)}</div>
          <div className="num mt-0.5 text-xs text-slate-500">
            Cotizada {money(l.moCotizada)} · <span className={cn(l.moReal > l.moCotizada ? 'text-red-700' : 'text-emerald-700')}>{moneySigned(l.moReal - l.moCotizada)}</span>
          </div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[13px] text-slate-500">Costo real total</div>
          <div className="num mt-1 text-xl font-semibold text-slate-900">{money(l.costoReal)}</div>
          <div className="num mt-0.5 text-xs text-slate-500">Material {money(l.materialReal)} + otros costos</div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[13px] text-slate-500">Utilidad cotizada</div>
          <div className="num mt-1 text-xl font-semibold text-slate-900">{money(l.utilidadEstimada)}</div>
          <div className="num mt-0.5 text-xs text-slate-500">{pct(l.margenEstimado)} del precio, con lo cotizado</div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[13px] text-slate-500">Utilidad real</div>
          <div className={cn('num mt-1 text-xl font-semibold', l.utilidadRealObra < l.utilidadEstimada ? 'text-amber-700' : 'text-emerald-700')}>{money(l.utilidadRealObra)}</div>
          <div className="num mt-0.5 text-xs text-slate-500">
            {pct(l.margenRealObra)} del precio · <span className={cn(difUtilidad < 0 ? 'text-red-700' : 'text-emerald-700')}>{moneySigned(difUtilidad)}</span> frente a lo cotizado
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left">Ítem</th>
              <th className="px-3 py-2.5 text-right">Cant. cotizada</th>
              <th className="px-3 py-2.5 text-right">Cant. instalada</th>
              <th className="px-3 py-2.5 text-right">Diferencia</th>
              <th className="px-3 py-2.5 text-right">V. unit. MO</th>
              <th className="px-4 py-2.5 text-right">MO real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {l.filas.map((f) => (
              <tr key={f.item.id} className={cn(f.diferencia !== 0 && 'bg-amber-50/40')}>
                <td className="px-4 py-2 text-slate-900">
                  {f.item.descripcion} <span className="text-slate-500">({f.item.unidad})</span>
                </td>
                <td className="num px-3 py-2 text-right">{num(f.cotizada, 2)}</td>
                <td className="num px-3 py-2 text-right">
                  {num(f.instalada, 2)}
                  {f.item.cantInstalada === null && <span className="ml-1 text-xs text-slate-500">(cot.)</span>}
                </td>
                <td className={cn('num px-3 py-2 text-right font-medium', f.diferencia > 0 ? 'text-red-700' : f.diferencia < 0 ? 'text-emerald-700' : 'text-slate-500')}>
                  {f.diferencia === 0 ? '—' : `${f.diferencia > 0 ? '+' : ''}${num(f.diferencia, 2)}`}
                </td>
                <td className="num px-3 py-2 text-right text-slate-600">{moneyUnit(f.item.vuMO)}</td>
                <td className="num px-4 py-2 text-right font-medium text-slate-900">{money(f.moReal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50/70 font-semibold">
            <tr>
              <td colSpan={5} className="px-4 py-2.5 text-right text-slate-600">
                Mano de obra real a pagar
              </td>
              <td className="num px-4 py-2.5 text-right text-slate-900">{money(l.moReal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
