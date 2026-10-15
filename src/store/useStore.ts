import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { clientes, historialPrecios, kits, materiales, precios, proveedores } from '@/data/catalogo'
import { facturasProveedor, ordenesCompra } from '@/data/compras'
import { proyectos } from '@/data/proyectos'
import { clientesDemo, facturasDemo, ordenesDemo, proyectosDemo } from '@/data/demo'
import { precioNeto, versionActiva, versionVigente } from '@/lib/calc'
import { formatoConsecutivoOC, generarOrdenes } from '@/lib/compras'
import { historicoCompras } from '@/lib/historico'
import { HOY, uid } from '@/lib/format'
import type {
  Adjunto,
  Cliente,
  ContextoDoc,
  Levantamiento,
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

export interface DocVisor {
  adjunto: Adjunto
  contexto: ContextoDoc
}

export interface NuevoProyecto {
  clienteId: string
  nombre: string
  sede: string
  responsable: string
  levantamiento: Levantamiento | null
  fotos: string[]
}

export interface Toast {
  id: string
  texto: string
  tono: 'ok' | 'info' | 'error'
  /** Texto del botón de deshacer; la función vive fuera del estado. */
  deshacer?: string
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
  visor: DocVisor | null

  abrirVisor: (doc: DocVisor) => void
  cerrarVisor: () => void
  crearProyecto: (datos: NuevoProyecto) => string
  crearCliente: (c: Omit<Cliente, 'id'>) => string
  crearProveedor: (p: Omit<Proveedor, 'id'>) => string
  crearMaterial: (m: Omit<Material, 'id'>, precio?: { proveedorId: string; precioLista: number; descuentoPct: number | null }) => string

  setSidebarCompacta: (v: boolean) => void
  /** Modifica cualquier parte del estado (immer). */
  mutar: (fn: (s: State) => void) => void
  editarProyecto: (id: string, fn: (p: Proyecto) => void) => void
  editarVersion: (proyectoId: string, fn: (v: VersionCotizacion, p: Proyecto) => void) => void
  editarItem: (proyectoId: string, itemId: string, fn: (i: ItemCotizacion) => void) => void
  asignarProveedor: (proyectoId: string, itemId: string, proveedorId: string | null) => void
  /** Guarda en el catálogo el precio digitado de un material en un proveedor que todavía no lo tenía. */
  guardarPrecioDigitado: (materialId: string, proveedorId: string, precio: number) => void
  nuevaVersion: (proyectoId: string) => void
  cambiarEstadoCotizacion: (proyectoId: string, versionId: string, estado: EstadoCotizacion, fecha?: string) => void
  generarOCs: (proyectoId: string) => number
  /** Crea el kit si su id no existe; si existe, lo reemplaza. */
  guardarKit: (kit: Kit) => void
  eliminarKit: (kitId: string) => void
  actualizarPrecio: (precioId: string, cambios: Partial<Pick<PrecioProveedor, 'precioLista' | 'descuentoPct'>>) => void
  notificar: (texto: string, tono?: Toast['tono'], deshacer?: () => void) => void
  ejecutarDeshacer: (toastId: string) => void
}

const clonar = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

/** Funciones de deshacer de los avisos activos (no se guardan en el estado). */
const deshaceres = new Map<string, () => void>()

export const useStore = create<State>()(
  immer((set, get) => ({
    proyectos: clonar([...proyectos, ...proyectosDemo]),
    clientes: clonar([...clientes, ...clientesDemo]),
    proveedores: clonar(proveedores),
    materiales: clonar(materiales),
    precios: clonar(precios),
    historial: clonar(historialPrecios),
    kits: clonar(kits),
    ordenes: clonar([...ordenesCompra, ...ordenesDemo]),
    facturas: clonar([...facturasProveedor, ...facturasDemo]),
    contadorOC: 0,
    toasts: [],
    sidebarCompacta: false,
    visor: null,

    abrirVisor: (doc) =>
      set((s) => {
        s.visor = doc
      }),
    cerrarVisor: () =>
      set((s) => {
        s.visor = null
      }),

    crearProyecto: (d) => {
      const anio = HOY.slice(0, 4)
      const siguiente = (prefijo: string, usados: string[]) => {
        const n = Math.max(0, ...usados.filter((x) => x.startsWith(prefijo)).map((x) => parseInt(x.slice(prefijo.length), 10) || 0)) + 1
        return `${prefijo}${String(n).padStart(3, '0')}`
      }
      const id = uid('p')
      set((s) => {
        const codigo = siguiente(`PRY-${anio}-`, s.proyectos.map((p) => p.codigo))
        const consecutivo = siguiente(`COT-${anio}-`, s.proyectos.map((p) => p.cotizacion.consecutivo))
        const vid = uid('ver')
        s.proyectos.unshift({
          id,
          codigo,
          nombre: d.nombre,
          clienteId: d.clienteId,
          sede: d.sede,
          responsable: d.responsable,
          etapa: 1,
          creado: HOY,
          levantamiento: d.levantamiento,
          fotos: d.fotos.map((titulo, i) => ({ id: uid('f'), titulo, etapa: 'levantamiento', tono: [210, 30, 160, 200][i % 4] })),
          cotizacion: {
            consecutivo,
            alcance: '',
            tiempoEntrega: '',
            condiciones: '',
            versionActivaId: vid,
            versiones: [
              {
                id: vid,
                nombre: 'v1',
                creada: HOY,
                secciones: [{ id: uid('sec'), nombre: 'Sección 1', items: [] }],
                otrosCostos: [
                  { clave: 'siso', nombre: 'SG-SST', cantidad: 0, valorUnitario: 0 },
                  { clave: 'polizas', nombre: 'Pólizas', cantidad: 0, valorUnitario: 0 },
                  { clave: 'viaticos', nombre: 'Viáticos', cantidad: 0, valorUnitario: 0 },
                  { clave: 'transporte', nombre: 'Transporte / Flete', cantidad: 0, valorUnitario: 0 },
                ],
                utilidadPct: null,
                ajustesPct: null,
                precioFinal: null,
                estado: 'borrador',
                historial: [{ estado: 'borrador', fecha: HOY }],
              },
            ],
          },
          ocCliente: null,
          imprevistos: [],
          seriales: [],
          entrega: { fotosSeleccionadas: [], certificacion: null, actaFirmada: null, fechaEntrega: null, garantia: '', remision: '' },
          facturaCliente: null,
        })
      })
      return id
    },

    crearCliente: (c) => {
      const id = uid('cli')
      set((s) => {
        s.clientes.push({ ...c, id, nombre: c.nombre.trim(), nit: c.nit.trim(), direccion: c.direccion.trim(), ciudad: c.ciudad.trim() })
      })
      return id
    },

    crearProveedor: (p) => {
      const id = uid('prv')
      set((s) => {
        s.proveedores.push({ ...p, id, nombre: p.nombre.trim(), nit: p.nit.trim(), ciudad: p.ciudad.trim() })
      })
      return id
    },

    crearMaterial: (m, precio) => {
      const id = uid('m')
      set((s) => {
        s.materiales.push({ ...m, id })
        if (precio) {
          s.precios.push({ id: uid('pp'), materialId: id, ...precio, fecha: HOY })
          s.historial.push({ id: uid('hp'), materialId: id, ...precio, fecha: HOY })
        }
      })
      return id
    },

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
        // Sin proveedor, o con uno sin precio para este material, el costo queda vacío: no hereda el del anterior.
        const precio = proveedorId && item.materialId ? s.precios.find((x) => x.materialId === item.materialId && x.proveedorId === proveedorId) : undefined
        item.vuMaterial = precio ? precioNeto(precio) : 0
      }),

    guardarPrecioDigitado: (materialId, proveedorId, precio) =>
      set((s) => {
        if (precio <= 0 || s.precios.some((x) => x.materialId === materialId && x.proveedorId === proveedorId)) return
        const nuevo = { materialId, proveedorId, precioLista: precio, descuentoPct: null, fecha: HOY }
        s.precios.push({ id: uid('pp'), ...nuevo })
        s.historial.push({ id: uid('hp'), ...nuevo })
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

    guardarKit: (kit) =>
      set((s) => {
        const i = s.kits.findIndex((k) => k.id === kit.id)
        if (i === -1) s.kits.push(kit)
        else s.kits[i] = kit
      }),

    eliminarKit: (kitId) =>
      set((s) => {
        s.kits = s.kits.filter((k) => k.id !== kitId)
      }),

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

    notificar: (texto, tono = 'ok', deshacer) => {
      const id = uid('t')
      if (deshacer) deshaceres.set(id, deshacer)
      set((s) => {
        s.toasts.push({ id, texto, tono, deshacer: deshacer ? 'Deshacer' : undefined })
      })
      setTimeout(
        () => {
          deshaceres.delete(id)
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id)
          })
        },
        deshacer ? 7000 : 3800,
      )
    },

    ejecutarDeshacer: (toastId) => {
      deshaceres.get(toastId)?.()
      deshaceres.delete(toastId)
      set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== toastId)
      })
    },
  })),
)

// ── Selectores ─────────────────────────────────────────────────────────

export const useProyecto = (id: string | undefined) => useStore((s) => s.proyectos.find((p) => p.id === id))
export const useCliente = (id: string | undefined) => useStore((s) => s.clientes.find((c) => c.id === id))

/** Histórico de compras reales (facturado por proveedor), derivado de OC y facturas. */
export function useHistoricoCompras() {
  const proyectos = useStore((s) => s.proyectos)
  const ordenes = useStore((s) => s.ordenes)
  const facturas = useStore((s) => s.facturas)
  return useMemo(() => historicoCompras(proyectos, ordenes, facturas), [proyectos, ordenes, facturas])
}

export function nombreProveedor(proveedores: Proveedor[], id: string | null | undefined) {
  if (!id) return 'Sin asignar'
  return proveedores.find((p) => p.id === id)?.nombre ?? 'Sin asignar'
}
