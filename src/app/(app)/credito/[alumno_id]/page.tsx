import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeCargarCredito } from '@/lib/auth/roles'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { buttonVariants } from '@/components/ui/button'
import { describirCredito, formatPesos, formatFechaHora } from '@/lib/format'
import { cn } from '@/lib/utils'

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

export default async function CreditoHistorialPage({ params }: { params: { alumno_id: string } }) {
  const profile = await getProfile()
  const supabase = createClient()

  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
    .eq('id', params.alumno_id)
    .maybeSingle()
  if (!alumno) notFound()

  const { data: movimientos } = await supabase
    .from('movimientos_credito')
    .select('id, tipo, monto, precio_vianda_al_momento, viandas_equivalentes, forma_pago, nota, created_at')
    .eq('alumno_id', params.alumno_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: buckets } = await supabase
    .from('creditos_buckets')
    .select('id, precio_vianda, pesos_restantes, agotado, created_at')
    .eq('alumno_id', params.alumno_id)
    .eq('agotado', false)
    .order('created_at')

  const debe = Number(alumno.credito_pesos ?? 0) < 0
  const puedeCargar = !!profile && puedeCargarCredito(profile.rol)

  return (
    <div className="p-5 space-y-6">
      <Link href="/credito" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{alumno.nombre_completo}</h1>
          <p className="text-sm text-muted-foreground">{alumno.grado}° {alumno.division}</p>
        </div>
        <Badge variant={debe ? 'destructive' : 'secondary'}>
          {describirCredito(alumno.viandas_credito ?? 0, Number(alumno.credito_pesos ?? 0))}
        </Badge>
      </div>

      {puedeCargar ? (
        <Link href="/credito/cargar" className={cn(buttonVariants(), 'h-11 w-full')}>
          Cargar otro pago para este alumno
        </Link>
      ) : null}

      {buckets?.length ? (
        <section className="space-y-2">
          <h2 className="font-medium text-sm">Saldos disponibles (FIFO)</h2>
          <ul className="space-y-1.5">
            {buckets.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm rounded-lg border p-3">
                <span className="text-muted-foreground">
                  Cargado el {formatFechaHora(b.created_at)} · a {formatPesos(b.precio_vianda)}/vianda
                </span>
                <span className="font-medium">
                  {formatPesos(b.pesos_restantes)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium">Historial</h2>
        {!movimientos?.length ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <ul className="space-y-2">
            {movimientos.map((m) => {
              const positivo = Number(m.monto) > 0
              return (
                <li key={m.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{ETIQUETA_TIPO[m.tipo] ?? m.tipo}</span>
                    <span className={cn('font-semibold tabular-nums', positivo ? 'text-emerald-700' : 'text-red-700')}>
                      {positivo ? '+' : ''}{formatPesos(m.monto)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatFechaHora(m.created_at)}
                    {m.viandas_equivalentes ? ` · ${m.viandas_equivalentes} viandas a ${formatPesos(m.precio_vianda_al_momento)}` : null}
                    {m.forma_pago ? ` · ${m.forma_pago}` : null}
                  </p>
                  {m.nota ? <p className="text-xs text-muted-foreground italic mt-0.5">{m.nota}</p> : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
