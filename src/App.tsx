import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InicioPage } from '@/modules/inicio/InicioPage'
import { ProyectosPage } from '@/modules/proyectos/ProyectosPage'
import { ProyectoDetalle } from '@/modules/proyectos/ProyectoDetalle'
import { CotizacionPdfPage } from '@/modules/cotizaciones/CotizacionPdfPage'
import { OrdenCompraPdfPage } from '@/modules/compras/OrdenCompraPdfPage'
import { InformeEntregaPage } from '@/modules/entrega/InformeEntregaPage'
import { FacturasPage } from '@/modules/facturas/FacturasPage'
import { CatalogoPage } from '@/modules/catalogo/CatalogoPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="proyectos" element={<ProyectosPage />} />
          <Route path="proyectos/:id" element={<Navigate to="cotizacion" replace />} />
          <Route path="proyectos/:id/:tab" element={<ProyectoDetalle />} />
          <Route path="facturas" element={<FacturasPage />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* Vistas de documento: sin barra lateral, listas para imprimir */}
        <Route path="proyectos/:id/cotizacion/pdf" element={<CotizacionPdfPage />} />
        <Route path="proyectos/:id/oc/:ocId" element={<OrdenCompraPdfPage />} />
        <Route path="proyectos/:id/entrega/informe" element={<InformeEntregaPage />} />
      </Routes>
    </BrowserRouter>
  )
}
