## Qué es este proyecto

**ViandApp** es una app web para gestión de viandas escolares en Argentina. El cliente es **Croix SAS**.

Reemplaza WhatsApp + Excel + cuadernos. Las familias piden y pagan desde el celular. El equipo de Croix gestiona la operación diaria desde la misma app.

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Base de datos + Auth:** Supabase (PostgreSQL)
- **Pagos:** Mercado Pago (Checkout Pro + split de pagos)
- **Estilos:** Tailwind CSS
- **Notificaciones push:** Web Push API
- **PDF:** `@react-pdf/renderer`
- **Código:** todo en español — variables, funciones, comentarios y tablas de la base de datos

## Colores de marca

```
NAVY   #1A3A6B   headers, fondos oscuros
BLUE   #378ADD   acciones secundarias, links
GREEN  #1D9E75   confirmaciones, saldo disponible
ORANGE #E0851F   advertencias, alertas
VIOLET #534AB7   secciones admin
DARK   #1A1D21   texto principal
```

---

## Roles del sistema

Hay exactamente 4 roles. Cada uno tiene rutas y vistas separadas.

| Rol | Código | Descripción |
|-----|--------|-------------|
| Padre / tutor | `familia` | Pide y paga viandas para sus hijos |
| Encargada de salón | `encargada` | Gestiona el salón el día de entrega |
| Operadora | `operadora` | Toma pedidos, gestiona familias y menús |
| Administrativo | `admin` | Caja, reportes, acceso completo |

---

## Esquema de base de datos

```sql
create table perfiles (
  id uuid primary key references auth.users(id),
  nombre text not null,
  rol text not null check (rol in ('familia', 'encargada', 'operadora', 'admin')),
  telefono text,
  activo boolean default true,
  creado_en timestamptz default now()
);

create table alumnos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid references perfiles(id) not null,
  nombre text not null,
  grado text not null,
  curso text not null,
  observaciones text,
  activo boolean default true,
  creado_en timestamptz default now()
);

create table saldos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid references alumnos(id) unique not null,
  viandas_disponibles integer not null default 0,
  actualizado_en timestamptz default now()
);

create table menus (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  imagen_url text,
  activo boolean default true,
  orden integer default 0
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid references alumnos(id) not null,
  familia_id uuid references perfiles(id) not null,
  menu_id uuid references menus(id) not null,
  fecha_vianda date not null,
  estado text not null default 'confirmado'
    check (estado in ('confirmado', 'cancelado', 'entregado', 'ausente_acreditado')),
  observaciones text,
  registrado_por text default 'familia',
  creado_en timestamptz default now()
);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid references perfiles(id) not null,
  alumno_id uuid references alumnos(id) not null,
  viandas_compradas integer not null,
  monto_total numeric(10,2) not null,
  mp_preference_id text,
  mp_payment_id text,
  mp_status text default 'pendiente',
  creado_en timestamptz default now()
);

create table movimientos_saldo (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid references alumnos(id) not null,
  tipo text not null check (tipo in ('credito', 'debito', 'devolucion')),
  cantidad integer not null,
  descripcion text,
  pedido_id uuid references pedidos(id),
  pago_id uuid references pagos(id),
  creado_en timestamptz default now()
);

create table caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  categoria text not null,
  descripcion text,
  monto numeric(10,2) not null,
  medio_pago text check (medio_pago in ('mercado_pago', 'efectivo')),
  pedido_id uuid references pedidos(id),
  pago_id uuid references pagos(id),
  registrado_por uuid references perfiles(id),
  fecha date not null default current_date,
  creado_en timestamptz default now()
);
```

---

## Estructura de carpetas

