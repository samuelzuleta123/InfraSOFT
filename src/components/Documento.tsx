// Plantilla tipo carta para documentos imprimibles (cotización, OC, informe, acta).
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { Logotipo } from '@/components/Marca'

export function MembreteInfrasoft() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Logotipo tamano="md" />
      <div className="text-[10px] leading-snug text-slate-500">
        NIT 900.712.766-3 · Calle 4 No. 15-55, Pereira
        <br />
        (57) 316 874 3177 · comercial@infrasoft.net.co
      </div>
    </div>
  )
}

/** Origen con el que se abrió un documento (p. ej. desde Documentos), para volver allí y no al módulo que lo genera. */
export type OrigenDocumento = { volver: string; volverTexto: string }

export function BarraDocumento({ volver, volverTexto, children, onDescargar }: { volver: string; volverTexto: string; children?: ReactNode; onDescargar?: () => void }) {
  const origen = useLocation().state as Partial<OrigenDocumento> | null
  const destino = origen?.volver && origen.volverTexto ? (origen as OrigenDocumento) : { volver, volverTexto }
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-3 px-4 py-3">
        <Link to={destino.volver} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          <ChevronLeft className="size-4" aria-hidden />
          {destino.volverTexto}
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {children}
          <Button variant="primary" icon={<Download />} onClick={onDescargar ?? (() => window.print())}>
            Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Hoja tamaño carta (8,5 × 11 in) centrada en pantalla. */
export function HojaCarta({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-200/70 pt-8 pb-12 print:bg-white print:p-0">
      <article className="print-sheet mx-auto w-full max-w-[8.5in] bg-white px-6 py-8 text-[13px] leading-relaxed text-slate-800 shadow-lg sm:min-h-[11in] sm:px-[0.8in] sm:py-[0.7in]">
        {children}
      </article>
    </div>
  )
}

export function PieInfrasoft() {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
      Infrasoft Services S.A.S. · NIT 900.712.766-3 · Calle 4 No. 15-55, Pereira · (57) 316 874 3177 · comercial@infrasoft.net.co
    </footer>
  )
}
