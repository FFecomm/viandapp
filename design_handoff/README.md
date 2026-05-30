# Handoff: ViandApp

App web **mobile-first** para gestionar el servicio de viandas (almuerzos) de un colegio primario en Argentina. Usuarios: una operadora que toma pedidos por WhatsApp, una encargada de salón que organiza la entrega, y un administrativo que lleva la caja. Tres roles, lenguaje conversacional argentino, mucho aire visual, una acción primaria por pantalla.

---

## About the design files

Los archivos de este bundle son **referencias de diseño hechas en HTML + React (Babel in-browser)** — prototipos que muestran el aspecto y el comportamiento deseados. **No son código de producción** para copiar tal cual.

Tu tarea es **recrear estos diseños en el codebase de destino** usando las convenciones del proyecto (React + TypeScript + Tailwind / shadcn-ui, o lo que aplique). Si todavía no hay framework elegido, recomendamos:

- **Next.js (App Router) + TypeScript** para el web app
- **Tailwind CSS** con los tokens del § Design Tokens cargados como theme extension
- **lucide-react** para iconos (los SVGs custom del prototipo siguen ese estilo)
- **Inter** vía `next/font/google`

## Fidelity

**High-fidelity (hi-fi).** Colores, tipografía, spacing, copy y comportamientos son finales y deben replicarse pixel-perfect, adaptados a los componentes/librerías del codebase.

---

## Design tokens

### Colores

| Token              | Hex        | Uso                                            |
|--------------------|-----------|------------------------------------------------|
| `--va-blue`        | `#378ADD` | Acento primario, CTAs, links, estado activo    |
| `--va-blue-50`     | `#E6F1FB` | Fondo de tarjeta seleccionada, badges suaves   |
| `--va-blue-100`    | `#C9E0F5` | Bordes suaves                                  |
| `--va-green`       | `#1D9E75` | Confirmado, pagado, recargas de crédito        |
| `--va-green-50`    | `#E4F5EE` | Fondo de stats positivos                       |
| `--va-yellow`      | `#FAEEDA` | Fondo "agregado hoy", chips amarillas          |
| `--va-yellow-ink`  | `#8A6A1F` | Texto sobre fondo amarillo                     |
| `--va-red`         | `#FCEBEB` | Fondo de deudas                                |
| `--va-red-ink`     | `#C0392B` | Texto/monto en deuda                           |
| `--va-violet`      | `#534AB7` | Crédito a favor (viandas prepagas)             |
| `--va-violet-50`   | `#ECEAF8` | Fondo de tarjetas/avisos sobre crédito         |
| `--va-ink`         | `#1A1D21` | Texto primario                                 |
| `--va-ink-2`       | `#4B5158` | Texto secundario                               |
| `--va-ink-3`       | `#8A9099` | Texto terciario / placeholders                 |
| `--va-line`        | `#E8EAED` | Borde por defecto                              |
| `--va-line-2`      | `#F1F2F4` | Borde sutil, separadores                       |
| `--va-bg`          | `#FFFFFF` | Fondo de pantalla                              |
| `--va-surface`     | `#FAFAFB` | Fondo de superficies elevadas/desktop          |

Color de alerta naranja (pendientes): `#E0851F` con fondo `#FDF2E0`.

### Tipografía

- **Familia**: `Inter` (Google Fonts, pesos 400/500/600/700) con fallback a `-apple-system, "Segoe UI", system-ui, sans-serif`.
- **Features**: `font-feature-settings: "ss01", "cv11";`

Escala usada en el set:

| Rol                 | Size  | Weight | Letter-spacing | Notas             |
|---------------------|-------|--------|----------------|-------------------|
| Display (total caja)| 56–64 | 700    | -1.6 a -2.5    | line-height 1     |
| H1 pantalla         | 30    | 700    | -0.6           | título de paso    |
| H2 sección          | 24    | 700    | -0.5           | "Hola, Laura"     |
| Subtítulo grande    | 18    | 700    | -0.2           |                   |
| Card title          | 16    | 600–700| -0.2           |                   |
| Body                | 15–16 | 500    | -0.2 / 0       |                   |
| Meta / secondary    | 13–14 | 500    | 0              | color ink-3       |
| Eyebrow / uppercase | 11–13 | 600–700| 0.3 a 0.6      | uppercase         |
| Tab label           | 11    | 500–600| -0.1           |                   |

### Radii

