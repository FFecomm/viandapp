import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { tieneMpConectado, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { PageHeader } from '@/components/page-header'
import { SaldoForm } from './saldo-form'

type MiAlumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
  relacion: string
}

export default async function SaldoPage() {
  await requireRole(['padre'])

  const supabase = createClient()
  const [{ data: alumnosData }, { data: config }] = await Promise.all([
    supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>(),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
  ])
  const alumnos = ((alumnosData ?? []) as MiAlumno[]).map((a) => ({
    id: a.id,
    nombre_completo: a.nombre_completo,
    grado: a.grado,
    division: a.division,
    viandas_credito: a.viandas_credito,
  }))
  const precioVianda = Number(config?.value ?? 9500)
  const mpDisponible = tieneMpOAuthConfigurado() && (await tieneMpConectado())

  return (
    <div className="p-5 space-y-5 max-w-md mx-auto">
      <Link href="/familia" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <PageHeader title="Cargar saldo" subtitle="Pagás una vez y pedís cuando quieras." />
      <SaldoForm alumnos={alumnos} precioVianda={precioVianda} mpDisponible={mpDisponible} />
      <div className="pt-2 text-center">
        <Link href="/familia/saldo/pagos" className="text-sm text-primary underline">
          Ver historial de pagos
        </Link>
      </div>
    </div>
  )
}
