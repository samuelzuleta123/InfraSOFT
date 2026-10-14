# Auditoría: flujo formulario → precotización → cotización → cuenta de cobro
**Fecha:** 2026-10-14 · **Rama:** main (1bddcd6) · **Alcance:** 18 archivos

Archivos revisados: `store/useStore.ts`, `types.ts`, `lib/calc.ts`, `lib/compras.ts`, `lib/observaciones.ts`, `lib/format.ts`, `modules/proyectos/{NuevoProyectoModal,LevantamientoTab,ProyectoDetalle,AvanzarEtapaModal}.tsx`, `modules/cotizaciones/{CotizadorTab,TablaSeccion,AgregarModales,ResumenPanel,CotizacionPdfPage}.tsx`, `modules/compras/ComprasTab.tsx`, `modules/entrega/{EntregaTab,CierreTab}.tsx`.

**Vara de medir.** El repo no tiene `CLAUDE.md` ni `docs/`. Tomé los invariantes de `PRODUCT.md` y `README.md` (principios 1 a 5, "Reglas que respeta el mockup"). El objetivo nuevo me lo dio el usuario en la conversación: *llenar un solo formulario y que precotización, cotización y cuenta de cobro se generen solas, con el mínimo de pasos.* Ese objetivo todavía no aparece en ningún documento del repo.

**Auditorías previas.** `.impeccable/critique/*.md` son críticas de diseño visual (29/40). No repito sus hallazgos; solo cito los que afectan al flujo.

---

## Resumen ejecutivo

El mockup está **bien hecho como sistema de gestión por etapas**. Los cálculos cuadran (`npm run verificar` ✔), el typecheck está limpio, la versión aprobada manda sobre compras y cierre, y lo interno no llega al cliente. Pero **no implementa el flujo nuevo**: no existen la *precotización* ni la *cuenta de cobro*. El único documento de cobro es el registro de una factura del POS, y solo se puede hacer al final, después del acta firmada. Además, los mismos datos (valor, forma de pago, garantía, alcance) se escriben varias veces en pantallas distintas. Hoy, ir de un proyecto nuevo a un documento de cobro toma **unas 35 acciones en 4 pestañas**, más ~7 por cada ítem cotizado, y no se puede cobrar antes de la entrega.

---

## Recorrido actual (camino feliz, contado en el código)

| # | Pantalla | Acciones del usuario | Qué produce |
|---|---|---|---|
| 1 | Nuevo proyecto (modal de 3 pasos) | cliente → Siguiente → nombre, sede → Siguiente → fecha, racks, medidas, ruta, fotos → Crear | Proyecto en etapa 1 + COT v1 vacía |
| 2 | Cotización | por **cada** ítem: Agregar ítem → buscar → Agregar → Listo → cantidad → V. unit. MO → proveedor (~7) | Ítems |
| 3 | Cotización | 4 otros costos (cant. × valor), % utilidad, % ajustes, precio final, alcance, tiempo de entrega, condiciones | Precio |
| 4 | Vista previa PDF | nivel de detalle → Descargar | PDF para el cliente |
| 5 | Compras | Marcar como enviada → El cliente aprobó → Confirmar | Etapa 2 |
| 6 | Compras | número OC cliente, valor, adjunto → Registrar OC | OC del cliente |
| 7 | Compras | Generar órdenes → Confirmar | OC a proveedores |
| 8 | Avanzar etapa ×2, Ejecución, Entrega | … acta firmada (obligatoria) | Etapas 3 y 4 |
| 9 | Cierre | número FE, forma de pago, fecha, vencimiento, IVA → Registrar | "Cobro" (solo registro del POS) |

---

## Hallazgos

### Bloqueantes para el flujo nuevo

**B1. No existe la precotización.**
`types.ts:79` define `EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'`. No hay ningún tipo, estado ni pantalla de precotización (grep de `precotiz` = 0 resultados).
*Escenario:* el comercial quiere enviar un estimado rápido (por puntos o por metros, sin proveedor por ítem) antes de la visita técnica. Hoy tiene que armar la cotización completa ítem por ítem.
*Propuesta mínima:* definir qué es una precotización para Infrasoft (ver preguntas abiertas). La opción más barata: un estado o tipo `precotizacion` en `VersionCotizacion` que se arme desde kits × cantidad (ya existe `AgregarKitModal`, `AgregarModales.tsx:107`) y que al aprobarse se convierta en v1 de la cotización.