```
viandapp/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── familia/
│   │   ├── page.tsx              → pantalla de inicio con hijos y saldo
│   │   ├── pedir/page.tsx        → wizard de pedido (3 pantallas, 1 componente)
│   │   ├── saldo/page.tsx        → cargar saldo con Mercado Pago
│   │   └── pedidos/page.tsx      → historial de pedidos con opción de cancelar
│   ├── encargada/
│   │   ├── page.tsx              → lista del día
│   │   └── cobro/page.tsx        → cobro en efectivo
│   ├── operadora/
│   │   ├── page.tsx              → pedidos del día en vivo
│   │   ├── pedido-manual/page.tsx
│   │   ├── familias/page.tsx
│   │   └── menus/page.tsx
│   ├── admin/
│   │   └── caja/page.tsx
│   └── api/
│       ├── pagos/crear-preferencia/route.ts
│       ├── pagos/webhook/route.ts
│       └── notificaciones/route.ts
├── components/
│   ├── ui/
│   ├── wizard-pedido/            → componente del wizard (ver detalle abajo)
│   ├── lista-salon/
│   └── caja/
├── lib/
│   ├── supabase/cliente.ts
│   ├── supabase/servidor.ts
│   ├── mercadopago.ts
│   └── saldo.ts
└── middleware.ts
```

---

## Pantallas por módulo

---

### MÓDULO: Familias

#### Pantalla: Login y registro

- Supabase Auth con email/password.
- Al registrarse: crear fila en `perfiles` con `rol = 'familia'`.
- Primer login sin hijos → redirige a pantalla de asociar hijos.
- Una vez que tiene hijos → redirige a `/familia`.

#### Pantalla: Asociar hijos (onboarding)

- Formulario: nombre, grado, curso del hijo.
- Botón "Agregar otro hijo" para agregar más antes de continuar.
- Al guardar: insertar en `alumnos` y crear fila en `saldos` con `viandas_disponibles = 0`.

#### Pantalla: Inicio (`/familia`)

- "Hola, [Nombre]"
- Una tarjeta por cada hijo: nombre, grado/curso, saldo en viandas.
- Si el saldo de un hijo es 0 → mostrar banner naranja: "Sin saldo — cargá viandas para poder pedir".
- Botón principal: "Pedir vianda" → lleva a `/familia/pedir`.
- Botón secundario: "Cargar saldo" → lleva a `/familia/saldo`.

---

#### Pantalla: Wizard de pedido (`/familia/pedir`)

> ⚠️ IMPORTANTE: Este wizard tiene **exactamente 3 pantallas**. No más, no menos.
> Es un solo componente `<WizardPedido>` que muestra una pantalla a la vez con un indicador de progreso "1 / 2 / 3".

```
PANTALLA 1 de 3 — ELEGIR DÍAS
───────────────────────────────────────────────────────
El usuario ve un calendario o lista con los próximos
10 días hábiles. Selecciona uno o más días con un tap.

- Los días donde ya tiene pedido aparecen deshabilitados.
- Debe seleccionar al menos 1 día para continuar.
- Botón "Siguiente →"

───────────────────────────────────────────────────────
PANTALLA 2 de 3 — ELEGIR MENÚ POR DÍA
───────────────────────────────────────────────────────
Por cada día que eligió en la pantalla anterior,
aparece una sección con:
  - El día como título (ej: "Lunes 3 de junio")
  - Un selector de menú entre los 14 menús disponibles
  - Un campo de texto opcional: "Observaciones" (ej: "sin queso")

Cada día tiene su propio selector independiente.
Cada día puede tener un menú distinto.

No hay sub-pasos. Todo en una sola pantalla con scroll.
Botón "← Atrás" y botón "Siguiente →"

───────────────────────────────────────────────────────
PANTALLA 3 de 3 — CONFIRMAR
───────────────────────────────────────────────────────
Resumen de lo que se va a pedir:
  - Tabla: Día | Menú | Observaciones
  - Saldo actual: X viandas
  - Viandas a usar: Y
  - Saldo que quedará: X - Y

Si X - Y < 0: deshabilitar el botón de confirmar y mostrar
  "No tenés saldo suficiente" + botón "Cargar saldo primero".

Si hay saldo suficiente: mostrar botón "Confirmar pedido".

───────────────────────────────────────────────────────
LÓGICA DEL SERVIDOR al presionar "Confirmar pedido"
(no es una pantalla del wizard, es la acción del botón)
───────────────────────────────────────────────────────
Server action que:
  a) Verifica el saldo actualizado (no confiar solo en el frontend)
  b) Inserta una fila en `pedidos` por cada día seleccionado
  c) Descuenta en `saldos.viandas_disponibles`
  d) Inserta en `movimientos_saldo` con tipo 'debito' por cada pedido
  e) Si todo OK → muestra pantalla de éxito (fuera del wizard)
  f) Si falla → muestra error sin perder el estado del wizard
```

