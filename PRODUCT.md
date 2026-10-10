# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Gerencia y dueños de Infrasoft Services S.A.S. (Pereira, Colombia), empresa de proyectos de infraestructura tecnológica y redes de telecomunicaciones (fibra óptica, cableado estructurado, tubería, racks). Son quienes usan el sistema en el día a día: cotizan, eligen proveedores y precios, aprueban, compran, siguen la obra, entregan, facturan y liquidan cada proyecto.

La bitácora de obra debe funcionar en celular porque se consulta y diligencia en sitio.

## Product Purpose

Gestionar cada proyecto de principio a fin en un solo lugar, en cinco etapas: 1. Cotización, 2. Aprobación y compras, 3. Ejecución, 4. Entrega, 5. Cierre. Reemplaza el trabajo actual en Excel (cotizador) y correo (órdenes de compra, facturas de proveedores, documentos).

Éxito: cotizar rápido y con cálculos confiables, saber la utilidad estimada frente a la real de cada proyecto, encontrar cualquier proyecto por cualquier número de documento y no perder de vista facturas por vencer ni cotizaciones sin respuesta.

Estado actual: mockup navegable solo frontend para presentar al cliente en una reunión; no es el producto final.

## Positioning

Está hecho a la medida del ciclo real de esta empresa: cotización por secciones con mano de obra y material separados, proveedor por ítem con precio neto del catálogo, una orden de compra por proveedor generada desde la cotización, comparación factura contra OC, bitácora de cantidades instaladas y liquidación cotizado frente a instalado.

## Operating Context

- Cliente de referencia: Papeles Nacionales S.A.S. (NIT 891.400.378-8), Puerto Caldas.
- Proveedores de referencia: Ingram Micro S.A.S., Eléctricos del Valle S.A.S., RG Distribuciones S.A.
- La empresa factura en su propio POS. El sistema solo registra la factura emitida y genera el texto de observaciones (OC del cliente, seriales, garantía, remisión) para pegarlo en el POS.
- Documentos del flujo: cotización (PDF tipo carta para el cliente), OC del cliente, OC a proveedores, facturas de proveedores (PDF y XML como adjuntos), informe de entrega, acta de conformidad firmada, factura al cliente.
- Consecutivos en uso: cotizaciones `COT-AAAA-NNN` con versiones (v1, v2…), OC de la empresa `AAMM-NNN` (ej. 2608-031), OC del cliente tipo `LOC-0081930`.

## Capabilities and Constraints

- Interfaz 100 % en español de Colombia. Moneda en pesos sin decimales con formato `$1.234.567`. Fechas `DD/MM/AAAA`.
- Todos los cálculos se derivan de los datos en el código; nunca se guardan valores calculados.
- No se asumen porcentajes de utilidad, descuentos, impuestos ni pólizas: siempre existen como campos, los digita el usuario y vacíos valen 0.
- Fuera de alcance: facturación electrónica, DIAN y lectura automática de XML.
- La vista cliente y el PDF para el cliente nunca muestran proveedores, costos internos ni utilidad.
- Mockup: React + Vite + TypeScript + Tailwind, estado en memoria (Zustand), datos de prueba en `src/data/`. Sin backend.
- Por definir: roles y permisos, persistencia, y si otros perfiles (coordinador técnico, técnicos, compras) usarán el sistema más adelante.

## Brand Commitments

- Nombre: Infrasoft Services S.A.S.
- La empresa tiene logo y colores corporativos definidos que el diseño debe usar. Aún no están en el repositorio: el mockup usa un logo provisional "INFRASOFT" y una paleta azul marino provisional hasta recibirlos.
- Tono pedido: sobrio y corporativo, apropiado para una empresa de telecomunicaciones.

## Evidence on Hand

- Datos reales del proyecto "Instalación F.O. Subestación Eléctrica – Contenedor CCM": ítems, valores, OC LOC-0081930, factura FE 500, seriales y remisión 286 (`src/data/proyectos.ts`).
- Facturas reales de proveedores DRG-293076, EPE28045 y 1004401950 (`src/data/compras.ts`).
- Los proyectos 2 y 3, sus ítems, precios de catálogo y OC del cliente LOC-0089412 son ilustrativos. No hay testimonios, métricas de uso ni clientes adicionales confirmados: no inventarlos.

## Product Principles

1. Los números mandan: cada total se puede rastrear hasta sus ítems y nunca se presenta un porcentaje que el usuario no digitó.
2. Lo interno no llega al cliente: costos, proveedores y utilidad quedan del lado de la empresa.
3. Un proyecto, un hilo: cotización, compras, obra, entrega y cierre se conectan y cualquier documento lleva al proyecto.
4. Registrar, no reemplazar: el sistema convive con el POS y los documentos de proveedores; no duplica facturación electrónica.
5. Rápido para gerencia: las decisiones clave (precio, proveedor, aprobación, pagos por vencer) se toman en segundos.