**B2. No existe la cuenta de cobro y el cobro solo se puede registrar al final.**
`FacturaCliente` (`types.ts:240`) es lo único relacionado con cobro. `CierreTab.tsx:137` deshabilita el registro si falta `entrega.actaFirmada`. No hay cobros parciales, anticipos ni varios documentos de cobro por proyecto (`Proyecto.facturaCliente` es un solo objeto, `types.ts:268`). Al guardar se fuerza `p.etapa = 5` (`CierreTab.tsx:42`).
*Escenario:* un proyecto con 50 % de anticipo al aprobar. No hay dónde generar ni registrar ese cobro, y si se registrara la factura, el proyecto se cerraría.
*Propuesta mínima:* modelar `cobros: CuentaCobro[]` en `Proyecto` (consecutivo, concepto anticipo/avance/saldo, % o valor, fecha, estado) con su propio PDF, generado desde la versión aprobada (`versionVigente`) y desacoplado de `etapa`. La factura del POS queda como un registro más, asociado a un cobro.

**B3. El formulario inicial no alimenta la cotización.**
El levantamiento guarda las medidas como texto libre (`{ etiqueta, valor }`, `types.ts:212`, `NuevoProyectoModal.tsx:157-160`). Ninguna parte del código las convierte en cantidades: el cotizador arranca con `Sección 1` vacía (`useStore.ts:151`).
*Escenario:* en la visita se anotan "48 m de tubería" y "24 puntos". En el cotizador hay que volver a escribir 48 y 24 a mano, en otro ítem.
*Propuesta mínima:* en el paso 3 del formulario, que las medidas se elijan por tipo (kit o material + cantidad numérica) en vez de texto libre, y que al crear el proyecto se llame a la misma lógica de `AgregarKitModal` para poblar la v1. Así el formulario deja la cotización armada.

**B4. El levantamiento no se puede editar ni agregar después.**
`LevantamientoTab.tsx` es de solo lectura. Si se usa "Crear sin levantamiento" (`NuevoProyectoModal.tsx:67`), el estado vacío dice "Registra las medidas…" pero no tiene ningún botón para hacerlo. Además, "Crear sin levantamiento" descarta lo que ya se haya escrito en el paso 3.
*Escenario:* se crea el proyecto en la oficina y la visita es al día siguiente. No hay manera de cargar la visita.
*Propuesta mínima:* reutilizar el paso 3 del modal como formulario editable dentro de la pestaña.

### Observaciones (datos que se escriben más de una vez)

**O1. La forma de pago se escribe 3 veces.** Como texto en "Condiciones comerciales" (`CotizadorTab.tsx:243`), otra vez en el select de la factura (`CierreTab.tsx:68`), y el vencimiento hay que calcularlo a mano: el valor inicial es siempre +30 días (`CierreTab.tsx:35`) y no cambia al elegir "Crédito 60 días". *Propuesta:* guardar `formaPago` en el `Cliente` o en la cotización, y calcular el vencimiento a partir de ella.

**O2. La garantía se escribe 2 veces.** En condiciones de la cotización (datos demo: "Garantía: 1 año sobre la instalación") y otra vez en `entrega.garantia` (`EntregaTab.tsx:97`), que es la que usa el texto del POS. *Propuesta:* un campo estructurado en la cotización que pase a la entrega.

**O3. Alcance, tiempo y condiciones arrancan vacíos en cada proyecto** (`useStore.ts:142-144`), aunque en los datos de ejemplo las condiciones son casi idénticas (`proyectos.ts:226`, `demo.ts:163`). *Propuesta:* plantilla por defecto (o la del último proyecto del mismo cliente).

**O4. Avanzar de etapa se hace a mano aunque el sistema ya sabe que se cumplieron los requisitos.** Aprobar sí pasa a la etapa 2 (`useStore.ts:283`), pero para pasar a la 3 hay que entrar al modal de avance aunque la OC del cliente y las OC a proveedores ya existan (`AvanzarEtapaModal.tsx:25-30`). *Propuesta:* avanzar automáticamente cuando se cumplan los chequeos de la etapa, con la opción de deshacer que ya existe.

**O5. Registrar la OC del cliente salta la aprobación.** `ComprasTab.tsx:152` pone `etapa = 2` aunque la cotización siga en borrador. En cambio, el modal de avance exige "Cotización enviada" como obligatoria (`AvanzarEtapaModal.tsx:24`). Son dos reglas distintas para lo mismo. *Propuesta:* que registrar la OC del cliente marque la versión como aprobada (en la práctica, que llegue la OC *es* la aprobación) o que respete el mismo chequeo. Lo primero además ahorra 3 clics del paso 5.

