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
2. **Proyecto 1** (“Instalación F.O. Subestación Eléctrica – Contenedor CCM”) → pestaña **Levantamiento** (medidas, ruta, racks, fotos). Con **Editar** se corrige o completa la visita; si el proyecto se creó sin levantamiento, ahí mismo se registra.
3. **Cotización** del proyecto 1: es un proyecto cerrado, así que su cotización aparece en solo lectura (registro de lo vendido, con proveedor en cada ítem). Para cotizar en vivo abre **PRY-2026-021 “Canalización y circuito regulado”** (borrador): elige proveedores en la columna *Proveedor* (se carga el precio neto del catálogo), escribe el **% utilidad** y el **% otros ajustes** y define el precio final. Debajo del proveedor de cada ítem aparece la **última compra real** del material (lo que facturó el proveedor en otro proyecto); si el precio digitado se aleja 10 % o más, se resalta y sale una alerta arriba (prueba subir la *Canaleta metálica* a $75.000). Muestra también **Agregar ítem**, **Agregar kit → Punto de red**, **Agregar sección** y **Nueva versión**.
4. **Vista cliente** (interruptor arriba a la derecha): oculta proveedores, costos y utilidad.
5. **Vista previa PDF** → cambiar el *Nivel de detalle* y el *Documento* (Cotización o **Precotización**, el estimado rápido sin firma de aceptación) → **Descargar PDF** (usa la impresión del navegador). **Imprimir interna** saca la versión para la empresa, con proveedor, costos y utilidad.
6. **Compras** — estados de la cotización con fecha (aprobar o rechazar pide confirmación y se puede deshacer), OC del cliente (cambiar el valor muestra la alerta) y **Generar órdenes de compra** en PRY-2026-018 (aprobado, sin OC): primero muestra la vista previa por proveedor; una tarjeta por proveedor con consecutivo, ítems, total y **Ver PDF**. **Editar** una OC resalta las diferencias contra lo cotizado.
7. **Catálogo** → ficha de *Cable F-UTP Cat 6A* → **Compras reales**: lo que cobró cada proveedor por proyecto, con la variación frente a la compra anterior y el precio de la OC cuando no coincide.
8. **Facturas de proveedores** (menú lateral) — `EPE28045` y `EPE28102` están en *Sin asignar*: **Asociar a proyecto / OC** → `EPE28045` va al proyecto 2 → OC 2609-005 (y `EPE28102` a la OC de Eléctricos del Valle del proyecto 7, 2609-012). Abrir `DRG-293076` para ver la comparación contra la OC (el cable F-UTP se facturó a $2.772 frente a $2.650 ordenado).
9. **Proyecto 2 → Ejecución** — bitácora de obra (probar en celular o con el modo responsive del navegador): cantidades instaladas con +/−, semáforo por ítem y total, imprevistos con foto y seriales.
10. **Proyecto 1 → Entrega** (fotos seleccionables, certificación, acta para firmar) y **Cierre**: factura FE 500, **Copiar texto de observaciones** para el POS y la **liquidación** (cotizado vs. instalado, mano de obra real, utilidad estimada vs. real), que también se imprime.

## Flujo completo: de un proyecto nuevo a uno archivado

1. **Registrar.** Inicio o Proyectos → **Nuevo proyecto**: cliente (existente o nuevo), nombre y sede, y levantamiento (medidas, racks, ruta y fotos). Queda en etapa 1 con código `PRY-AAAA-NNN` y cotización `COT-AAAA-NNN` v1 en borrador.
2. **Cotizar.** Secciones, ítems del catálogo (si el material no existe, se crea antes en **Catálogo → Nuevo material**), proveedor por ítem, otros costos, % utilidad y ajustes, y precio final. **Vista previa PDF** con el nivel de detalle que verá el cliente.
3. **Aprobar y comprar.** En Compras se marca la cotización como enviada y luego aprobada, se registra la OC del cliente (con alerta si el valor no coincide) y se generan las OC por proveedor.
4. **Ejecutar.** Llegan las facturas de proveedor: se registran y se asocian a la OC, con comparación automática. En obra, la bitácora registra cantidades instaladas, imprevistos con foto y seriales; el semáforo avisa sobrecostos.
5. **Entregar.** Remisión (equipos y seriales), informe con las fotos elegidas y la certificación, y acta de conformidad para firmar. La copia firmada se carga.
6. **Cerrar.** Se registra la factura emitida en el POS, se copia el texto de observaciones y la liquidación muestra la utilidad real.
7. **Consultar después.** Desde el buscador (cualquier número: cotización, OC, factura, remisión o serial), desde **Clientes** (proyectos, equipos con garantía y documentos) o desde **Rentabilidad**. Dentro del proyecto, **Documentos** muestra el expediente con vista previa de cada archivo e **Historial** muestra la línea de tiempo completa.

## Reglas que respeta el mockup

- Interfaz en español (Colombia), totales en pesos sin decimales (`$1.234.567`) y valores unitarios con hasta 3 decimales; cada línea cuadra al peso y `npm run verificar` lo comprueba en todas las cotizaciones. Si un precio final no se puede repartir exacto (p. ej. una sola línea de más de 1.000 unidades), el cotizador lo avisa y ofrece el precio más cercano que sí cuadra (a 1 o 2 pesos). En los campos numéricos el decimal se puede escribir con coma o con punto (`2650.5`); `1.234` se lee como miles y fechas DD/MM/AAAA. La fecha “de hoy” está fija en 10/10/2026 (`src/lib/format.ts`) para que la demo sea reproducible.
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

- Los ítems del proyecto 1 y las facturas DRG-293076, EPE28045 y 1004401950 se tomaron de los documentos reales (cotización en Excel y facturas en PDF/XML), incluidos los ítems 13 (Unión EMT 1") y 14 (Terminal / adaptador EMT 1") y el precio de lista con % de descuento por línea de Eléctricos del Valle.
- Los proyectos 2 y 3 se crearon para el mismo cliente (Papeles Nacionales). Sus ítems, precios de catálogo y números de OC del cliente son ilustrativos.
- Los proyectos 4 a 13 (`src/data/demo.ts`) son de demostración para ver el sistema con volumen: 13 proyectos en las 5 etapas, 6 clientes **ficticios**, 52 materiales en 7 categorías, órdenes de compra y facturas de proveedor (algunas pagadas, otras vencidas o por vencer, y dos sin asignar). Sus números de documento y NIT son inventados.
- Semáforo de ejecución: verde hasta 100 % del presupuesto, amarillo hasta 110 % y rojo por encima (`UMBRAL_AMARILLO` en `calc.ts`).
- Al agregar un ítem o kit, si el material tiene un solo proveedor en el catálogo se asigna automáticamente; si tiene varios, queda en “Sin asignar”.
