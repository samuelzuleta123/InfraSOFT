import { useState } from 'react'
import { Camera, Cpu, Minus, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, NumberInput, Select, Textarea } from '@/components/ui'
import { AdjuntoChip, FechaTexto, FotoPlaceholder, SemaforoDot, SemaforoEtiqueta, SubirArchivo } from '@/components/dominio'
import { avanceEjecucion, costoRealItem, itemSubtotal, semaforo, versionVigente } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { HOY, money, num, pct, uid } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { Adjunto, ItemCotizacion, Proyecto } from '@/types'

export function BitacoraTab({ proyecto }: { proyecto: Proyecto }) {
  const v = versionVigente(proyecto)
  const a = avanceEjecucion(v)
  const ratio = a.presupuestoRegistrado > 0 ? (a.real / a.presupuestoRegistrado) * 100 : 0

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Resumen del semáforo total */}
      <Card>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 sm:grid-cols-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-8 shrink-0 sm:size-11 items-center justify-center rounded-full ring-4',
                a.semaforo === 'verde' && 'bg-emerald-500 ring-emerald-100',
                a.semaforo === 'amarillo' && 'bg-amber-400 ring-amber-100',
                a.semaforo === 'rojo' && 'bg-red-600 ring-red-100',
                a.semaforo === 'gris' && 'bg-slate-300 ring-slate-100',
              )}
              aria-hidden
            />
            <div>
              <div className="hidden text-xs text-slate-500 sm:block">Semáforo total</div>
              <div className="font-semibold text-slate-900">
                {a.semaforo === 'verde' ? 'En presupuesto' : a.semaforo === 'amarillo' ? 'Alerta' : a.semaforo === 'rojo' ? 'Sobrecosto' : 'Sin registros'}
              </div>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xs text-slate-500">Ítems registrados</div>
            <div className="num mt-0.5 font-semibold text-slate-900">
              {a.registrados} de {a.total}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-slate-500">Presupuesto de lo registrado</div>
            <div className="num mt-0.5 font-semibold text-slate-900">{money(a.presupuestoRegistrado)}</div>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-xs text-slate-500">Real a la fecha</div>
            <div className={cn('num mt-0.5 font-semibold', a.semaforo === 'rojo' ? 'text-red-700' : a.semaforo === 'amarillo' ? 'text-amber-700' : 'text-slate-900')}>
              {money(a.real)} <span className="block text-xs font-normal text-slate-500 sm:inline">({pct(ratio, 0)} del presupuesto)</span>
            </div>
          </div>
        </div>
        <div className="hidden flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2.5 text-xs sm:flex sm:px-5">
          <SemaforoDot estado="verde" conTexto />
          <SemaforoDot estado="amarillo" conTexto />
          <SemaforoDot estado="rojo" conTexto />
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="h-avance" className="space-y-4">
          <h2 id="h-avance" className="text-[15px] font-semibold text-slate-900">
            Cantidades instaladas
          </h2>
          {v.secciones.map((s) => (
            <div key={s.id}>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{s.nombre}</h3>
              <ul className="space-y-2">
                {s.items.map((i) => (
                  <ItemObra key={i.id} proyectoId={proyecto.id} item={i} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="space-y-5">
          <Imprevistos proyecto={proyecto} />
          <Seriales proyecto={proyecto} />
        </div>
      </div>
    </div>
  )
}

function ItemObra({ proyectoId, item }: { proyectoId: string; item: ItemCotizacion }) {
  const editarItem = useStore((s) => s.editarItem)
  const presupuesto = itemSubtotal(item)
  const real = costoRealItem(item)
  const estado = semaforo(presupuesto, real)
  const fijar = (n: number | null) => editarItem(proyectoId, item.id, (i) => void (i.cantInstalada = n === null ? null : Math.max(0, n)))
  const actual = item.cantInstalada ?? 0
  const paso = item.unidad === 'Mts' ? 1 : 1

  return (
    <li
      className={cn(
        'rounded-lg border bg-white p-3 shadow-xs sm:p-3.5',
        estado === 'rojo' ? 'border-red-200' : estado === 'amarillo' ? 'border-amber-200' : 'border-slate-200',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-snug font-medium text-slate-900">{item.descripcion}</div>
          <div className="mt-1">
            <SemaforoEtiqueta estado={estado} />
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Cotizado <span className="num font-medium text-slate-700">{num(item.cantidad, 2)}</span> {item.unidad} · Presupuesto <span className="num">{money(presupuesto)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center rounded-md border border-slate-300 bg-white">
          <button type="button" onClick={() => fijar(actual - paso)} aria-label={`Restar ${item.descripcion}`} className="flex size-11 items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 sm:size-10">
            <Minus className="size-4" />
          </button>
          <NumberInput
            value={item.cantInstalada}
            onChange={fijar}
            allowEmpty
            placeholder="—"
            aria-label={`Cantidad instalada ${item.descripcion}`}
            className="w-20"
            inputClassName="h-11 sm:h-10 rounded-none border-y-0 border-slate-300 text-center text-base font-semibold shadow-none"
          />
          <button type="button" onClick={() => fijar(actual + paso)} aria-label={`Sumar ${item.descripcion}`} className="flex size-11 items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 sm:size-10">
            <Plus className="size-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1 text-right text-xs">
          <div className="text-slate-500">Instalado ({item.unidad})</div>
          {real !== null ? (
            <div className={cn('num font-semibold', estado === 'rojo' ? 'text-red-700' : estado === 'amarillo' ? 'text-amber-700' : 'text-slate-900')}>
              {money(real)}
              {item.cantInstalada! - item.cantidad !== 0 && (
                <span className="ml-1 font-normal">
                  ({item.cantInstalada! > item.cantidad ? '+' : ''}
                  {num(item.cantInstalada! - item.cantidad, 2)})
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-500">Sin registrar</div>
          )}
        </div>
      </div>
    </li>
  )
}

function Imprevistos({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const abrirVisor = useStore((s) => s.abrirVisor)
  const notificar = useStore((s) => s.notificar)
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<Adjunto | null>(null)

  const registrar = () => {
    editarProyecto(proyecto.id, (p) => {
      p.imprevistos.unshift({ id: uid('imp'), fecha: HOY, texto: texto.trim(), foto })
    })
    setTexto('')
    setFoto(null)
    notificar('Imprevisto registrado en la bitácora')
  }

  return (
    <Card>
      <CardHeader title="Imprevistos" description="Novedades de obra con texto y foto." actions={<Badge>{proyecto.imprevistos.length}</Badge>} />
      <div className="space-y-3 p-4 sm:p-5">
        <Field label="Descripción del imprevisto" htmlFor="imp-texto">
          <Textarea id="imp-texto" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué pasó y qué se necesitó?" className="text-base sm:text-sm" />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          {foto ? <AdjuntoChip adjunto={foto} onRemove={() => setFoto(null)} /> : <SubirArchivo accept="image/*" capture label="Tomar o adjuntar foto" onFile={setFoto} />}
          <Button variant="primary" className="ml-auto h-11 sm:h-9" disabled={!texto.trim()} onClick={registrar} icon={<TriangleAlert />}>
            Registrar
          </Button>
        </div>
      </div>
      {proyecto.imprevistos.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-200">
          {proyecto.imprevistos.map((i) => (
            <li key={i.id} className="flex gap-3 px-4 py-3 sm:px-5">
              {i.foto?.url ? (
                <img src={i.foto.url} alt="" className="size-14 shrink-0 rounded-md object-cover" />
              ) : i.foto ? (
                <button
                  type="button"
                  onClick={() => abrirVisor({ adjunto: i.foto!, contexto: { tipo: 'foto', titulo: i.texto, tono: 25 } })}
                  aria-label="Ver foto del imprevisto"
                  className="shrink-0 overflow-hidden rounded-md hover:ring-2 hover:ring-brand-500/60"
                >
                  <FotoPlaceholder foto={{ titulo: '', tono: 25 }} className="size-14 aspect-auto rounded-md" />
                </button>
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500" aria-hidden>
                  <Camera className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs text-slate-500">
                  <FechaTexto iso={i.fecha} />
                </div>
                <p className="text-[13px] leading-snug text-slate-800">{i.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Seriales({ proyecto }: { proyecto: Proyecto }) {
  const editarProyecto = useStore((s) => s.editarProyecto)
  const [equipo, setEquipo] = useState('Switch')
  const [referencia, setReferencia] = useState('')
  const [serial, setSerial] = useState('')

  const agregar = () => {
    editarProyecto(proyecto.id, (p) => {
      p.seriales.push({ id: uid('ser'), equipo, referencia: referencia.trim(), serial: serial.trim().toUpperCase() })
    })
    setSerial('')
  }

  return (
    <Card>
      <CardHeader title="Seriales de equipos" description="Switches, transceivers y demás equipos activos." actions={<Badge>{proyecto.seriales.length}</Badge>} />
      {proyecto.seriales.length === 0 ? (
        <EmptyState icon={<Cpu />} title="Sin seriales registrados" className="py-6" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {proyecto.seriales.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-slate-500">
                  {s.equipo} · {s.referencia}
                </div>
                <div className="font-mono text-sm font-medium tracking-wide text-slate-900">S/N {s.serial}</div>
              </div>
              <IconButton label={`Eliminar serial ${s.serial}`} onClick={() => editarProyecto(proyecto.id, (p) => void (p.seriales = p.seriales.filter((x) => x.id !== s.id)))}>
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 sm:p-5">
        <Field label="Equipo" htmlFor="ser-eq">
          <Select id="ser-eq" value={equipo} onChange={(e) => setEquipo(e.target.value)} className="h-11 sm:h-9">
            <option>Switch</option>
            <option>Transceiver</option>
            <option>Access point</option>
            <option>Otro</option>
          </Select>
        </Field>
        <Field label="Referencia" htmlFor="ser-ref">
          <Input id="ser-ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej. Aruba R9D16A" className="h-11 text-base sm:h-9 sm:text-sm" />
        </Field>
        <Field label="Serial" htmlFor="ser-sn" className="col-span-2">
          <div className="flex gap-2">
            <Input id="ser-sn" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="S/N" className="h-11 font-mono text-base uppercase sm:h-9 sm:text-sm" />
            <Button variant="primary" className="h-11 sm:h-9" disabled={!serial.trim() || !referencia.trim()} onClick={agregar} icon={<Plus />}>
              Agregar
            </Button>
          </div>
        </Field>
      </div>
    </Card>
  )
}
