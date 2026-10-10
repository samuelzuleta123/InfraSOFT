// Marca Infrasoft reconstruida a partir del logo de la FE 500: "Infr" y "oft" en verde, "as" en gris
// con dos hojas sobre la "a", y "SERVICES S.A.S" en gris. Reemplazar por el archivo oficial cuando llegue.
import { cn } from '@/lib/cn'

const Hojas = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 12" className={className} aria-hidden>
    <path d="M10.5 11.5C6.5 10 4.4 6.4 5 1c3.6 2.1 5.8 5.7 5.5 10.5Z" fill="currentColor" opacity=".55" />
    <path d="M13.5 11.5c4-1.5 6.1-5.1 5.5-10.5-3.6 2.1-5.8 5.7-5.5 10.5Z" fill="currentColor" opacity=".8" />
  </svg>
)

/** Logotipo completo. `tono="oscuro"` para fondos oscuros (barra lateral). */
export function Logotipo({ tono = 'claro', tamano = 'md', className }: { tono?: 'claro' | 'oscuro'; tamano?: 'sm' | 'md' | 'lg'; className?: string }) {
  const gris = tono === 'oscuro' ? 'text-slate-300' : 'text-slate-500'
  const t = { sm: 'text-[22px]', md: 'text-[26px]', lg: 'text-[34px]' }[tamano]
  return (
    <span className={cn('inline-flex flex-col items-center leading-none', t, className)} aria-label="Infrasoft Services S.A.S." role="img">
      <span className="font-light tracking-tight" aria-hidden>
        <span className="text-brand-500">Infr</span>
        <span className={cn('relative', gris)}>
          <Hojas className="absolute -top-[0.42em] left-1/2 h-[0.42em] -translate-x-1/2" />
          as
        </span>
        <span className="text-brand-500">oft</span>
      </span>
      <span className={cn('mt-[0.2em] text-[0.3em] font-medium tracking-[0.2em] uppercase', gris)} aria-hidden>
        Services S.A.S
      </span>
    </span>
  )
}

/** Marca compacta para la barra contraída y el favicon. */
export function MarcaCompacta({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex size-10 items-center justify-center rounded-lg bg-white/8', className)} role="img" aria-label="Infrasoft">
      <Hojas className="absolute top-1 h-2.5 text-slate-300" />
      <span className="mt-2 text-xl leading-none font-light text-brand-500" aria-hidden>
        i
      </span>
    </span>
  )
}