| Token         | Valor | Uso                                  |
|---------------|-------|--------------------------------------|
| `--va-r-card` | 16px  | Cards y contenedores                 |
| `--va-r-btn`  | 14px  | Botones primarios e inputs           |
| `--va-r-chip` | 999px | Chips, pills, avatars, dots          |

Otros radios usados: `10px` (badge/icon-tile chico), `12px` (input/secondary), `18px` (hero card), `22–24px` (hero/donut card), `44px` (frame mobile externa).

### Spacing

Spacing base **4 / 8 / 12 / 14 / 16 / 18 / 20 / 22 / 24 / 28 / 32** px. Padding horizontal de pantalla mobile: `20px` (containers) y `24px` (headers). Padding horizontal desktop: `40px`.

### Sombras

```
/* Botón primario */         box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(55,138,221,0.18);
/* Card flotante */          box-shadow: 0 6px 20px rgba(20,25,30,0.06);
/* Frame de dispositivo */   box-shadow: 0 28px 60px rgba(20,25,30,0.12), 0 0 0 1px rgba(20,25,30,0.08);
/* Card hero login */        box-shadow: 0 20px 50px rgba(0,0,0,0.18);
```

### Tamaños mobile / desktop

- **Mobile**: viewport ancho `390px`, alto `844px` (iPhone 13/14 base). Status bar 50px, tab bar 84px (con 22px safe area).
- **Desktop**: contenido principal con max-width `1100px`, sidebar fijo de `230px`.

---

## Componentes reutilizables

> Los componentes están escritos en JSX en `screens/` y `shared.jsx`. Detalle de props mínimo abajo — en el codebase real, tipar con TS.

### `<Avatar name color size />`
Circular, iniciales en blanco. Tamaños usados: 32 / 36 / 38 / 40 / 44 / 48.
Color por defecto `#378ADD`. Variantes:
- `#1D9E75` para Administrativo (Carlos Torres)
- `#C0392B` para alumno con deuda

### `<Pill bg color>`
Inline badge — radius 999, padding `3px 9px`, font 11.5/600. Variantes:
- "Agregado": bg `#F4DDA5`, color `#7A5A14`
- Estado dot + label (verde / naranja) — ver tabla desktop

### `<PrimaryButton icon>`
Botón azul ancho completo, alto **56px**, radius 14, font 17/600. Sombra suave azul.

### `<SecondaryButton>`
Variante outline: alto 52, border `#E8EAED`, color `#1A1D21`.

### `<SearchField placeholder>`
Alto 48, padding `0 14px`, bg `#F1F2F4`, radius 12, ícono lupa `#8A9099`.

### `<PhoneFrame status>`
Marco mobile custom. Mantiene la apariencia neutral (no fuerza una marca iOS). Status bar y home indicator dibujados con SVG.

### `<TabBar active disabled>`
Tab bar inferior fija. 4 tabs: **Pedidos / Crédito / Caja / Más**. Para el rol Operadora, `caja` viene deshabilitada (opacidad 0.6, color `#C8CCD1`). Para Administrativo, `caja` es la activa.

### `<DesktopFrame active user>`
Sidebar de 230px con 7 ítems: Pedidos / Nuevo / Alumnos / Crédito / Productos / Caja / Planilla. El item activo lleva fondo `#E6F1FB` y texto `#1A66B5`.

### Iconografía
Estilo **lucide-react** (stroke 1.75, lineCap round, lineJoin round). Set usado en el set: `plus`, `check`, `search`, `back`, `chevron`, `user`, `users`, `wallet`, `cash`, `list`, `box`, `more`, `download`, `print`, `store`, `calendar`, `filter`, `bell`, `x`, `edit`. **En el codebase, usar `lucide-react` directo.**

---

## Pantallas

### 1. Login (mobile)
**Archivo:** `screens/LoginVariant.jsx`
**Quien la ve:** los 3 usuarios al ingresar.

- **Fondo**: gradiente `linear-gradient(160deg, #378ADD 0%, #2B6FB8 55%, #1F558F 100%)` con tres blobs decorativos (círculos opacos blancos / violeta / verde).
- **Header**: tile blanco redondeado de 52px con el icono `store` en azul + label "ViandApp" 22/700.
- **Hero copy**: "Buen día,<br />¿quién entra hoy?" 34/700, color blanco. Bajada en `rgba(255,255,255,0.78)`.
- **Card blanca**: bottom-anchored con `margin-bottom: 50px`, radius 24, padding `24px 22px`, sombra `0 20px 50px rgba(0,0,0,0.18)`. Dentro: dos inputs (`Usuario`, `Contraseña`) con fondo `#F7F8FA`, alto 52, radius 12. Toggle "Ver" en azul.
- **CTA**: `<PrimaryButton>Entrar</PrimaryButton>`.

