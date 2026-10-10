---
name: Infrasoft · Gestión de proyectos
description: Herramienta interna para cotizar, comprar, ejecutar, entregar y liquidar proyectos de infraestructura de telecomunicaciones.
colors:
  verde-infrasoft: "#82c11e"
  verde-obra: "#426311"
  verde-obra-hover: "#507b10"
  verde-obra-press: "#384f13"
  verde-brote: "#f4f9ea"
  verde-brote-hover: "#e5f2cd"
  verde-borde: "#cce59f"
  verde-claro-oscuro: "#96c83c"
  carbon: "#26292a"
  carbon-linea: "#3a3e3f"
  lienzo: "#f5f5f3"
  superficie: "#ffffff"
  gris-niebla: "#f7f7f7"
  gris-humo: "#efefef"
  gris-linea: "#e2e2e2"
  gris-borde: "#cdcdcd"
  gris-tenue: "#a3a3a3"
  gris-secundario: "#737373"
  gris-cuerpo: "#434343"
  gris-texto: "#2d2d2d"
  gris-titulo: "#1f1f1f"
  gris-noche: "#121212"
  ok: "#047857"
  ok-fondo: "#ecfdf5"
  alerta: "#b45309"
  alerta-fondo: "#fffbeb"
  peligro: "#b91c1c"
  peligro-fondo: "#fef2f2"
  info: "#075985"
  info-fondo: "#f0f9ff"
typography:
  headline:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
  title:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-compact:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.025em"
  number:
    fontFamily: "Fira Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "tnum"
  mono:
    fontFamily: "Fira Code, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.verde-obra}"
    textColor: "{colors.superficie}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.verde-obra-hover}"
  button-primary-active:
    backgroundColor: "{colors.verde-obra-press}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.gris-cuerpo}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.gris-niebla}"
  button-ghost:
    textColor: "{colors.gris-secundario}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.gris-humo}"
    textColor: "{colors.gris-titulo}"
  button-subtle:
    backgroundColor: "{colors.verde-brote}"
    textColor: "{colors.verde-obra}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-sm:
    typography: "{typography.body-compact}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.gris-titulo}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
  badge-neutral:
    backgroundColor: "{colors.gris-humo}"
    textColor: "{colors.gris-cuerpo}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-brand:
    backgroundColor: "{colors.verde-brote}"
    textColor: "{colors.verde-obra}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-ok:
    backgroundColor: "{colors.ok-fondo}"
    textColor: "{colors.ok}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-warn:
    backgroundColor: "{colors.alerta-fondo}"
    textColor: "{colors.alerta}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "{colors.peligro-fondo}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-sidebar:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.gris-borde}"
    width: "256px"
  nav-item-active:
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  modal:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.xl}"
  toast:
    backgroundColor: "{colors.gris-titulo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    width: "320px"
---

# Design System: Infrasoft · Gestión de proyectos

## Overview

**Creative North Star: "El Tablero de Obra"**

El sistema es el tablero donde gerencia ve el estado real de cada proyecto: qué se cotizó, qué se compró, qué se instaló y cuánto queda. Es una herramienta de trabajo, sobria pero cálida. El lienzo es un blanco hueso apenas tibio (no un gris frío), las superficies son blancas y planas, y el carbón de la barra lateral ancla la pantalla como el tablero físico ancla el cuarto técnico. El verde Infrasoft, tomado del logo, aparece solo donde algo avanza o se decide.

La densidad es alta y deliberada: tablas con cifras alineadas, tipografía de 13–14 px, controles de 32–36 px de alto. La jerarquía se construye con peso y gris, no con tamaño. Los números mandan: toda cifra usa dígitos tabulares y se alinea a la derecha para poder leerse en columna y rastrearse hasta sus ítems.

Los documentos imprimibles (cotización, orden de compra, remisión, informe de entrega) son la segunda cara del sistema: hojas tamaño carta con membrete, tipografía de 13 px y la misma paleta en versión sobria. El azul marino provisional de las primeras versiones quedó descartado; la marca es verde y gris.

