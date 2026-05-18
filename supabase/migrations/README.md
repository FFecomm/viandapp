# Supabase — migraciones

Las migraciones SQL viven acá, numeradas y ordenadas. Se aplican en orden estricto.

## Cómo aplicarlas

**Opción 1 — Supabase Studio (más simple):**
1. Abrir https://supabase.com/dashboard/project/<id>/sql/new
2. Pegar el contenido del archivo `.sql`
3. Run

**Opción 2 — Supabase CLI:**
```bash
supabase db push
```

## Orden de aplicación

| Archivo | Descripción |
|---|---|
| `0001_schema.sql` | Tablas, índices, constraints |
| `0002_rls.sql` | Row Level Security policies + función `auth_rol()` |
| `0003_rpcs.sql` | Funciones (FIFO de crédito, reversión de pedidos, etc.) |
| `0004_seed.sql` | Datos iniciales (menús del ciclo, productos base, configuración) |

⚠️ No editar migraciones aplicadas. Crear una nueva (`0005_*.sql`) para cambios.