No hay "Forgot password", autoregistro ni redes sociales — app interna.

### 2. Pedidos del día (mobile, vista principal)
**Archivo:** `screens/OrdersVariant.jsx`
**Quien la ve:** Operadora (al loguearse va directo acá).

- **Header**: greeting "Pedidos" + subtítulo "Lunes 16 de junio". A la derecha: ícono lupa en cuadrado gris 40px + avatar de Laura.
- **Stat strip** (grid 2fr 1fr 1fr): tarjeta azul clara con total (94), verde clara con pagados (81), amarilla clara con pendientes (13). Cada tarjeta tiene eyebrow uppercase chiquita y número grande 24–26/700.
- **CTA**: `<PrimaryButton icon={<plus/>}>Cargar pedido</PrimaryButton>`.
- **Chips de filtro** (scroll horizontal): Todos (activo, negro) / Pendientes / Pagados / Agregados. Cada chip tiene contador interno con fondo translúcido.
- **Sección "Pendientes de pago"** (dot naranja): tarjetas con avatar 36, nombre + meta, y botón inline "Cobrar" (32px alto, bg `#378ADD`, font 12.5/600). Las marcadas como agregadas hoy llevan fondo `#FAEEDA` y pill "Agregado".
- **Sección "Pagados"** (dot verde): lista densa con check verde a la izquierda. Última fila: link "Ver los 81 pagados".

Datos de ejemplo: Lucas Fernández, Mateo Romero, Julieta Ríos (pendientes); Tomás García, Sofía Martínez, Valentina López, Camila Suárez, Joaquín Pérez (pagados).

### 3. Nuevo pedido — Paso 3: ¿Qué menú? (mobile, wizard)
**Archivo:** `screens/NewOrderVariant.jsx`
**Quien la ve:** Operadora durante la carga.

- **Top bar**: botón back (cuadrado 40px bg `#F1F2F4`) + label "Paso 3 de 5" + "Cancelar".
- **Progress dots**: 5 barras finas de 4px, las primeras 3 en azul.
- **Student chip**: tarjeta `#F7F8FA` con avatar, nombre + grado, y "7 viandas a favor" en violeta. Link "Cambiar" a la derecha.
- **Pregunta**: "¿Qué menú<br />querés hoy?" 28/700.
- **Lista vertical de menús** (6 ítems, gap 10): cada uno es una card con tile ilustrativo 56×56 con color de fondo único y glifo emoji grande (🍗 🥩 🥗 🍔 🍝 🥪), título 16/700, descripción 13.5, y radio button a la derecha (26×26, check blanco sobre azul si seleccionado).
  - Menú A · Pollo al horno — bg `#FDF2E0`
  - **Menú B · Milanesa con puré — bg `#E6F1FB`, seleccionado (borde azul 2px, bg `#E6F1FB`)**
  - Menú C · Ensalada — bg `#E4F5EE`
  - Hamburguesa · con papas — bg `#FCEBEB`
  - Fideos · con queso — bg `#FAEEDA`
  - Sandwich · de suprema — bg `#ECEAF8`
- **Helper**: línea con ícono bell — "El menú del día lo definís en Productos → Menús."
- **CTA bottom-fixed**: `<PrimaryButton>Continuar</PrimaryButton>` a `bottom: 34px`.

Cada card tiene **mínimo 76px de alto** — cómodo para tocar con el pulgar.

### 4. Crédito a favor (mobile)
**Archivo:** `screens/Credit.jsx`
**Quien la ve:** Operadora (tab "Crédito").

- **Header**: "Crédito a favor" + "Saldos prepagos de las familias".
- **SearchField** "Buscar alumno".
- **CTA**: `<PrimaryButton>+ Cargar pago de un padre</PrimaryButton>`.
- **Lista de tarjetas**: avatar + nombre + grado. A la derecha:
  - Caso normal: "**N viandas**" en violeta `#534AB7` 16/700 + equivalente pesos chico abajo.
  - Caso deuda: card con fondo `#FCEBEB` border `#F2C9C9`, avatar rojo `#C0392B`, label "Debe plata", monto "−$19.000" en `#C0392B`.

