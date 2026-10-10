import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, PageHeader } from '@/components/ui'
import { ListaProyectos } from './ListaProyectos'
import { NuevoProyectoModal } from './NuevoProyectoModal'

export function ProyectosPage() {
  const [nuevo, setNuevo] = useState(false)
  return (
    <>
      <PageHeader
        title="Proyectos"
        description="Todos los proyectos de la empresa. El buscador encuentra el proyecto por cualquier número de documento: cotización, OC o factura."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={() => setNuevo(true)}>
            Nuevo proyecto
          </Button>
        }
      />
      <ListaProyectos titulo="Listado" />
      {nuevo && <NuevoProyectoModal onClose={() => setNuevo(false)} />}
    </>
  )
}
