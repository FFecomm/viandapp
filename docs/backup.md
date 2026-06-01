# Plan de backup · ViandApp

## Qué incluye Supabase por defecto

**Plan Free (el actual):**
- ❌ Sin point-in-time recovery (PITR)
- ❌ Sin backups automáticos disponibles para restaurar
- ⚠️ Si Supabase tiene un incidente catastrófico (poco frecuente pero posible) → pérdida total de datos

**Plan Pro (USD $25/mes):**
- ✅ PITR de 7 días incluido
- ✅ Backups diarios automáticos
- ✅ Soporte por email

**Recomendación:** mientras la app esté en producción real con familias y dinero, **subir al plan Pro**. El costo es despreciable vs. el costo de perder los datos.

---

## Plan B: Backup manual periódico (gratis)

Si por ahora seguís en Free, configurá un cron que exporte la DB y la guarde fuera de Supabase.

### Opción 1: GitHub Action semanal (recomendada)

Crear `.github/workflows/backup.yml`:

```yaml
name: Supabase backup
on:
  schedule:
    - cron: '0 3 * * 1'  # Lunes 3am UTC = lunes 00:00 ART
  workflow_dispatch:

jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: pg_dump
        env:
          PG_URI: ${{ secrets.SUPABASE_PG_URI }}
        run: |
          sudo apt-get install -y postgresql-client
          mkdir -p backups
          pg_dump --no-owner --no-acl "$PG_URI" \
            | gzip > backups/viandapp-$(date +%Y%m%d).sql.gz
      - uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backups/
          retention-days: 90
```

**Setup:**
1. En Supabase → Settings → Database → **Connection string** → modo **URI** → copiar.
2. En el repo de GitHub → Settings → Secrets → New secret `SUPABASE_PG_URI` → pegar.
3. Commit del workflow → corre cada lunes y guarda 90 días de backups.

**Para restaurar:**
1. Descargar el `.sql.gz` del Action.
2. `gunzip` + `psql nuevo_proyecto < dump.sql`

### Opción 2: Script local en tu compu

Si querés correrlo manualmente de vez en cuando:

```bash
# Descargar dump completo
pg_dump --no-owner --no-acl \
  "postgresql://postgres.qecpszqssdockwumybhc:vAS2OtKolVYrwXTx@aws-1-sa-east-1.pooler.supabase.com:5432/postgres" \
  | gzip > viandapp-$(date +%F).sql.gz
```

Guardalo en Drive, Dropbox o disco externo.

---

## Decisión sugerida

| Etapa | Backup |
|-------|--------|
| Hoy (pre-lanzamiento) | Backup manual semanal o ninguno |
| Lanzamiento con familias reales | **Plan Pro de Supabase** (USD $25/mes) + GitHub Action semanal como redundancia |
| Crecimiento (>500 familias) | Plan Pro + backups diarios manuales + monitoreo activo |
