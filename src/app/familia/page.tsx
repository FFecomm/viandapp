import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describirCredito } from '@/lib/format'
import { PushToggle } from '@/components/push-toggle'

type MiAlumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
  relacion: string
}

export default async function FamiliaHomePage() {
  const profile = await getProfile()
  const primer = profile?.nombre.split(' ')[0] ?? ''

  const supabase = createClient()
  const { data } = await supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>()
  const alumnos = (data ?? []) as MiAlumno[]

  // Si todavía no tiene hijos vinculados, mandar al onboarding.
  if (alumnos.length === 0) redirect('/familia/onboarding')

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-start justify-between gap-2">
        <PageHeader title={`Hola, ${primer}`} subtitle="Estos son tus hijos" />
        <PushToggle publicKey={vapidPublicKey} />
      </div>

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Todavía no hay alumnos vinculados a tu cuenta.
          <br />Pediles a la administradora del colegio que te vincule.
        </div>
      ) : (
        <ul className="space-y-3">
          {alumnos.map((a) => {
            const debe = Number(a.credito_pesos) < 0
            return (
              <li key={a.id} className={cn(
                'rounded-2xl border p-5 space-y-3',
                debe && 'bg-destructive/5 border-destructive/30',
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-medium">{a.nombre_completo}</p>
                    <p className="text-sm text-muted-foreground">{a.grado}° {a.division}</p>
                  </div>
                  <Badge variant={debe ? 'destructive' : 'secondary'}>
                    {describirCredito(a.viandas_credito, Number(a.credito_pesos))}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    href={`/familia/pedir?alumno=${a.id}`}
                    className={cn(buttonVariants(), 'h-12 text-base')}
                  >
                    <Plus className="size-4" />
                    Pedir vianda
                  </Link>
                  <Link
                    href="/familia/saldo"
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-12 text-base')}
                  >
                    Cargar saldo
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
