// Plantilla tipo carta para documentos imprimibles (cotización, OC, informe, acta).
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import { Button } from '@/components/ui'

export function MembreteInfrasoft() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded bg-brand-900 text-white" aria-hidden>
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M8 7h4v18H8zM15 7h9v4.5h-4.5v2.5H23v4.5h-3.5V25H15z" fill="currentColor" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-xl font-bold tracking-[0.12em] text-brand-900">INFRASOFT</div>
        <div className="text-[10px] tracking-wide text-slate-500 uppercase">Services S.A.S. · Infraestructura tecnológica y redes</div>
      </div>
    </div>
  )
}

export function BarraDocumento({ volver, volverTexto, children, onDescargar }: { volver: string; volverTexto: string; children?: ReactNode; onDescargar?: () => void }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-3 px-4 py-3">
        <Link to={volver} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          <ChevronLeft className="size-4" aria-hidden />
          {volverTexto}
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
      Infrasoft Services S.A.S. · Pereira, Risaralda, Colombia
    </footer>
  )
}
