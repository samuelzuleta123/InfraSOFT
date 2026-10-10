import { PageHeader } from '@/components/ui'
import { ListaProyectos } from './ListaProyectos'

export function ProyectosPage() {
  return (
    <>
      <PageHeader title="Proyectos" description="Todos los proyectos de la empresa. El buscador encuentra el proyecto por cualquier número de documento: cotización, OC o factura." />
      <ListaProyectos titulo="Listado" />
    </>
  )
}