**O6. "Volver a generar" OC desasocia en silencio las facturas de proveedor.** `useStore.ts:294` pone `ocId = null` en las facturas cuya OC desaparece. El aviso del modal (`ComprasTab.tsx:397`) habla de ediciones, pero no menciona las facturas ya asociadas. Cada regeneración además consume consecutivos nuevos (`useStore.ts:290`). *Propuesta:* indicar en el aviso cuántas facturas quedarán sin asignar, o bloquear la regeneración si alguna OC ya tiene factura.

**O7. Agregar un ítem cuesta ~7 interacciones.** El modal se cierra con "Listo", y la cantidad y la mano de obra se ponen después, en la tabla. Si el material tiene más de un proveedor queda "Sin asignar" (`AgregarModales.tsx:12`). *Propuesta:* pedir la cantidad en el mismo modal y preseleccionar el proveedor con el menor precio neto, que el modal ya calcula (`AgregarModales.tsx:81`).

**O8. El precio unitario del PDF puede no cuadrar con el total de la línea.** `preciosCliente` reparte el total y calcula `unitario = total / cantidad` sin redondear (`calc.ts:111`). El PDF muestra `money(unitario)` redondeado (`CotizacionPdfPage.tsx:126`), así que cantidad × unitario impreso puede diferir del total impreso en algunos pesos. Va contra el principio 1 ("los números mandan"). *Propuesta:* redondear primero el unitario y derivar el total de la línea a partir de él, absorbiendo el residuo en la última línea como ya se hace.

**O9. Lint:** 3 avisos `jsx-key` en `ComprasTab.tsx:197-198` (arreglo de `DL`). Cosmético.

### Lo que funciona bien (y conviene conservar en el flujo nuevo)

- Los cálculos se derivan siempre y nunca se guardan (`calc.ts`), con un script de verificación contra datos reales que pasa.
- Versionado: una versión aprobada o rechazada queda de solo lectura y los cambios van en una nueva versión. `versionVigente` hace que compras y cierre usen la aprobada.
- Las OC por proveedor salen solas de la cotización (`lib/compras.ts`), con vista previa, comparación contra lo cotizado y deshacer. **Es justo el patrón "un dato alimenta varios documentos" que pide el flujo nuevo**, y conviene replicarlo para la cuenta de cobro.
- Las alertas de diferencia entre OC del cliente y lo cotizado, y entre factura y lo cotizado, están bien.
- El texto de observaciones para el POS se arma solo.
- Al crear el proyecto se navega directo a la cotización.

### Desviaciones conscientes confirmadas

- Sin facturación electrónica, DIAN ni lectura de XML (`PRODUCT.md`). La cuenta de cobro propuesta en B2 no choca con esto: es un documento propio, no una factura electrónica.
- Utilidad, ajustes e IVA siempre los digita el usuario; vacíos valen 0. Sigue vigente: las plantillas de O1 y O3 son de texto y condiciones, no de porcentajes.
- Fecha fija `HOY = 2026-10-10` (`format.ts:34`) para que la demo sea reproducible.
- La edición del cotizador en celular está deshabilitada a propósito (`TablaSeccion.tsx:312`).

---

## Checklist de invariantes

| Invariante | Estado | Nota |
|---|---|---|
| Totales derivados, nada precalculado | ✅ | `calc.ts`; `verificar` pasa |
| % que el usuario no digitó nunca se muestra | ✅ | |
| Lo interno no llega al cliente | ✅ | `preciosCliente`, vista cliente y PDF |
| Un proyecto, un hilo (documentos conectados) | ⚠️ | Hay OC; faltan precotización y cuenta de cobro (B1, B2) |
| Rápido para gerencia / mínimos pasos | ❌ | B3, O1 a O5, O7 |
| Cada dato se captura una sola vez | ❌ | O1, O2, B3 |
| Reglas de etapa coherentes entre pantallas | ⚠️ | O5 |
| Operaciones multipaso sin estado inconsistente | ⚠️ | O6 |
| `switch` sobre enums con todos los casos | ✅ | `chequeosEtapa` cubre 2 a 5; la 1 no tiene destino |
| Sin `any` ni `console.log` | ✅ | tsc limpio |
| Persistencia, auth, secretos | ➖ | Mockup sin backend (documentado) |

## Cobertura de tests

Solo existe `scripts/verificar-totales.ts`, que valida los totales del cotizador de los proyectos 1, 2 y 3. No hay pruebas de la generación de OC, del cambio de estados, del avance de etapa, de la liquidación ni del reparto de precios al cliente (O8). El flujo nuevo debería venir con una verificación del tipo "formulario → v1 → cuenta de cobro" que compruebe que todos los valores cuadran entre documentos.