Datos: Tomás García (7), Valentina Paz (15), Ana López (3), Nicolás Suárez (**deuda −$19.000**), Bruno Castro (12), Martina Acosta (5).

### 5. Caja del día (mobile, administrativo)
**Archivo:** `screens/CashVariant.jsx`
**Quien la ve:** Carlos Torres (Administrativo, avatar verde).

- **Header**: "Caja" + fecha. Avatar a la derecha.
- **Donut chart card** (gradiente `linear-gradient(160deg, #FAFAFB 0%, #F1F2F4 100%)`, radius 22):
  - Donut SVG 160×160, stroke 18, R=64. 4 segmentos:
    - Crédito `#534AB7` 64%
    - Transferencias `#378ADD` 23%
    - Efectivo `#1A1D21` 6%
    - Recargas `#1D9E75` 7%
  - Centro: "TOTAL" eyebrow + "$1.007k".
  - Leyenda a la derecha con dot 10×10 radius 3 + label + porcentaje.
- **Big number**: "Total del día" eyebrow + **$1.007.500** en 44/700 letter-spacing -1.6.
- **Sparkline card**: línea + área (gradiente azul a transparente) con 7 puntos (Lun a Hoy). Eyebrow "Últimos 7 días" + chip verde "+12%".
- **Mini stats**: Pedidos (94) en verde clara, Pendientes ($117k) en amarilla clara.
- **CTA bottom-fixed**: `<PrimaryButton icon={<download/>}>Descargar planilla</PrimaryButton>`.
- TabBar con `active="caja"`.

### 6. Alumnos (mobile)
**Archivo:** `screens/Students.jsx`

- Header "Alumnos" + "312 cargados en total".
- SearchField "Buscar por nombre o grado".
- CTA `+ Nuevo alumno`.
- Lista **agrupada por inicial** (A, B, C, J, L, M, N, R, S, T, V). Cada grupo: eyebrow uppercase 12/700 `#8A9099` letter-spacing 1.5. Items: avatar 38 (color rotando por la paleta), nombre 15.5/600, grado 13/500, chevron a la derecha `#C8CCD1`.
- Estado vacío (cuando aplique): "Todavía no hay alumnos cargados. Empezá agregando el primero."

### 7. Productos (mobile)
**Archivo:** `screens/Products.jsx`

- Header "Productos" + "Bebidas y extras del menú".
- CTA `+ Nuevo producto`.
- Tabs pill: "Activos (7)" (activo, bg negro) / "Pausados (1)".
- Lista de tarjetas: tile 44×44 radius 12 bg `#F7F8FA` con emoji del producto, nombre + detalle + precio, toggle 46×28 a la derecha (azul si activo, gris si pausado). Productos pausados con opacidad 0.55.
- Productos de ejemplo: Agua mineral 💧, Jugo de naranja 🍊, Gaseosa cola 🥤, Yogur bebible 🥛, Postre flan 🍮, Fruta de estación 🍎, Alfajor 🍫 (pausado), Galletitas dulces 🍪.

> **Nota**: los emojis funcionan en el prototipo pero en producción cada producto debería tener un thumbnail/imagen real subida por el admin. Mantener el tile 44×44 como contenedor.

### 8. Planilla imprimible (mobile)
**Archivo:** `screens/Print.jsx`

- Header "Planilla del día" + "Para imprimir y entregar en cocina".
- **Date picker row**: alto 56, border `#E8EAED` radius 14. Tile celeste `#E6F1FB` 36px con `calendar` icon + eyebrow "FECHA" + valor "Lunes 16 de junio" + chevron.
- **Preview paper** (Georgia serif para emular impresión): card blanca border `#E8EAED` radius 12 con sombra suave. Título centrado "Viandas — Lunes 16/06", subtítulo "94 pedidos".
  - Sección **Salón**: filas grado → count (1° A=12, 1° B=9, 2° A=14, 2° B=10, 3° A=13, 3° B=11). Separador dashed.
  - Sección **Cocina**: filas menú → count (Menú A=28, Menú B=31, Menú C=14, Hamburguesa=11, Fideos=6, Sandwich=4).
- **CTA bottom-fixed**: `<PrimaryButton icon={<print/>}>Imprimir planilla</PrimaryButton>`.

### Desktop · Pedidos del día
**Archivo:** `screens/DesktopOrders.jsx`

