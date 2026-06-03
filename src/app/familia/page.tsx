import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describirCreditoConReservas, fechaHoyAR } from '@/lib/format'
import { PushToggle } from '@/components/push-toggle'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { FechaNacimientoFaltante } from './fecha-nacimiento-faltante'

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

  // Pedidos confirmados con fecha futura por alumno: "reservadas".
  // El saldo libre (viandas_credito) ya descuenta estos pedidos; las contamos
  // por separado para que el padre vea cuánto pago tiene "guardado" para
  // próximos días.
  const reservadasPorAlumno = new Map<string, number>()
  const idsAlumnos = alumnos.map((a) => a.id)
  if (idsAlumnos.length > 0) {
    const hoy = fechaHoyAR()
    const { data: futuros } = await supabase
      .from('pedidos')
      .select('alumno_id')
      .in('alumno_id', idsAlumnos)
      .eq('estado', 'confirmado')
      .gte('fecha', hoy)
    for (const p of (futuros ?? []) as { alumno_id: string }[]) {
      reservadasPorAlumno.set(p.alumno_id, (reservadasPorAlumno.get(p.alumno_id) ?? 0) + 1)
    }
  }

  // Alumnos sin fecha de nacimiento cargada (legacy o creados antes de la
  // migración 0015). Necesarias para que el otro padre pueda vincularse.
  const alumnosSinFecha: { id: string; nombre_completo: string }[] = []
  if (idsAlumnos.length > 0) {
    const { data: faltantes } = await supabase
      .from('alumnos')
      .select('id, nombre_completo, fecha_nacimiento')
      .in('id', idsAlumnos)
    for (const a of (faltantes ?? []) as { id: string; nombre_completo: string; fecha_nacimiento: string | null }[]) {
      if (!a.fecha_nacimiento) alumnosSinFecha.push({ id: a.id, nombre_completo: a.nombre_completo })
    }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-start justify-between gap-2">
        <PageHeader title={`Hola, ${primer}`} subtitle="Estos son tus hijos" />
        <PushToggle publicKey={vapidPublicKey} />
      </div>

      <PwaInstallPrompt />

      {alumnosSinFecha.length > 0 ? (
        <FechaNacimientoFaltante alumnos={alumnosSinFecha} />
      ) : null}

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Todavía no hay alumnos vinculados a tu cuenta.
          <br />Pediles a la administradora del colegio que te vincule.
        </div>
      ) : (
        <ul className="space-y-3">
          {alumnos.map((a) => {
            const debe = Number(a.credito_pesos) < 0
            const reservadas = reservadasPorAlumno.get(a.id) ?? 0
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
                    {describirCreditoConReservas(a.viandas_credito, reservadas, Number(a.credito_pesos))}
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

      <Link
        href="/familia/onboarding?agregar=1"
        className={cn(buttonVariants({ variant: 'outline' }), 'h-12 text-base w-full')}
      >
        <UserPlus className="size-4" />
        Sumar otro hijo
      </Link>
    </div>
  )
}