## Preguntas abiertas (necesarias antes de diseñar)

1. **¿Qué es una precotización para Infrasoft?** ¿Un estimado por kits o puntos sin proveedor, antes de la visita? ¿Se envía al cliente? ¿Tiene consecutivo propio o es la v0 de la COT?
2. **¿Qué es la cuenta de cobro?** ¿Reemplaza la factura del POS en algunos clientes o la acompaña? ¿Hay anticipos o cobros por avance de obra? ¿Cuántas por proyecto?
3. **¿Cuál es "el formulario"?** ¿El de Nuevo proyecto ampliado, o uno nuevo que reemplace el cotizador por ítems?
4. **¿Qué tanto se puede automatizar el precio?** El principio "no se asumen porcentajes" impide prellenar la utilidad. ¿Se acepta un % por defecto por cliente o tipo de proyecto que el usuario confirme?

## Requisitos aclarados por el usuario (2026-10-14)

Las respuestas resuelven las preguntas 1 y 2 y cambian B1, B2 y O8:

| Tema | Decisión | Qué hay hoy | Qué falta |
|---|---|---|---|
| **Precotización** | Estimado rápido antes de la cotización. Lo esencial es la doble vista: el cliente nunca ve a quién se le compra ni a qué costo. **No se usan precios fijos del catálogo**: el mercado es volátil y siempre hay que pedir precio a los proveedores. | La doble vista **ya está**: interruptor Vista cliente (`CotizadorTab.tsx:80`), PDF cliente sin costos (`CotizacionPdfPage.tsx`), reparto proporcional (`calc.ts:100`). | El estimado rápido como documento propio, marcado "Precotización". Se descarta la idea de precargar con el menor precio del catálogo (O7 queda solo en "pedir la cantidad en el modal"). |
| **Trazabilidad de precios** | Histórico de lo que **realmente** cobró cada proveedor en cada proyecto, para comparar ("hoy 5, mañana 20"). | Parcial: `FichaMaterial.tsx` tiene la pestaña *Historial* (cambios del precio de lista del catálogo, con su variación) y *Uso en proyectos* (precio **cotizado** por proyecto, sin fecha). | (a) El precio **facturado**: `LineaFactura` (`types.ts:152`) no tiene `materialId`, así que lo que cobró el proveedor no se puede rastrear al material. (b) La fecha y el proveedor en *Uso en proyectos*. (c) Un aviso en el cotizador cuando el precio digitado se aleja del último precio comprado. |
| **Cuenta de cobro** | Se genera **cuando el cliente aprueba el proyecto**, con la plantilla de los documentos que ya usan. | No existe (B2). | Generarla automáticamente al aprobar, desde la versión aprobada, con consecutivo y PDF. **Falta la plantilla actual**: el usuario debe compartirla. |
| **Imprimir** | Todo documento debe poder imprimirse. En el mockup puede ser un botón solo visual o funcional. | Se imprimen: PDF del cliente, OC, informe de entrega, remisión. | Versión interna de la cotización (con proveedor, costo y utilidad), precotización, cuenta de cobro, liquidación. Con `window.print()` y una hoja carta, como los que ya existen, el costo es bajo, así que conviene hacerlos funcionales. |
| **Cuadre de valores** | Cero descuadre entre documentos; precisión de 3 decimales. | O8: el unitario se muestra redondeado al peso y no cuadra con el total. | Calcular y mostrar unitarios con 3 decimales y derivar todos los totales de esos mismos valores. Además, que cotización, cuenta de cobro, OC del cliente y factura salgan de **un solo cálculo** (`preciosCliente`) para que no se descuadren entre sí. **Choca con la regla de `PRODUCT.md`** "pesos sin decimales": hay que actualizar esa regla (¿3 decimales en unitarios y totales al peso?). |

Orden de trabajo revisado: cuadre a 3 decimales (base de todo lo demás) → precotización con doble vista → cuenta de cobro al aprobar (requiere la plantilla) → trazabilidad del precio facturado → botones de imprimir faltantes → B3, B4 y O1 a O6.

## Veredicto

**REQUIERE CORRECCIÓN** frente al objetivo del flujo nuevo (B1 a B4). Como mockup del flujo actual por etapas, está **SANO CON OBSERVACIONES**.

Orden de trabajo sugerido: responder las preguntas abiertas → B3 + B4 (el formulario alimenta la v1) → B2 (cuenta de cobro desacoplada de la etapa) → B1 (precotización, que depende de las respuestas 1 y 3) → O5, O1, O2, O7 (menos pasos) → O6, O8.