**Key Characteristics:**
- Lienzo cálido (#f5f5f3) con superficies blancas planas separadas por bordes de 1 px.
- Barra lateral carbón como único bloque oscuro de la interfaz.
- Verde Obra para la acción principal; Verde Infrasoft brillante solo como marca y señal sobre fondo oscuro.
- Neutros grises puros, sin tinte azul.
- Fira Sans para todo; cifras tabulares siempre.
- Colores semánticos (verde esmeralda, ámbar, rojo, celeste) reservados para estado.

## Colors

Verde de marca sobre grises neutros puros, con un lienzo apenas cálido y una barra lateral carbón; el color fuera de eso solo comunica estado.

### Primary
- **Verde Infrasoft** (verde-infrasoft): el verde exacto del logo. Se usa en el logotipo, en el icono activo de la barra lateral (en su variante clara, verde-claro-oscuro) y en el anillo de foco. No alcanza contraste suficiente como texto sobre blanco: nunca se usa para texto ni para fondos de botón.
- **Verde Obra** (verde-obra): el verde de trabajo. Fondo del botón primario, texto de pestaña activa, texto de enlaces y coincidencias, paso completado del stepper. Su hover sube un tono (verde-obra-hover) y su estado presionado baja uno (verde-obra-press).
- **Verde Brote** (verde-brote, verde-brote-hover, verde-borde): fondos tenues de marca para insignias, botón sutil, contador de pestaña activa, avatar y selección de texto.

### Neutral
- **Lienzo** (lienzo): fondo de toda la aplicación. Su calidez leve es lo que separa este sistema de un panel administrativo genérico.
- **Superficie** (superficie): tarjetas, tablas, modales, encabezado superior, hoja carta.
- **Carbón** (carbon, carbon-linea): barra lateral y sus divisores. Es el único fondo oscuro de la interfaz.
- **Gris Niebla / Gris Humo** (gris-niebla, gris-humo): hover de filas y botones, pies de modal, fondos de insignia neutra y estados vacíos.
- **Gris Línea / Gris Borde** (gris-linea, gris-borde): divisores de tarjeta y tabla (línea) y bordes de campos y botón secundario (borde).
- **Gris Tenue** (gris-tenue): placeholders, prefijos de campo numérico, pasos pendientes.
- **Gris Secundario** (gris-secundario): descripciones, encabezados de tabla, etiquetas de dato.
- **Gris Cuerpo / Gris Texto** (gris-cuerpo, gris-texto): texto de etiquetas de formulario y texto base del cuerpo.
- **Gris Título** (gris-titulo): títulos, valores destacados, fondo de toasts y tooltips.

### Semánticos
- **Ok** (ok, ok-fondo): aprobado, pagado, cerrado, cifras favorables.
- **Alerta** (alerta, alerta-fondo): por vencer, sin asignar, diferencias que revisar, etapa de ejecución.
- **Peligro** (peligro, peligro-fondo): vencido, rechazado, sobrecosto, acciones destructivas.
- **Info** (info, info-fondo): etapa de cotización, cotización enviada, avisos neutros.

### Named Rules
**The Verde Que Avanza Rule.** El verde marca lo que avanza o lo que se decide: la acción principal, la pestaña activa, el paso cumplido. Nunca es decoración ni relleno de áreas grandes.

**The Gris Puro Rule.** Los neutros son grises sin tinte. No introducir grises azulados (slate de Tailwind por defecto) ni azul marino; el único tinte permitido es el calor leve del lienzo.

**The Semáforo Rule.** Esmeralda, ámbar, rojo y celeste existen solo para estado. Un elemento coloreado con ellos debe significar algo que el usuario pueda nombrar.

## Typography

**Display Font:** Fira Sans (con ui-sans-serif, system-ui)
**Body Font:** Fira Sans (con ui-sans-serif, system-ui)
**Label/Mono Font:** Fira Code (con ui-monospace), para códigos y seriales

**Character:** Fira Sans es humanista y técnica a la vez: legible en tablas densas, con números claros y una voz de ingeniería sin frialdad. Una sola familia en cuatro pesos (400, 500, 600, 700) sostiene toda la jerarquía.

### Hierarchy
- **Headline** (600, 20 px en móvil y 24 px desde sm): título de página, uno por vista.
- **Title** (600, 15–16 px): títulos de tarjeta (15 px) y de modal (16 px); 18 px en el panel lateral.
- **Body** (400, 14 px, line-height 1.43): texto base, celdas de tabla, campos.
- **Body compacto** (400–500, 13 px): descripciones bajo títulos, etiquetas de formulario, botones pequeños, cuerpo de documentos carta.
- **Label** (600, 12 px, tracking 0.025em, MAYÚSCULAS): encabezados de tabla y antetítulos de página. 11 px en el stepper ("ETAPA 3").
- **Number** (600, 20 px, cifras tabulares): valores de indicadores (Stat).
- **Micro** (10 px): solo en membrete y pie de documentos imprimibles.

### Named Rules
**The Cifra Tabular Rule.** Toda cifra (dinero, cantidades, porcentajes, contadores) lleva dígitos tabulares y, en columnas, alineación a la derecha. Un número que baila no se puede auditar.

**The Peso Antes Que Tamaño Rule.** La jerarquía se gana con peso y gris, no subiendo tamaños. Nada en la aplicación supera los 24 px salvo el logotipo.

## Layout

Aplicación de dos zonas: barra lateral fija a la izquierda (256 px, o 72 px contraída) y área principal con encabezado pegajoso de 64 px que contiene el buscador global. El contenido vive en un contenedor de hasta 1600 px con márgenes laterales de 16 / 24 / 32 px (móvil / sm / lg) y 24 px de padding vertical.

El ritmo de espaciado sigue la escala de 4 px. Tarjetas con padding horizontal de 20 px y encabezado de 14 px vertical; celdas de tabla de 12 × 10 px; separación entre controles de 8 px; entre bloques de página, 24 px.

Por debajo de lg (1024 px) la barra lateral se convierte en cajón deslizable desde un botón de menú, y el logotipo compacto aparece en el encabezado. Las pestañas se desplazan horizontalmente y mantienen visible la activa. Los modales se anclan abajo como hoja en móvil y se centran desde sm. La bitácora de obra debe funcionar a 375 px de ancho.

Los documentos imprimibles usan una hoja carta (8,5 × 11 in) centrada sobre un fondo gris, con márgenes internos de 0,8 in; al imprimir se eliminan fondo, sombra y controles.

## Elevation & Depth

Plano con bordes. Las superficies en reposo se separan del lienzo con un borde de 1 px gris línea y, como mucho, una sombra mínima de contacto (`0 1px 2px rgb(0 0 0 / 0.05)`). La sombra real solo aparece en capas que flotan sobre la página: menú del buscador, tooltip, toast, modal y panel lateral, y crece con la distancia de la capa.

### Shadow Vocabulary
- **Contacto** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): tarjetas, campos, botón secundario.
- **Apoyo** (`0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): botón primario y segmento activo del toggle.
- **Flotante** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): toasts, tooltips, hoja carta en pantalla.
- **Menú** (`0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): resultados del buscador global.
- **Capa** (`0 25px 50px -12px rgb(0 0 0 / 0.25)`): modal y panel lateral, sobre un velo de gris noche al 40–50 %.

