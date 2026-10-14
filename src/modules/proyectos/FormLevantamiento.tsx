import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button, Field, IconButton, Input, Textarea } from '@/components/ui'
import { SubirArchivo } from '@/components/dominio'
import type { Levantamiento } from '@/types'

export type DatosLevantamiento = Omit<Levantamiento, 'responsable'> & {
  /** Títulos de las fotos nuevas que se agregan con este formulario. */
  fotosNuevas: string[]
  /** Ids de fotos ya guardadas que se quitan al guardar. */
  fotosQuitadas: string[]
}

export const levantamientoVacio = (fecha: string): DatosLevantamiento => ({
  fecha,
  medidas: [{ etiqueta: '', valor: '' }],
  rutaTuberia: '',
  rackOrigen: '',
  rackDestino: '',
  observaciones: '',
  fotosNuevas: [],
  fotosQuitadas: [],
})

/** Campos de la visita técnica. Se usa al crear el proyecto y al editar el levantamiento. */
export function FormLevantamiento({ datos, onChange, fotosExistentes = [] }: { datos: DatosLevantamiento; onChange: Dispatch<SetStateAction<DatosLevantamiento>>; fotosExistentes?: { id: string; titulo: string }[] }) {
  // Actualización funcional: al subir varias fotos a la vez, cada una se suma a la anterior.
  const set = (cambios: Partial<DatosLevantamiento>) => onChange((d) => ({ ...d, ...cambios }))
  const { medidas } = datos
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Fecha de la visita" htmlFor="lv-fecha">
          <Input id="lv-fecha" type="date" value={datos.fecha} onChange={(e) => set({ fecha: e.target.value })} />
        </Field>
        <Field label="Rack de origen" htmlFor="lv-orig">
          <Input id="lv-orig" value={datos.rackOrigen} onChange={(e) => set({ rackOrigen: e.target.value })} />
        </Field>
        <Field label="Rack de destino" htmlFor="lv-dest">
          <Input id="lv-dest" value={datos.rackDestino} onChange={(e) => set({ rackDestino: e.target.value })} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium text-slate-700">Medidas</legend>
        <div className="space-y-2">
          {medidas.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`Medida ${i + 1}`} placeholder="Ej. Distancia entre racks" value={m.etiqueta} onChange={(e) => set({ medidas: medidas.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)) })} />
              <Input aria-label={`Valor ${i + 1}`} placeholder="Ej. 48 m" className="w-40" value={m.valor} onChange={(e) => set({ medidas: medidas.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)) })} />
              <IconButton label="Quitar medida" onClick={() => set({ medidas: medidas.filter((_, j) => j !== i) })} disabled={medidas.length === 1} className="size-9">
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon={<Plus />} className="mt-2" onClick={() => set({ medidas: [...medidas, { etiqueta: '', valor: '' }] })}>
          Agregar medida
        </Button>
      </fieldset>
      <Field label="Ruta de tubería" htmlFor="lv-ruta">
        <Textarea id="lv-ruta" rows={2} value={datos.rutaTuberia} onChange={(e) => set({ rutaTuberia: e.target.value })} />
      </Field>
      <Field label="Observaciones" htmlFor="lv-obs" optional>
        <Textarea id="lv-obs" rows={2} value={datos.observaciones} onChange={(e) => set({ observaciones: e.target.value })} />
      </Field>
      <Field label="Fotos del sitio">
        <div className="flex flex-wrap items-center gap-2">
          {fotosExistentes
            .filter((f) => !datos.fotosQuitadas.includes(f.id))
            .map((f) => (
              <FotoChip key={f.id} titulo={f.titulo} onQuitar={() => onChange((d) => ({ ...d, fotosQuitadas: [...d.fotosQuitadas, f.id] }))} />
            ))}
          {datos.fotosNuevas.map((titulo, i) => (
            <FotoChip key={`n${i}`} titulo={titulo} onQuitar={() => onChange((d) => ({ ...d, fotosNuevas: d.fotosNuevas.filter((_, j) => j !== i) }))} />
          ))}
          <SubirArchivo accept="image/*" multiple label="Agregar fotos" onFile={(a) => onChange((d) => ({ ...d, fotosNuevas: [...d.fotosNuevas, a.nombre.replace(/\.[^.]+$/, '')] }))} />
        </div>
      </Field>
    </div>
  )
}

function FotoChip({ titulo, onQuitar }: { titulo: string; onQuitar: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-1 pr-1 pl-2 text-xs text-slate-700">
      {titulo}
      <button type="button" onClick={onQuitar} aria-label={`Quitar foto ${titulo}`} className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900">
        <X className="size-3" aria-hidden />
      </button>
    </span>
  )
}

/** Datos del formulario → levantamiento guardado (sin las medidas vacías). */
export function aLevantamiento(d: DatosLevantamiento, responsable: string): Levantamiento {
  const { fotosNuevas: _n, fotosQuitadas: _q, ...resto } = d
  return { ...resto, responsable, medidas: d.medidas.filter((m) => m.etiqueta.trim() || m.valor.trim()) }
}
