import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { clientes, historialPrecios, kits, materiales, precios, proveedores } from '@/data/catalogo'
import { facturasProveedor, ordenesCompra } from '@/data/compras'
import { proyectos } from '@/data/proyectos'
import { precioNeto, versionActiva, versionVigente } from '@/lib/calc'
import { formatoConsecutivoOC, generarOrdenes } from '@/lib/compras'
import { HOY, uid } from '@/lib/format'
import type {
  Cliente,
  EstadoCotizacion,
  FacturaProveedor,
  HistorialPrecio,
  ItemCotizacion,
  Kit,
  Material,
  OrdenCompra,
  PrecioProveedor,
  Proveedor,
  Proyecto,
  VersionCotizacion,
} from '@/types'

export interface Toast {
  id: string
  texto: string
  tono: 'ok' | 'info' | 'error'
}

interface State {
  proyectos: Proyecto[]
  clientes: Cliente[]
  proveedores: Proveedor[]
  materiales: Material[]
  precios: PrecioProveedor[]
  historial: HistorialPrecio[]
  kits: Kit[]
  ordenes: OrdenCompra[]
  facturas: FacturaProveedor[]
  /** Último número de OC emitido en el mes actual. */
  contadorOC: number
  toasts: Toast[]
  sidebarCompacta: boolean

  setSidebarCompacta: (v: boolean) => void
  /** Modifica cualquier parte del estado (immer). */
  mutar: (fn: (s: State) => void) => void
  editarProyecto: (id: string, fn: (p: Proyecto) => void) => void
  editarVersion: (proyectoId: string, fn: (v: VersionCotizacion, p: Proyecto) => void) => void
  editarItem: (proyectoId: string, itemId: string, fn: (i: ItemCotizacion) => void) => void
  asignarProveedor: (proyectoId: string, itemId: string, proveedorId: string | null) => void
  nuevaVersion: (proyectoId: string) => void
  cambiarEstadoCotizacion: (proyectoId: string, versionId: string, estado: EstadoCotizacion, fecha?: string) => void
  generarOCs: (proyectoId: string) => number
  actualizarPrecio: (precioId: string, cambios: Partial<Pick<PrecioProveedor, 'precioLista' | 'descuentoPct'>>) => void
  notificar: (texto: string, tono?: Toast['tono']) => void
}

const clonar = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export const useStore = create<State>()(
  immer((set, get) => ({
    proyectos: clonar(proyectos),
    clientes: clonar(clientes),
    proveedores: clonar(proveedores),
    materiales: clonar(materiales),
    precios: clonar(precios),
    historial: clonar(historialPrecios),
    kits: clonar(kits),
    ordenes: clonar(ordenesCompra),
    facturas: clonar(facturasProveedor),
    contadorOC: 0,
    toasts: [],
    sidebarCompacta: false,

    setSidebarCompacta: (v) =>
      set((s) => {
        s.sidebarCompacta = v
      }),
    mutar: (fn) => set(fn),

    editarProyecto: (id, fn) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === id)
        if (p) fn(p)
      }),

    editarVersion: (proyectoId, fn) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === proyectoId)
        if (p) fn(versionActiva(p), p)
      }),

    editarItem: (proyectoId, itemId, fn) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === proyectoId)
        if (!p) return
        for (const v of p.cotizacion.versiones)
          for (const sec of v.secciones) {
            const i = sec.items.find((x) => x.id === itemId)
            if (i) return fn(i)
          }
      }),

    asignarProveedor: (proyectoId, itemId, proveedorId) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === proyectoId)
        if (!p) return
        const item = versionActiva(p)
          .secciones.flatMap((x) => x.items)
          .find((x) => x.id === itemId)
        if (!item) return
        item.proveedorId = proveedorId
        if (proveedorId && item.materialId) {
          const precio = s.precios.find((x) => x.materialId === item.materialId && x.proveedorId === proveedorId)
          if (precio) item.vuMaterial = precioNeto(precio)
        }
      }),

    nuevaVersion: (proyectoId) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === proyectoId)
        if (!p) return
        const base = versionActiva(p)
        const copia: VersionCotizacion = clonar(base)
        copia.id = uid('ver')
        copia.nombre = `v${p.cotizacion.versiones.length + 1}`
        copia.creada = HOY
        copia.estado = 'borrador'
        copia.historial = [{ estado: 'borrador', fecha: HOY }]
        for (const sec of copia.secciones) {
          sec.id = uid('sec')
          for (const i of sec.items) {
            i.id = uid('it')
            i.cantInstalada = null
          }
        }
        p.cotizacion.versiones.push(copia)
        p.cotizacion.versionActivaId = copia.id
      }),

    cambiarEstadoCotizacion: (proyectoId, versionId, estado, fecha = HOY) =>
      set((s) => {
        const p = s.proyectos.find((x) => x.id === proyectoId)
        const v = p?.cotizacion.versiones.find((x) => x.id === versionId)
        if (!p || !v) return
        if (estado === 'aprobada')
          for (const otra of p.cotizacion.versiones)
            if (otra.id !== v.id && otra.estado === 'aprobada') {
              otra.estado = 'enviada'
              otra.historial.push({ estado: 'enviada', fecha })
            }
        v.estado = estado
        v.historial.push({ estado, fecha })
        if (estado === 'aprobada' && p.etapa < 2) p.etapa = 2
      }),

    generarOCs: (proyectoId) => {
      const p = get().proyectos.find((x) => x.id === proyectoId)
      if (!p) return 0
      let contador = get().contadorOC
      const nuevas = generarOrdenes(p.id, versionVigente(p), () => formatoConsecutivoOC(HOY, ++contador))
      set((s) => {
        s.ordenes = s.ordenes.filter((o) => o.proyectoId !== proyectoId).concat(nuevas)
        s.contadorOC = contador
        for (const f of s.facturas) if (f.ocId && !s.ordenes.some((o) => o.id === f.ocId)) f.ocId = null
      })
      return nuevas.length
    },

    actualizarPrecio: (precioId, cambios) =>
      set((s) => {
        const pr = s.precios.find((x) => x.id === precioId)
        if (!pr) return
        Object.assign(pr, cambios)
        pr.fecha = HOY
        const ultimo = s.historial
          .filter((h) => h.materialId === pr.materialId && h.proveedorId === pr.proveedorId)
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .at(-1)
        if (ultimo?.fecha === HOY) {
          ultimo.precioLista = pr.precioLista
          ultimo.descuentoPct = pr.descuentoPct
        } else {
          s.historial.push({
            id: uid('hp'),
            materialId: pr.materialId,
            proveedorId: pr.proveedorId,
            precioLista: pr.precioLista,
            descuentoPct: pr.descuentoPct,
            fecha: HOY,
          })
        }
      }),

    notificar: (texto, tono = 'ok') => {
      const id = uid('t')
      set((s) => {
        s.toasts.push({ id, texto, tono })
      })
      setTimeout(
        () =>
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id)
          }),
        3800,
      )
    },
  })),
)

// ── Selectores ─────────────────────────────────────────────────────────

export const useProyecto = (id: string | undefined) => useStore((s) => s.proyectos.find((p) => p.id === id))
export const useCliente = (id: string | undefined) => useStore((s) => s.clientes.find((c) => c.id === id))

export function nombreProveedor(proveedores: Proveedor[], id: string | null | undefined) {
  if (!id) return 'Sin asignar'
  return proveedores.find((p) => p.id === id)?.nombre ?? 'Sin asignar'
}