### Named Rules
**The Plano En Reposo Rule.** Lo que está en la página es plano y se separa con bordes. Solo lo que flota encima tiene sombra.

## Shapes

Esquinas suaves y contenidas. 6 px es la forma de trabajo (botones, campos, alertas, ítems de navegación); 8 px para contenedores (tarjetas, menú del buscador, toasts); 12 px solo para modales; forma de píldora para insignias, contadores, avatar y los círculos del stepper. Los bordes son siempre de 1 px; el único trazo de 2 px es el subrayado de la pestaña activa y el anillo de foco.

## Components

### Buttons
Firmes y contenidos: compactos, con un solo primario verde por zona de decisión.
- **Shape:** esquinas suaves (6 px); alto de 36 px (32 px en tamaño pequeño, texto de 13 px).
- **Primary:** fondo Verde Obra, texto blanco, peso 500, sombra de apoyo. Hover un tono más claro, presionado un tono más oscuro.
- **Secondary (por defecto):** blanco con borde gris borde y texto gris cuerpo; hover a gris niebla con borde más oscuro.
- **Ghost:** sin fondo, texto gris secundario; hover a gris humo.
- **Subtle:** fondo Verde Brote con texto Verde Obra, para acciones de marca secundarias.
- **Danger:** blanco con borde y texto rojo; nunca un botón rojo sólido.
- **Hover / Focus:** transición de color de 150 ms; foco con anillo de 2 px Verde Infrasoft desplazado 2 px. Deshabilitado al 45 % de opacidad.
- **Icon button:** 32 × 32 px, icono de 16 px gris secundario, con etiqueta accesible obligatoria.

### Chips (Badges)
- **Style:** píldora, 12 px peso 500, fondo tenue del tono con anillo interior de 1 px del mismo tono; punto opcional de 6 px en el color del texto.
- **State:** seis tonos: neutral, marca, ok, alerta, peligro, info. Las etapas del proyecto usan: Cotización info, Compras marca, Ejecución alerta, Entrega marca, Cierre ok.