---

#### Pantalla: Historial de pedidos (`/familia/pedidos`)

- Lista de pedidos del alumno ordenados por fecha descendente.
- Cada fila: fecha, menú, estado (confirmado / cancelado / entregado).
- Pedidos futuros con estado "confirmado" → mostrar botón "Cancelar".
- Al cancelar: pantalla de confirmación que dice qué vianda, qué día, y avisa que el saldo vuelve automáticamente.
- Lógica al confirmar cancelación: cambiar `estado = 'cancelado'`, sumar 1 en `saldos`, insertar `movimientos_saldo` con `tipo = 'devolucion'`.
- Regla: no se puede cancelar el mismo día de la vianda después de las 8:00 AM.

---

#### Pantalla: Cargar saldo (`/familia/saldo`)

- Selector de alumno si la familia tiene más de uno.
- Input numérico: "¿Cuántas viandas querés cargar?" (mínimo 1, sin tope máximo).
- Precio por vianda: `$PRECIO_VIANDA` (variable de entorno).
- Total calculado en tiempo real.
- Botón "Pagar con Mercado Pago".

**Flujo Mercado Pago:**
- Frontend llama a `POST /api/pagos/crear-preferencia` con `{ alumno_id, cantidad }`.
- El servidor crea la preferencia con:
  - `title`: "ViandApp — X viandas para [nombre alumno]"
  - `unit_price`: `PRECIO_VIANDA`
  - `quantity`: cantidad elegida
  - `marketplace_fee`: `COMISION_POR_VIANDA × cantidad` (esta comisión va a la cuenta del dueño de la plataforma)
  - `back_urls.success`, `back_urls.failure`, `back_urls.pending`
- El usuario es redirigido al Checkout Pro de Mercado Pago.
- Al volver a la app, se muestra el estado (aprobado / pendiente / rechazado).
- El webhook `POST /api/pagos/webhook` recibe la notificación de Mercado Pago y:
  - Actualiza `pagos.mp_status`
  - Si `status = 'approved'`: acredita viandas en `saldos`, inserta `movimientos_saldo` con `tipo = 'credito'`, inserta ingreso en `caja_movimientos`.

