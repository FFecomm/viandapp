import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeCargarCredito } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describirCredito, formatPesos } from '@/lib/format'
import { PrecioViandaForm } from './precio-vianda-form'

type SearchParams = { q?: string }

export default async function CreditoPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await getProfile()
  const supabase = createClient()
  const q = (searchParams.q ?? '').trim()

  let query = supabase
    .from('alumnos')
    .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
    .eq('activo', true)
    .or('credito_pesos.neq.0,viandas_credito.gt.0')
    .order('credito_pesos', { ascending: false })
    .limit(200)

  if (q) query = query.ilike('nombre_completo', `%${q}%`)
  const { data: alumnos } = await query

  const { data: config } = await supabase
    .from('configuracion')
    .select('value')
    .eq('key', 'precio_vianda_actual')
    .maybeSingle()
  const precioVianda = Number(config?.value ?? 9500)

  const puedeCargar = !!profile && puedeCargarCredito(profile.rol)

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Crédito a favor"
        subtitle="Padres que pagaron por adelantado"
        action={
          puedeCargar ? (
            <Link href="/credito/cargar" className={cn(buttonVariants(), 'h-11 px-4')}>
              <Plus className="size-4" />
              Cargar pago
            </Link>
          ) : null
        }
      />

      {puedeCargar ? <PrecioViandaForm precio={precioVianda} /> : (
        <div className="rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Precio actual de vianda: </span>
          <span className="font-medium">{formatPesos(precioVianda)}</span>
        </div>
      )}

      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre" className="h-11 pl-9 text-base" />
      </form>

      {!alumnos?.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {q ? 'No encontramos alumnos.' : 'Nadie tiene crédito ni deuda por ahora.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {alumnos.map((a) => {
            const debe = Number(a.credito_pesos ?? 0) < 0
            return (
              <li key={a.id}>
                <Link
                  href={`/credito/${a.id}`}
                  className={cn(
                    'block rounded-xl border p-4 hover:bg-muted/50 transition-colors',
                    debe && 'bg-destructive/5 border-destructive/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">{a.grado}° {a.division}</p>
                    </div>
                    <Badge variant={debe ? 'destructive' : 'secondary'} className="shrink-0">
                      {describirCredito(a.viandas_credito ?? 0, Number(a.credito_pesos ?? 0))}
                    </Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