### Cards / Containers
- **Corner Style:** 8 px.
- **Background:** superficie blanca sobre el lienzo.
- **Shadow Strategy:** contacto (ver Elevation & Depth).
- **Border:** 1 px gris línea; el encabezado de tarjeta se separa con otro borde inferior.
- **Internal Padding:** 20 px horizontal, 14 px vertical en el encabezado.

### Inputs / Fields
- **Style:** 36 px de alto, borde gris borde de 1 px, fondo blanco, esquinas de 6 px, sombra de contacto. Etiqueta encima en 13 px peso 500; "(opcional)" en gris tenue.
- **Focus:** borde Verde Infrasoft con halo de 2 px del mismo verde al 20 %.
- **Numeric:** formato colombiano (1.234.567,89), cifras tabulares alineadas a la derecha, prefijo "$" o sufijo "%" en gris tenue dentro del campo.
- **Error / Disabled:** mensaje de 12 px en rojo bajo el campo; deshabilitado en gris niebla con texto gris secundario.

### Navigation
- **Barra lateral:** fondo carbón, logotipo centrado en una franja de 64 px. Ítems de 14 px peso 500 en gris borde; hover con velo blanco al 6 %; activo con velo blanco al 10 %, texto blanco e icono en verde claro. Contador ámbar para facturas sin asignar. Contraída a 72 px muestra solo iconos con tooltip oscuro.
- **Pestañas:** texto de 14 px peso 500 con subrayado de 2 px; activa en Verde Obra con contador en Verde Brote.
- **Móvil:** cajón de 288 px que entra desde la izquierda sobre velo oscuro.

### Stepper de etapas
Firma del sistema: las cinco etapas del proyecto como círculos de 28 px unidos por líneas de 2 px. Completada: círculo Verde Obra con check blanco. Actual: círculo blanco con anillo Verde Obra y antetítulo "ETAPA N" en verde. Pendiente: anillo gris borde y número gris tenue. El cierre completado pasa a esmeralda. Los nombres se ocultan por debajo de md.

### Hoja carta
Firma documental: cotización, orden de compra, remisión e informe se presentan como hoja carta blanca con membrete (logotipo, NIT, dirección), cuerpo de 13 px y pie de 10 px. Una barra superior pegajosa ofrece volver y "Descargar PDF" como botón primario; al imprimir solo queda la hoja.

## Do's and Don'ts

### Do:
- **Do** usar Verde Obra (#426311) para el botón primario y el texto de acción; Verde Infrasoft (#82c11e) solo para marca, foco y señales sobre carbón.
- **Do** aplicar cifras tabulares a todo número y alinear a la derecha las columnas de dinero y cantidades.
- **Do** separar superficies con bordes de 1 px y reservar la sombra para capas flotantes.
- **Do** mantener un solo botón primario por zona de decisión; el resto, secundario o ghost.
- **Do** usar los tonos semánticos solo cuando expresen un estado que el usuario pueda nombrar.
- **Do** verificar que la bitácora de obra y los modales funcionen a 375 px de ancho.

### Don't:
- **Don't** usar azul marino ni grises azulados; el azul provisional quedó fuera de la marca.
- **Don't** usar Verde Infrasoft como color de texto o fondo de botón sobre blanco: no alcanza contraste.
- **Don't** mostrar costos, proveedores ni utilidad en la vista cliente ni en documentos dirigidos al cliente; esas columnas y bloques no existen en su versión.
- **Don't** usar botones rojos sólidos; el peligro es borde y texto rojo sobre blanco.
- **Don't** subir títulos por encima de 24 px dentro de la aplicación.

## Excepciones de tamaño de letra

Los documentos imprimibles (cotización, OC, remisión, informe y acta en PDF, y sus vistas previas en el visor) y el logotipo usan tamaños de 9 a 12 px y 22 a 34 px fuera de la escala de la interfaz, porque replican hojas tamaño carta y la marca. La interfaz de la aplicación no usa tamaños por debajo de 12 px. Archivos: `src/components/Documento.tsx`, `src/components/Marca.tsx`, `src/components/VisorDocumento.tsx`, `src/modules/*/…PdfPage.tsx`, `src/modules/entrega/InformeEntregaPage.tsx`, `src/modules/entrega/RemisionPage.tsx`.
