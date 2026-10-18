# Resumen de cambios · 17–18/10/2026

22 commits en `main`, de `8339832` a `c033f2a`. El de Sentry (`b9302c0`) venía de otra sesión; se revisó y se subió.

## 1. Cotizador y cálculos

- **Utilidad cotizada corregida.** Los "otros ajustes" se descontaban como % del precio final en vez de con la misma regla del precio sugerido (con 80 % y 25 % sobre $997.300 daba $685.644 en vez de $797.840).
- **Sin panel "Resumen" lateral.** Solo aparecía en pantallas de 1600 px o más. Ahora el resumen vive siempre en la barra inferior, con "Usar sugerido" y el aviso de precio por debajo del costo.
- **No se envía una cotización con materiales incompletos.** "Marcar como enviada" se deshabilita si algún material no tiene proveedor o precio, y "Materiales con proveedor y precio" es requisito obligatorio de la etapa 1. Así nunca se aprueba una versión a la que no se le puedan generar las OC.
- **Avisos según lo que falta.** El aviso del cotizador y el requisito dicen exactamente qué completar: proveedor, precio o ambos.
- **Proveedores sin precio como opciones claras.** En el selector usan la misma fila que el resto: "Sin precio · lo digitas en la tabla".

## 2. PDF de la cotización

- **Vista cliente:** listado de lo que se suministra e instala (descripción, unidad y cantidad) y un solo valor total. Sin precios por ítem.
- **Vista interna:** nivel "Ítems con valor unitario" o "Solo valor total".
  - Ítems a **costo real** (material + instalación, sin inflar), y debajo subtotal, otros costos, otros ajustes y **Ganancia Infrasoft** hasta el valor total.
  - Sello rojo **"INTERNA · No entregar al cliente"** y título "Cotización interna".
- **Cada versión abre su propio PDF**, desde Compras ("Ver PDF") y desde Documentos. Antes el expediente abría siempre la versión seleccionada en el cotizador.
- **Sello de respuesta del cliente.** "Aprobada / Rechazada por el cliente · fecha" se ve en pantalla, pero no sale en el PDF que recibe el cliente. En la versión interna va dentro del sello "Interna" y sí se imprime.
- **Aviso en la vista previa** si faltan proveedores o precios: el total sale por debajo del real. Solo en pantalla.
- **Sin la alerta de "reparto exacto al peso"**: ya no se muestran precios repartidos.

## 3. Compras y aprobación

- **Motivo del rechazo obligatorio.** Lista de motivos frecuentes (precio alto, otro proveedor, sin presupuesto, aplazado, cambio de alcance, tiempo de entrega) u "Otro" con texto, más un comentario opcional. Se ve en Compras y en el Historial.
- **Acceso al cotizador desde Estado de la cotización:**
  - Versión rechazada: botón **"Crear vN en el cotizador"**, que crea la nueva versión y la abre.
  - Versión aprobada: botón **"Ir al cotizador"**.
- **La OC del cliente solo se registra con la cotización aprobada.** Antes de eso se explica que llega después de la aprobación.

## 4. Etapas y navegación

- **Solo lo obligatorio frena el avance de etapa.**
  - Sin bloqueos, el proyecto avanza de una vez, con **Deshacer**: desde el botón "Avanzar", la pestaña de la siguiente etapa, "Siguiente", las flechas, la barra de etapas o la URL.
  - El aviso menciona los recomendados que quedan pendientes.
  - Si falta algo obligatorio, la pantalla del candado dice qué es y enlaza a donde se resuelve.
- **Requisitos en su pestaña.** Cada requisito para avanzar aparece solo en la pestaña donde se resuelve; si falta algo en otra, una línea enlaza a ella.
- **Botones "Anterior" y "Siguiente"** al final de cada pestaña del proyecto.

## 5. Ejecución (bitácora)

- **Diferencia frente al presupuesto ya calculada**, en el resumen y en cada ítem: "+$67.500 sobre el presupuesto" o "−$X bajo el presupuesto".
- La diferencia de cantidad lleva la unidad: "+3 Un".

## 6. Entrega

- **Agregar fotos del trabajo terminado.** Varias a la vez, desde cámara o galería; quedan marcadas para el informe y se pueden quitar.
- **"Trabajos realizados" editable.** Arranca con el alcance cotizado y se ajusta a lo ejecutado. El informe y el acta usan ese texto; la cotización conserva el original.
- **Fechas de entrega y remisión** arrancan en hoy y se pueden cambiar, también a futuro.
- **Consecutivo de remisión sugerido** (el mayor registrado + 1) al abrir la pestaña, con aviso si el número ya se usó en otro proyecto.
- **El acta usa la ciudad real del cliente.** Antes decía siempre "Puerto Caldas".
- **Garantía redactada como frase** en el acta y en las observaciones del POS: "Garantía: 2 años en la instalación."

## 7. Cierre

**Factura al cliente prellenada**, todo editable:

| Campo | De dónde sale |
|---|---|
| Número | Siguiente consecutivo (FE 500 → FE 501), con aviso si se repite |
| Valor bruto | OC del cliente; sin OC, lo cotizado |
| % IVA | El de la última factura registrada |
| Forma de pago | Condiciones comerciales de la cotización ("crédito 30 días") |
| Vencimiento | Fecha + días de la forma de pago, recalculado al cambiar cualquiera |

## 8. Documentos

- Las OC y facturas de proveedor muestran el **proveedor dentro de la miniatura**, completo.
- Se quitó la línea gris bajo cada tarjeta que repetía el tipo de documento.
- El título del tipo va en una sola línea ("Acta de conformidad" ya no se monta sobre el dibujo).

## 9. Infraestructura

- **Sentry**, solo en producción y sin datos personales: sin usuario, IP, cookies, headers ni bodies. Las transacciones se nombran por ruta.
- **Pendiente:** configurar `VITE_SENTRY_DSN` en Vercel y volver a desplegar.

## Pendientes y avisos

- **PR #1 (facturas):** se mezcla con `main` sin conflicto.
- **PR #2 (Inicio):** conflicto en `src/modules/inicio/InicioPage.tsx`; el autor ya está avisado.
- **Al traer `main` a sus ramas**, correr `npm install`: hay una dependencia nueva (`@sentry/react`).
- **Sin probar en el navegador** (verificados solo con `npm run build`): fechas y remisión en Entrega, "Agregar fotos", "Trabajos realizados", la redacción de la garantía y los sellos del PDF.
