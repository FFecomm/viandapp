import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeEscribirAlumnos } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { describirCredito } from '@/lib/format'
import { cn } from '@/lib/utils'

type SearchParams = { q?: string; grado?: string }

export default async function AlumnosPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await getProfile()
  const supabase = createClient()
  const q = (searchParams.q ?? '').trim()
  const grado = (searchParams.grado ?? '').trim()

  let query = supabase
    .from('alumnos')
    .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
    .eq('activo', true)
    .order('nombre_completo')
    .limit(200)

  if (q) query = query.ilike('nombre_completo', `%${q}%`)
  if (grado) query = query.eq('grado', grado)

  const { data: alumnos } = await query

  const puedeEscribir = profile && puedeEscribirAlumnos(profile.rol)

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Alumnos"
        subtitle={alumnos?.length ? `${alumnos.length} alumnos` : undefined}
        action={
          puedeEscribir ? (
            <Link href="/alumnos/nuevo" className={cn(buttonVariants(), 'h-11 px-4')}>
              <Plus className="size-4" />
              Nuevo alumno
            </Link>
          ) : null
        }
      />

      <form method="GET" className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre"
            className="h-11 pl-9 text-base"
          />
        </div>
        <Input
          type="text"
          name="grado"
          defaultValue={grado}
          placeholder="Grado"
          className="h-11 w-20 text-base text-center"
          inputMode="numeric"
        />
      </form>

      {!alumnos?.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {q || grado ? 'No encontramos alumnos con esos filtros.' : 'Todavía no hay alumnos cargados.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {alumnos.map((a) => {
            const debe = (a.credito_pesos ?? 0) < 0
            const tieneCredito = (a.viandas_credito ?? 0) > 0 || (a.credito_pesos ?? 0) > 0
            return (
              <li key={a.id}>
                <Link
                  href={`/alumnos/${a.id}`}
                  className={cn(
                    'block rounded-xl border p-4 hover:bg-muted/50 transition-colors',
                    debe && 'bg-destructive/5 border-destructive/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{a.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.grado}° {a.division}
                      </p>
                    </div>
                    {(debe || tieneCredito) && (
                      <Badge variant={debe ? 'destructive' : 'secondary'}>
                        {describirCredito(a.viandas_credito ?? 0, Number(a.credito_pesos ?? 0))}
                      </Badge>
                    )}
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
