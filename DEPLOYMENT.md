# Deployment — ViandApp

Guía para llevar la app a producción. Asumimos cuenta de Supabase y cuenta de Vercel ya creadas.

## 1. Supabase

### Crear el proyecto

1. Entrar a https://supabase.com/dashboard → **New project**.
2. Elegir región Sao Paulo (la más cerca de Argentina) o Virginia East si no está disponible.
3. Anotar la URL y el `anon` key (Settings → API).
4. Anotar también el `service_role` key (necesario para la gestión de usuarios desde la app).

### Aplicar las migraciones

En **SQL Editor**, ejecutar en orden:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_rpcs.sql`
4. `supabase/migrations/0004_seed.sql`

Después de cada uno verificar que no hay errores en la consola.

### Habilitar Realtime

En **Database → Replication**, habilitar la publicación `supabase_realtime` para las tablas `pedidos` y `pedido_productos`.

### Crear el primer Administrativo

1. **Authentication → Users → Add user**.
2. Email + contraseña fuerte (≥ 8 caracteres). Marcar "Auto Confirm User".
3. Copiar el UUID generado.
4. En **SQL Editor**:
   ```sql
   INSERT INTO public.usuarios (id, nombre, rol)
   VALUES ('<UUID-PEGADO>', 'Nombre Apellido', 'administrativo');
   ```
5. Listo: ese mismo Administrativo va a poder crear desde la app a la Operadora y a la Encargada.

## 2. Vercel

### Importar el proyecto

1. **New Project** → conectar el repo de GitHub.
2. Framework preset: **Next.js** (autodetectado).
3. Root directory: `/`.

### Variables de entorno

| Nombre | Valor | Ámbito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` key | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (¡NO con prefijo `NEXT_PUBLIC_`!) | Production + Preview |

### Build

Deploy. Vercel corre `npm run build` automáticamente. Si falla, revisar logs.

## 3. Verificación post-deploy

### Smoke test rápido

1. Abrir la URL de producción.
2. Loguearse con el admin recién creado.
3. Ir a **Usuarios** → crear Operadora + Encargada.
4. En otra ventana incógnito, loguearse como Operadora.
5. **Alumnos** → crear "Tomás García" en 3°A.
6. Como Administrativo → **Crédito** → "Cargar pago" → Tomás García, $95.000, precio $9.500, transferencia. Verificar mensaje "10 viandas".
7. Como Operadora → **Pedidos** → "Cargar" → wizard de 6 pasos para Tomás. Pagar con crédito.
8. Verificar en /credito/<id-de-tomas> que ahora tiene 9 viandas.
9. Como Encargada en otra ventana → /pedidos del mismo día → el pedido aparece en tiempo real.
10. Como Administrativo → **Caja** → ver el movimiento de carga y el de consumo (no es ingreso del día).
11. Exportar Excel y CSV.

Si todo eso funciona, está en producción.

### Validación del FIFO (el caso crítico)

12. Como Administrativo → editar precio de vianda a $11.000 (botón en /credito).
13. Como Operadora → cargar otra vianda para Tomás con crédito.
14. Verificar en historial: el consumo se descontó a $9.500 (bucket viejo), no a $11.000.
15. /credito/<id-de-tomas> debería mostrar 8 viandas + bucket original.

## 4. PWA — instalación en celulares

Una vez en producción (HTTPS por Vercel):

1. Chrome Android: visitar la URL → menú **⋮** → **Agregar a pantalla de inicio** → la app aparece como ícono.
2. iOS Safari: **Compartir** → **Agregar a Inicio** (no usa el manifest pero funciona).

Iconos actuales son cuadrados azul sólido `#378ADD` (generados por `scripts/gen-icons.mjs`). Para reemplazarlos con un logo real, sobrescribir `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-icon.png`.

## 5. Mantenimiento

### Regenerar tipos de Supabase

Tras cambios al schema:
```bash
npx supabase gen types typescript --project-id <ID> > src/lib/supabase/types.ts
```

### Nuevas migraciones

NO editar archivos en `supabase/migrations/` ya aplicados. Crear `0005_*.sql`, `0006_*.sql`, etc.

### Backups

Supabase incluye backups automáticos:
- Plan Free: 1 día de retención
- Plan Pro: 7 días + PITR

## 6. Costos esperados

Para ~110 pedidos/día con 3 usuarios concurrentes:
- Supabase Free: alcanza (DB <500MB, transferencia <5GB/mes).
- Vercel Hobby: alcanza (uso personal).

Si en algún momento se llena la base, considerar Supabase Pro ($25/mes).
