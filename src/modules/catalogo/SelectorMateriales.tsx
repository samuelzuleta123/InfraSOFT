import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { precioNeto } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { moneyUnit } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { CategoriaMaterial } from '@/types'

const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/**
 * Elegir materiales del catálogo en su propia ventana, de alto fijo: buscador arriba y la lista completa agrupada por
 * categoría debajo. Se marcan varios y se agregan de una vez. Los que ya están se muestran pero no se pueden repetir.
 */
export function SelectorMaterialesModal({
  onClose,
  onAgregar,
  yaAgregados = [],
  etiquetaYa = 'Ya está en el kit',
  permitirRepetir = false,
  onCrearLibre,
}: {
  onClose: () => void
  onAgregar: (materialIds: string[]) => void
  yaAgregados?: string[]
  etiquetaYa?: string
  /** En la cotización un material puede ir dos veces (otra cantidad u otro proveedor): se avisa pero se deja marcar. */
  permitirRepetir?: boolean
  /** Si se da, la búsqueda sin resultados (o con ellos) ofrece crear un material sin catálogo con ese nombre. */
  onCrearLibre?: (descripcion: string) => void
}) {
  const materiales = useStore((s) => s.materiales)
  const precios = useStore((s) => s.precios)
  const [q, setQ] = useState('')
  const [elegidos, setElegidos] = useState<string[]>([])

  const grupos = useMemo(() => {
    const t = normal(q)
    const visibles = materiales.filter((m) => !t || normal(`${m.descripcion} ${m.codigo} ${m.categoria}`).includes(t))
    const categorias = [...new Set(visibles.map((m) => m.categoria))] as CategoriaMaterial[]
    return categorias.map((c) => ({ categoria: c, materiales: visibles.filter((m) => m.categoria === c) }))
  }, [q, materiales])
  const total = grupos.reduce((a, g) => a + g.materiales.length, 0)

  const alternar = (id: string) => setElegidos((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))
  const agregar = () => {
    onAgregar(elegidos)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Agregar materiales del catálogo"
      description="Marca uno o varios y agrégalos juntos."
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-slate-500">
            {elegidos.length ? `${elegidos.length} seleccionado${elegidos.length === 1 ? '' : 's'}` : 'Ninguno seleccionado'}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={agregar} disabled={!elegidos.length}>
            {elegidos.length > 1 ? `Agregar ${elegidos.length} materiales` : 'Agregar material'}
          </Button>
        </>
      }
    >
      {/* Alto fijo: la ventana no cambia de tamaño al filtrar, solo la lista se desplaza. */}
      <div className="flex h-[min(60dvh,520px)] flex-col gap-3">
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por descripción, código o categoría…"
            aria-label="Buscar material"
            className="h-10 w-full rounded-md border border-slate-300 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 focus:outline-none"
          />
        </div>
        <p className="shrink-0 text-xs text-slate-500">
          {q ? `${total} de ${materiales.length} materiales coinciden` : `${materiales.length} materiales en el catálogo`}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-slate-200">
          {grupos.map((g) => (
            <section key={g.categoria} aria-label={g.categoria}>
              <h3 className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {g.categoria} <span className="font-normal normal-case">· {g.materiales.length}</span>
              </h3>
              <ul className="divide-y divide-slate-100">
                {g.materiales.map((m) => {
                  const ya = yaAgregados.includes(m.id)
                  const bloqueado = ya && !permitirRepetir
                  const marcado = elegidos.includes(m.id)
                  const pm = precios.filter((p) => p.materialId === m.id)
                  const desde = pm.length ? Math.min(...pm.map(precioNeto)) : null
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={marcado}
                        disabled={bloqueado}
                        onClick={() => alternar(m.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors disabled:cursor-default',
                          marcado ? 'bg-brand-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded border',
                            marcado ? 'border-brand-800 bg-brand-800 text-white' : bloqueado ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-white',
                          )}
                          aria-hidden
                        >
                          {(marcado || bloqueado) && <Check className={cn('size-3', bloqueado && 'text-slate-400')} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-[13px]', bloqueado ? 'text-slate-400' : 'text-slate-900')}>{m.descripcion}</span>
                          <span className="block text-xs text-slate-500">
                            <span className="font-mono">{m.codigo}</span> · {m.unidad}
                          </span>
                        </span>
                        <span className="num shrink-0 text-right text-xs text-slate-500">
                          {ya && <span className={cn('block', permitirRepetir && 'font-medium text-amber-800')}>{etiquetaYa}</span>}
                          {!bloqueado && (desde !== null ? `desde ${moneyUnit(desde)}` : 'Sin precio')}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {total === 0 && <p className="px-3 pt-10 pb-3 text-center text-sm text-slate-500">Ningún material coincide con “{q}”.</p>}
          {onCrearLibre && q.trim() && (
            <div className={cn('px-3 py-3', total > 0 && 'border-t border-slate-200')}>
              <button
                type="button"
                onClick={() => {
                  onCrearLibre(q.trim())
                  onClose()
                }}
                className="w-full cursor-pointer rounded-md border border-dashed border-slate-300 px-3 py-2 text-left text-[13px] text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                <span className="font-medium">Crear “{q.trim()}”</span>
                <span className="text-slate-500"> · material sin catálogo; el precio y el proveedor se digitan en la tabla</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
