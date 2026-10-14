import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InicioPage } from '@/modules/inicio/InicioPage'
import { ProyectosPage } from '@/modules/proyectos/ProyectosPage'
import { ProyectoDetalle } from '@/modules/proyectos/ProyectoDetalle'
import { CotizacionPdfPage } from '@/modules/cotizaciones/CotizacionPdfPage'
import { CotizacionInternaPage } from '@/modules/cotizaciones/CotizacionInternaPage'
import { LiquidacionPage } from '@/modules/entrega/LiquidacionPage'
import { OrdenCompraPdfPage } from '@/modules/compras/OrdenCompraPdfPage'
import { ActaEntregaPage, InformeEntregaPage } from '@/modules/entrega/InformeEntregaPage'
import { RemisionPage } from '@/modules/entrega/RemisionPage'
import { FacturasPage } from '@/modules/facturas/FacturasPage'
import { CatalogoPage } from '@/modules/catalogo/CatalogoPage'
import { VisorDocumento } from '@/components/VisorDocumento'
import { ClientesPage } from '@/modules/clientes/ClientesPage'
import { RentabilidadPage } from '@/modules/rentabilidad/RentabilidadPage'

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
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="rentabilidad" element={<RentabilidadPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* Vistas de documento: sin barra lateral, listas para imprimir */}
        <Route path="proyectos/:id/cotizacion/pdf" element={<CotizacionPdfPage />} />
        <Route path="proyectos/:id/cotizacion/interna" element={<CotizacionInternaPage />} />
        <Route path="proyectos/:id/cierre/liquidacion" element={<LiquidacionPage />} />
        <Route path="proyectos/:id/oc/:ocId" element={<OrdenCompraPdfPage />} />
        <Route path="proyectos/:id/entrega/informe" element={<InformeEntregaPage />} />
        <Route path="proyectos/:id/entrega/acta" element={<ActaEntregaPage />} />
        <Route path="proyectos/:id/entrega/remision" element={<RemisionPage />} />
      </Routes>
      <VisorDocumento />
    </BrowserRouter>
  )
}