---

## Actualización 2026-10-14: decisiones y cambios aplicados

**Cancelado por el usuario: cuenta de cobro (B2).** La empresa la maneja por fuera con sus contadores. No se implementa en el sistema. B2 y su fila en "Requisitos aclarados" quedan sin efecto.

**Material de referencia recibido.** *Propuesta instalación F.O. Subestación Eléctrica* es la hoja interna del Excel del cotizador, con celdas en `#¡REF!`. Sus cifras (costo $5.163.000, cotizado $7.200.000, utilidad $1.902.762) coinciden con las que calcula el mockup para el proyecto 1. La factura Ingram 1004401950 ya estaba en los datos de prueba.

**Aplicado:**

| Hallazgo | Cambio | Dónde |
|---|---|---|
| O8: cuadre de valores | Unitarios con hasta 3 decimales, total de línea = cantidad × unitario redondeado al peso. El residuo del reparto lo absorbe una sola línea, que llega a un total exacto. El precio neto del catálogo (lista − % descuento) también va a 3 decimales. **Antes: 79 de 132 líneas impresas no cuadraban. Ahora: 0.** | `lib/calc.ts`, `lib/format.ts` (`r3`, `moneyUnit`), campos de unitario en cotizador y OC |
| Verificación | `npm run verificar` comprueba el cuadre en las 15 versiones de cotización y en 2.000 cotizaciones aleatorias | `scripts/verificar-totales.ts` |
| B1 (parcial): precotización | Variante del PDF del cliente: título "Precotización", nota de valores sujetos a confirmación con proveedores y sin firma de aceptación. Botón en el cotizador mientras la versión está en borrador | `CotizacionPdfPage.tsx`, `CotizadorTab.tsx` |
| Imprimibles | Cotización interna (proveedor, MO, material, otros costos, utilidad; marcada "no entregar al cliente") y liquidación del proyecto. La liquidación también aparece en Documentos | `CotizacionInternaPage.tsx`, `LiquidacionPage.tsx`, `App.tsx`, `lib/expediente.ts` |
| Regla de moneda | `PRODUCT.md` y `README.md` documentan los 3 decimales en unitarios | — |

**Segunda tanda aplicada:**

| Hallazgo | Cambio | Dónde |
|---|---|---|
| Trazabilidad del precio facturado | Histórico derivado sin campos nuevos: factura → línea de OC (mismo emparejamiento que la comparación) → ítem de la cotización → material. Con los datos de demo salen 74 compras de 50 materiales; 3 facturas cobraron más que la OC. Pestaña **Compras reales** en la ficha del material (proveedor, proyecto, factura, variación frente a la compra anterior y precio de OC si no coincide). En el cotizador, "Última compra" debajo del proveedor de cada ítem, resaltada al pasar el 10 % (`UMBRAL_VARIACION_PRECIO`) y con alerta arriba | `lib/historico.ts`, `useHistoricoCompras` en `store/useStore.ts`, `FichaMaterial.tsx`, `TablaSeccion.tsx`, `CotizadorTab.tsx`, `ComparacionOC.tsx` |
| B4: levantamiento no editable | Botón **Editar** y **Registrar levantamiento** en la pestaña. Formulario compartido con Nuevo proyecto, que ahora incluye el campo Observaciones | `FormLevantamiento.tsx`, `LevantamientoTab.tsx`, `NuevoProyectoModal.tsx` |

Límite conocido: el emparejamiento factura ↔ OC es por descripción, igual que la comparación existente. Una factura cuya descripción no se parezca a la de la OC no entra al histórico.

**Pendiente:** B3 (el formulario alimenta la v1), O1 a O7.

**Correcciones del code review (2026-10-14):**

- *B1, descuadre silencioso:* el residuo se reparte entre varias líneas. Si aun así no cuadra, `preciosCliente` devuelve `cuadra: false`, el cotizador ofrece el precio más cercano que sí cuadra (`precioCuadrable`, a 1 o 2 pesos) y el PDF muestra un aviso que no se imprime.
- *B2, decimales con punto:* `parseNumero` toma el punto como decimal salvo que tenga forma exacta de miles.
- *Observaciones:* histórico calculado una sola vez por cotizador; "Última compra" oculta en versiones bloqueadas; otros costos redondeados por línea; variación protegida ante precio 0; estado legible en la cotización interna; se pueden quitar fotos del levantamiento (y salen también del informe de entrega).
- *`verificar`:* cubre cantidades de más de 1.000 unidades (30 de las 2.000 pruebas necesitan el precio sugerido), la lectura de números y el histórico.