- Padding `32px 40px 60px`, max-width 1100.
- Header con greeting + acciones secundarias ("Imprimir planilla") y CTA primario ("Cargar pedido").
- **Stat grid** (4 columnas): Total 94 · Ya pagados 81 (verde) · Pendientes 13 ($117.000, naranja) · Agregados 6 (amarillo).
- Toolbar: SearchField + 2 filtros pill ("Todos los grados", "Todos los pagos").
- **Tabla** con grid `1.6fr 0.7fr 2fr 1fr 0.8fr 40px`: Alumno (avatar + nombre + pill Agregado si corresponde) / Grado / Menú / Pago (Crédito/Transferencia/Efectivo) / Estado (dot + texto) / overflow menu. Filas "Agregado" con fondo `#FDF6E6`.

### Desktop · Nuevo pedido (Paso 3)
**Archivo:** `screens/DesktopNewOrder.jsx`

- Padding `32px 40px 40px`, max-width 920.
- **Breadcrumb**: Pedidos > **Nuevo pedido**.
- **Stepper horizontal**: 5 pasos numerados (Alumno · Día · Menú · Pago · Confirmar). Done = verde con check, current = azul, future = gris. Conectores 2px.
- Student card más grande (avatar 48, button "Cambiar alumno" outline a la derecha).
- Pregunta H1 30/700.
- **Grid 3 columnas** de menú cards (mínimo 110px alto). Misma lógica de selección.
- Footer actions: "Atrás" (outline) + "Continuar" (azul, con chevron).

### Desktop · Caja del día
**Archivo:** `screens/DesktopCash.jsx`

- Header con "Caja del día" + acciones "Cambiar fecha" / "Descargar Excel".
- **Hero total card**: $1.007.500 en 64/700 letter-spacing -2.5 + chip "+12% vs. semana pasada" en verde. Debajo, **stacked bar 12px** con 3 segmentos (efectivo / transferencias / crédito) + leyenda con dots cuadrados.
- **Grid 1.5fr 1fr**:
  - Izquierda: card "Cómo se compone" con 4 filas (Efectivo · Transferencias · Crédito violeta · Recargas verde con nota "ingreso nuevo"). Cada fila: label · monto · porcentaje.
  - Derecha (stack): Pedidos cargados 94 · Pendientes de cobro $117.000 (naranja) · **Aviso violeta** con icon wallet: "El 64% del consumo fue con crédito prepago. Si querés cobrar más, recordales a las familias que recarguen."

---

## Estados y comportamientos

### Estados de pedido
- **Pendiente** — sin pago registrado. Dot naranja `#E0851F`. Botón inline "Cobrar" en mobile.
- **Pagado** — método registrado. Dot verde `#1D9E75`, check 28×28 en card mobile.
- **Agregado hoy** — pedido cargado fuera del horario habitual. Card con fondo `#FAEEDA` + pill "Agregado" `#F4DDA5/#7A5A14`. Se mantiene el estado pendiente/pagado encima.

### Métodos de pago
- **Efectivo** — texto neutro.
- **Transferencia** — texto neutro.
- **Crédito** — descuenta del saldo prepago del alumno. Color violeta `#534AB7` cuando se enfatiza.

### Estado de saldo (Crédito a favor)
- **Favor** — N viandas + equivalente pesos, color violeta.
- **Deuda** — card con fondo `#FCEBEB`, avatar rojo, monto negativo `−$X` en `#C0392B`.

### Roles y permisos
| Rol             | Avatar color | Tab activa al login | Tab deshabilitada |
|-----------------|--------------|---------------------|-------------------|
| Operadora       | `#378ADD`    | Pedidos             | Caja              |
| Salón           | (a definir)  | Pedidos             | Caja              |
| Administrativo  | `#1D9E75`    | Caja                | —                 |

### Microinteracciones esperadas (no implementadas en el prototipo)
- Toggle producto: transición 200ms ease del slider 22×22 entre los extremos del track 46×28.
- Selección de menú: borde 1→2px, swap de fondo blanco↔azul claro, fade-in del check 22×22.
- CTAs: scale(0.98) en active.
- Tap en card de pedido pendiente → bottom sheet "Cobrar" con métodos.
- Tap en alumno → detalle con historial.

---

## Lenguaje y copy

**Tono**: argentino conversacional, **voseo**, frases cortas, evitar tecnicismos.

