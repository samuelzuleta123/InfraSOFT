# Infrasoft · Gestión de proyectos (mockup navegable)

Mockup **solo frontend** del sistema de gestión de proyectos de Infrasoft Services S.A.S. (Pereira).
No tiene backend ni base de datos: los datos de prueba viven en `src/data/*.ts` y el estado en memoria (Zustand).
Lo que se cambie durante la demo se refleja en todas las pantallas mientras la pestaña esté abierta; al recargar vuelve a los datos iniciales.

```bash
npm install
npm run dev          # http://localhost:5173
npm run verificar    # comprueba que el cotizador del proyecto 1 cuadre con los totales esperados
```

## Ruta sugerida para la demo

1. **Inicio** — proyectos por etapa, cotización pendiente de respuesta, facturas por vencer. Escribir `LOC-0081930` o `DRG-293076` en el buscador para mostrar que encuentra el proyecto por número de documento.
2. **Proyecto 1** (“Instalación F.O. Subestación Eléctrica – Contenedor CCM”) → pestaña **Levantamiento** (medidas, ruta, racks, fotos).
3. **Cotización** — la barra lateral se contrae sola para dar espacio.
   - Elegir proveedores en vivo en la columna *Proveedor* (13 ítems están en “Sin asignar”). Al elegir, se carga el precio neto del catálogo. Ejemplo: Tubería EMT 1" con RG ($34.800) frente a Eléctricos del Valle ($36.000).
   - Escribir el **% utilidad** y el **% otros ajustes** (arrancan vacíos) y ver el precio sugerido; el precio final cotizado ($7.200.000) es editable.
   - Mostrar **Agregar ítem**, **Agregar kit → Punto de red**, **Agregar sección**, **Nueva versión** y el selector v1/v2.
4. **Vista cliente** (interruptor arriba a la derecha): oculta proveedores, costos y utilidad.
5. **Vista previa PDF** → cambiar el *Nivel de detalle* → **Descargar PDF** (usa la impresión del navegador).
6. **Compras** — estados de la cotización con fecha, OC del cliente (cambiar el valor muestra la alerta) y **Generar órdenes de compra**: una tarjeta por proveedor con consecutivo, ítems, total y **Ver PDF**. **Editar** una OC resalta las diferencias contra lo cotizado.
7. **Facturas de proveedores** (menú lateral) — `EPE28045` está en *Sin asignar*: **Asociar a proyecto / OC** → proyecto 2 → OC 2609-005. Abrir `DRG-293076` para ver la comparación contra la OC (el cable F-UTP se facturó a $2.772 frente a $2.650 ordenado).
8. **Proyecto 2 → Ejecución** — bitácora de obra (probar en celular o con el modo responsive del navegador): cantidades instaladas con +/−, semáforo por ítem y total, imprevistos con foto y seriales.
9. **Proyecto 1 → Entrega** (fotos seleccionables, certificación, acta para firmar) y **Cierre**: factura FE 500, **Copiar texto de observaciones** para el POS y la **liquidación** (cotizado vs. instalado, mano de obra real, utilidad estimada vs. real).

## Reglas que respeta el mockup

- Interfaz en español (Colombia), pesos sin decimales (`$1.234.567`) y fechas DD/MM/AAAA. La fecha “de hoy” está fija en 10/10/2026 (`src/lib/format.ts`) para que la demo sea reproducible.
- Todos los totales se calculan en `src/lib/calc.ts` a partir de los datos; nada se guarda precalculado.
- Utilidad, ajustes, descuentos, IVA y pólizas siempre son campos que digita el usuario; vacíos valen 0.
- Sin facturación electrónica, DIAN ni lectura de XML: la factura al cliente se emite en el POS y aquí solo se registra; los PDF/XML de proveedores son simples adjuntos.

## Estructura

```
src/
  data/          datos de prueba (catálogo, proyectos, compras y facturas)
  lib/           formato, cálculos, generación de OC y búsqueda
  store/         estado global en memoria (Zustand + Immer)
  components/    ui/ (botones, campos, tablas, modal…), layout/, dominio.tsx, Documento.tsx
  modules/
    inicio/      dashboard
    proyectos/   lista, detalle, levantamiento, documentos
    cotizaciones/ cotizador, resumen, modales de ítem y kit, PDF al cliente
    compras/     estados, OC del cliente, OC a proveedores, PDF de OC
    facturas/    bandejas, registro, asociación, comparación con OC, vencimientos
    ejecucion/   bitácora de obra
    entrega/     informe, acta, factura al cliente, observaciones, liquidación
    catalogo/    materiales, precios por proveedor e historial
```

## Supuestos del mockup

- En el texto recibido faltaban los ítems 13 y 14 del proyecto 1. Se completaron como **Unión EMT 1"** (12 × $3.500) y **Curva EMT 1"** (4 × $8.000), sin mano de obra, porque son los únicos valores que cuadran con los totales esperados (mano de obra $1.613.500 y materiales $3.099.500).
- El IVA de la factura DRG-293076 venía truncado; se registró $252.971 (19 % del subtotal), que da un total de $1.584.395.
- Los proyectos 2 y 3 se crearon para el mismo cliente (Papeles Nacionales). Sus ítems, precios de catálogo y números de OC del cliente son ilustrativos.
- Semáforo de ejecución: verde hasta 100 % del presupuesto, amarillo hasta 110 % y rojo por encima (`UMBRAL_AMARILLO` en `calc.ts`).
- Al agregar un ítem o kit, si el material tiene un solo proveedor en el catálogo se asigna automáticamente; si tiene varios, queda en “Sin asignar”.
