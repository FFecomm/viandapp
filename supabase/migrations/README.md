# Supabase — migraciones

Las migraciones SQL viven acá, numeradas y ordenadas. Aplicar en orden estricto.

## Cómo aplicarlas

**Opción 1 — Supabase Studio (más simple):**
1. Abrir https://supabase.com/dashboard/project/<id>/sql/new
2. Pegar el contenido del archivo `.sql`
3. Run
4. Repetir para el siguiente archivo

**Opción 2 — Supabase CLI:**
```bash
supabase db push
```

## Orden de aplicación

| Archivo | Contenido |
|---|---|
| `0001_schema.sql` | Tablas, índices, constraints, trigger updated_at |
| `0002_rls.sql`    | RLS policies + función `auth_rol()` |
| `0003_rpcs.sql`   | RPCs: FIFO crédito, cargar/borrar pedido, crear perfil |
| `0004_seed.sql`   | Datos iniciales (precio vianda, productos base, 42 menús) |

## Bootstrap del primer Administrativo

Después de aplicar las migraciones:

1. En Supabase Dashboard → **Authentication → Users → Add user**.
2. Email + password del primer Administrativo. Marcar "Auto Confirm User".
3. Copiar el UUID del usuario creado.
4. En SQL Editor, ejecutar:
   ```sql
   INSERT INTO public.usuarios (id, nombre, rol)
   VALUES ('<UUID>', 'Nombre del admin', 'administrativo');
   ```
5. Login en la app con ese email/password. Desde el módulo "Usuarios", crear a Operadora y Encargada.

## Regenerar tipos TypeScript

Cuando cambies el schema, regenerar `src/lib/supabase/types.ts`:
```bash
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

## ⚠️ No editar migraciones aplicadas

Para cambios al schema, crear una nueva migración (`0005_*.sql`).