**Variables de entorno requeridas:**
```env
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
PRECIO_VIANDA=
COMISION_POR_VIANDA=400
NEXT_PUBLIC_BASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

### MÓDULO: Encargada de salón

#### Pantalla: Lista del día (`/encargada`)

- Fecha de hoy en grande.
- Todos los pedidos del día ordenados por: grado → curso → nombre.
- Columnas: nombre completo, grado, curso, menú, observaciones.
- Filtro por grado o curso.
- Botón "Descargar PDF" (genera la lista en PDF para imprimir).

**Acción: Marcar ausencia**
- Botón "Ausente" en cada fila.
- Modal de confirmación: "¿Seguro? La vianda se trasladará al día hábil siguiente."
- Al confirmar: `estado = 'ausente_acreditado'` en el pedido de hoy, insertar nuevo pedido para el día siguiente con el mismo menú.

**Acción: Dar vianda no pedida**
- Botón "Dar vianda sin pedido".
- Modal: buscador de alumno + selector de menú.
- Si el alumno tiene saldo: descuenta automáticamente.
- Si no tiene saldo: alerta "Sin saldo — cobrá en efectivo" + botón que lleva al flujo de cobro.
- Insertar en `pedidos` con `registrado_por = 'encargada'`.

**Acción: Cobrar en efectivo (`/encargada/cobro`)**
- Pantalla simple: nombre del alumno, monto (`$PRECIO_VIANDA`), botón "Registrar cobro".
- Al confirmar: insertar en `caja_movimientos` con `categoria = 'vianda_efectivo'`, `medio_pago = 'efectivo'`.

---

### MÓDULO: Operadora

#### Pantalla: Pedidos del día en vivo (`/operadora`)

- Contador total de viandas del día, actualizado en tiempo real (Supabase Realtime).
- Resumen por menú: "Milanesa: 24 pedidos", "Pollo: 18 pedidos", etc.
- Lista detallada de todos los pedidos: nombre, grado, menú, observaciones.
- Se actualiza automáticamente sin recargar la página.

#### Pantalla: Pedido manual (`/operadora/pedido-manual`)

- Usa el mismo componente `<WizardPedido>` que las familias (mismo wizard de 3 pantallas).
- Agrega un paso previo: selector para elegir el alumno de la lista.
- El pedido se inserta con `registrado_por = 'operadora'`.

#### Pantalla: Familias y saldos (`/operadora/familias`)

- Tabla: familia, cantidad de hijos, saldo total.
- Filtro por nombre o alumno.
- Al hacer clic en una familia: ver hijos, historial de pedidos e historial de recargas.

#### Pantalla: Menús (`/operadora/menus`)

- Lista de los 14 menús con nombre, descripción, imagen y estado (activo/inactivo).
- Editar nombre, descripción e imagen.
- Toggle activo/inactivo.
- Reordenar con drag and drop.

---

### MÓDULO: Caja diaria

#### Pantalla: Caja del día (`/admin/caja`)

- Fecha de hoy.
- Total cobrado por Mercado Pago (suma de `caja_movimientos` con `medio_pago = 'mercado_pago'` del día).
- Total cobrado en efectivo (suma con `medio_pago = 'efectivo'` del día).
- Total general.
- Lista de todos los movimientos del día: hora, descripción, medio de pago, monto.
- Botón "Exportar PDF".

---

## Reglas de negocio (no negociables)

- **Prepago estricto:** no se puede confirmar un pedido si `saldos.viandas_disponibles < cantidad_dias_elegidos`. Verificar server-side antes de insertar.
- **Nunca saldo negativo:** el saldo de un alumno nunca puede quedar en negativo.
- **Saldo por alumno:** cada hijo tiene su saldo independiente. No hay saldo familiar compartido.
- **El saldo se mide en viandas enteras**, no en pesos.
- **Mercado Pago siempre con split:** toda preferencia de pago debe incluir `marketplace_fee`. Sin excepción.
- **Ausencia no devuelve dinero:** mueve el pedido al día siguiente. No toca el dinero.
- **Cancelación devuelve saldo solo si es antes de las 8:00 AM del día de la vianda.**

---

## Middleware de rutas

```typescript
// middleware.ts — protección de rutas por rol
// /familia/*    → solo 'familia'
// /encargada/*  → solo 'encargada'
// /operadora/*  → 'operadora' y 'admin'
// /admin/*      → solo 'admin'
// /             → redirige según rol del usuario logueado
// sin sesión    → redirige a /login
```

---

## Notificaciones push

Implementar Web Push para:
- **Saldo ≤ 2 viandas** → notificar al padre.
- **Pedido confirmado** → notificar al padre al salir del wizard.
- **Pago acreditado** → notificar al padre cuando el webhook de MP aprueba.

---

## Fuera del alcance de Fase 1

No implementar nada de esto (son fases posteriores):
- Stock, insumos y recetas
- Carga de facturas por foto con IA/OCR
- Planilla automática de cocina
- Costeo por plato
- Pagos a proveedores vinculados a facturas
- Sueldos y nómina
- Caja general completa (en Fase 1 solo va la caja diaria de viandas)
- Multi-escuela

---

## Para arrancar

```bash
npx create-next-app@latest viandapp --typescript --tailwind --app
cd viandapp
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs mercadopago @react-pdf/renderer
```

Luego:
1. Crear proyecto en Supabase y copiar las claves en `.env.local`.
2. Ejecutar el schema SQL en el editor SQL de Supabase.
3. Arrancar por autenticación y middleware, luego pantalla por pantalla.
4. Cuando se modifique el schema: `npx supabase gen types typescript --project-id [ID]`.