| ✅ Usar                          | ❌ Evitar                          |
|---------------------------------|-----------------------------------|
| Cargar pedido                   | Crear pedido / Nuevo pedido       |
| Tiene 7 viandas a favor         | Saldo: $66.500                    |
| Debe plata                      | Saldo negativo                    |
| Cobrar                          | Procesar pago                     |
| Imprimir planilla               | Generar reporte                   |
| Descargar Excel                 | Exportar XLSX                     |
| Cargar pago de un padre         | Registrar transacción             |
| ¿Qué menú querés hoy?           | Seleccione una opción de menú     |
| Buen día, ¿quién entra hoy?     | Bienvenido. Por favor autentique  |

---

## State management (referencia mínima)

```
session: { userId, role: "operadora" | "salon" | "admin" }

orders: Order[] (por fecha)
  Order: { id, studentId, menu, addons, payment, paid, addedLate, notes, createdAt }

students: Student[]
  Student: { id, firstName, lastName, grade, division, creditViandas, creditAmount, balance }

products: Product[]
  Product: { id, name, detail, priceCents, active, kind: "drink" | "extra" | "menu" }

ledger: LedgerEntry[]
  LedgerEntry: { id, date, kind: "cash"|"transfer"|"credit-use"|"credit-load", amount }

dayCash: { date, total, byMethod, ordersCount, pending, ticketAvg }
```

---

## Archivos en este bundle

```
ViandApp.html                     ← entry point, carga todos los scripts
styles.css                        ← design tokens (CSS custom properties)
shared.jsx                        ← Avatar, Pill, PrimaryButton, SearchField,
                                    PhoneFrame, TabBar, DesktopFrame, icon set
app.jsx                           ← canvas con todas las secciones de artboards
design-canvas.jsx                 ← starter del lienzo (NO portar — solo presentación)
ios-frame.jsx                     ← starter no usado (descartable)

screens/
  LoginVariant.jsx                ← Pantalla 1 — Login (versión final)
  OrdersVariant.jsx               ← Pantalla 2 — Pedidos del día (versión final)
  NewOrderVariant.jsx             ← Pantalla 3 — Nuevo pedido (versión final)
  Credit.jsx                      ← Pantalla 4 — Crédito a favor
  CashVariant.jsx                 ← Pantalla 5 — Caja del día (versión final)
  Students.jsx                    ← Pantalla 6 — Alumnos
  Products.jsx                    ← Pantalla 7 — Productos
  Print.jsx                       ← Pantalla 8 — Planilla imprimible
  DesktopOrders.jsx               ← Desktop · Pedidos
  DesktopNewOrder.jsx             ← Desktop · Nuevo pedido
  DesktopCash.jsx                 ← Desktop · Caja
  Login.jsx / Orders.jsx /
    NewOrder.jsx / Cash.jsx       ← Alternativas v1 (versiones más sobrias, referencia)
```

### Cómo abrir el prototipo

1. Servir el folder con cualquier static server (`npx serve .` o similar).
2. Abrir `ViandApp.html` — el lienzo muestra todas las pantallas a la vez (drag para reordenar, doble click para focus).

### Qué portar y qué no

- **Portar**: tokens (`styles.css`), copy, layouts, comportamientos descritos arriba.
- **No portar literal**: el lienzo (`design-canvas.jsx`, `app.jsx`) — eso es presentación. Las screens funcionan como referencia de cada vista. El `PhoneFrame` es decorativo del prototipo; en el codebase real es solo el viewport del browser.

---

## Assets

- **Iconos**: estilo lucide-react (stroke 1.75). Usar la librería `lucide-react` directamente en el codebase — los nombres del set están en la sección Iconografía.
- **Fuente**: Inter — `next/font/google` o link a Google Fonts.
- **Emojis** (Productos / Nuevo pedido visual): provisorios. En producción reemplazar por thumbnails reales subidos por el admin (44×44 / 56×56 cropped, radius 12–14).
- **Logo**: el icono `store` de lucide dentro de un tile de color `#378ADD` o blanco según contexto. No hay logo definitivo todavía — coordinar con el cliente.

---

## Pendientes para el desarrollador

1. Confirmar framework de destino con el cliente.
2. Reemplazar emojis de Productos por sistema de upload de thumbnails.
3. Definir copy de errores (login fallido, sin conexión, deuda al cargar pedido).
4. Definir endpoints / data layer (este handoff describe shapes pero no la API real).
5. Verificar accesibilidad: contraste de texto sobre los fondos pasteles (sobre `#FCEBEB`, `#FAEEDA`, etc.), tamaño mínimo de hit target 44×44, foco visible en inputs.
6. Decidir si hay PWA / instalable (la app es mobile-first, probablemente sí).
