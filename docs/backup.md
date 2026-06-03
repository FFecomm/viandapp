# Backup de la base de datos

ViandApp corre un GitHub Action diario que hace `pg_dump` de la base de Supabase y la guarda como artifact (retención 30 días).

El workflow está en [.github/workflows/backup-supabase.yml](../.github/workflows/backup-supabase.yml).

## Cómo activarlo

1. **Conseguir la connection string del pooler.**
   - Entrar a [Supabase → Project Settings → Database → Connection string](https://supabase.com/dashboard/project/qecpszqssdockwumybhc/settings/database)
   - Elegir el tab **Session pooler** (no el direct: el direct no soporta IPv4 desde GitHub Actions).
   - La URI tiene esta forma:
     ```
     postgresql://postgres.qecpszqssdockwumybhc:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
     ```
   - Reemplazar `<DB_PASSWORD>` por la contraseña de la base.

2. **Crear el secret en GitHub.**
   - Ir a `github.com/FFecomm/viandapp/settings/secrets/actions`
   - Apretar **New repository secret**
   - Name: `SUPABASE_DB_URL`
   - Value: la URI completa del paso anterior
   - Save

3. **(Opcional) Crear el secret para notificación de fallo.**
   - Mismo lugar, name: `ERROR_WEBHOOK_URL`
   - Value: webhook de Slack o Discord
   - Si no se setea, el action falla en silencio (igual queda registrado en la pestaña Actions).

4. **Probar el action manualmente.**
   - Ir a `github.com/FFecomm/viandapp/actions/workflows/backup-supabase.yml`
   - Apretar **Run workflow** → **Run workflow**.
   - Esperar 1-2 min. Si todo OK, en la corrida aparece el artifact descargable `viandapp_YYYY-MM-DD_HHMM.sql.gz`.

## Cómo restaurar

Si pasa algo y hay que volver a un backup:

```bash
# Descargar el artifact desde GitHub Actions
gunzip viandapp_2026-06-03_0400.sql.gz

# Aplicar al proyecto de STAGING primero (NUNCA directo a prod sin probar)
psql "postgresql://postgres.STAGING:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres" < viandapp_2026-06-03_0400.sql
```

El dump usa `--clean --if-exists` para ser idempotente: borra y recrea las tablas. Si querés restaurar SIN borrar lo existente, hay que editar el SQL manualmente o usar `pg_restore` con flags distintos.

## Limitaciones

- **Solo retiene 30 días en GitHub.** Si necesitás histórico más largo, descargar manualmente los artifacts mensuales y guardar en cold storage.
- **No incluye Supabase Storage (buckets de archivos).** Hoy no usamos Storage, pero si en el futuro guardamos imágenes (logos, fotos de menús, etc.), hay que sumar `supabase storage download` al workflow.
- **El password de la DB se rota manualmente.** Si lo cambiás en Supabase, hay que actualizar el secret `SUPABASE_DB_URL`.

## Alternativa pagada (cuando la operación crezca)

| Plan Supabase | Costo | Qué te da |
|---|---|---|
| Pro | USD 25/mes | Daily backups automáticos, retención 7 días, PITR opcional, soporte por email |
| Team | USD 599/mes | Retención 14 días + PITR 7 días |

Para el MVP el GitHub Action alcanza. Cuando estés con >50 familias y dinero real, conviene Pro como red de seguridad adicional.
