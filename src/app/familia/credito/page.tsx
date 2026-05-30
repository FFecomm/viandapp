import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { describirCredito, formatPesos, formatFechaHora } from '@/lib/format'
import { cn } from '@/lib/utils'

type MiAlumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
  relacion: string
}

const ETIQUETA_TIPO: Record<string, string> = {
  carga: 'Pago recibido',
  consumo_vianda: 'Vianda consumida',
  consumo_producto: 'Producto consumido',
  deuda_vianda: 'Vianda a deber',
  deuda_producto: 'Producto a deber',
  cancelacion_deuda: 'Deuda cancelada',
  reverso_consumo_vianda: 'Reverso de vianda',
  reverso_consumo_producto: 'Reverso de producto',
  reverso_deuda_vianda: 'Reverso de deuda',
  reverso_deuda_producto: 'Reverso de deuda',
}

export default async function CreditoFamiliaPage() {
  await requireRole(['padre'])
  const supabase = createClient()

  const { data: misAlumnos } = await supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>()
  const alumnos = (misAlumnos ?? []) as MiAlumno[]

  // Traer movimientos de todos los alumnos en una sola query (RLS filtra)
  const ids = alumnos.map((a) => a.id)
  const { data: movimientos } = ids.length === 0 ? { data: [] } : await supabase
    .from('movimientos_credito')
    .select('id, alumno_id, tipo, monto, precio_vianda_al_momento, viandas_equivalentes, forma_pago, nota, created_at')
    .in('alumno_id', ids)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-5 space-y-6">
      <PageHeader title="Saldo" subtitle="Crédito a favor o deuda de cada hijo" />

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No hay alumnos vinculados.
        </div>
      ) : (
        <ul className="space-y-3">
          {alumnos.map((a) => {
            const debe = Number(a.credito_pesos) < 0
            return (
              <li key={a.id} className={cn(
                'rounded-2xl border p-5 space-y-2',
                debe && 'bg-destructive/5 border-destructive/30',
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.nombre_completo}</p>
                    <p className="text-sm text-muted-foreground">{a.grado}° {a.division}</p>
                  </div>
                  <Badge variant={debe ? 'destructive' : 'secondary'}>
                    {describirCredito(a.viandas_credito, Number(a.credito_pesos))}
                  </Badge>
                </div>
                {debe && (
                  <p className="text-xs text-muted-foreground">
                    Para cancelar la deuda transferí al colegio y la admin lo concilia.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {(movimientos?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Últimos movimientos</h2>
          <ul className="space-y-2">
            {(movimientos ?? []).map((m) => {
              const positivo = Number(m.monto) > 0
              const alumno = alumnos.find((a) => a.id === m.alumno_id)
              return (
                <li key={m.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{ETIQUETA_TIPO[m.tipo] ?? m.tipo}</span>
                    <span className={cn('font-semibold tabular-nums', positivo ? 'text-emerald-700' : 'text-red-700')}>
                      {positivo ? '+' : ''}{formatPesos(Number(m.monto))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alumno?.nombre_completo} · {formatFechaHora(m.created_at)}
                    {m.forma_pago ? ` · ${m.forma_pago}` : null}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
