import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { CargarPagoForm } from './cargar-pago-form'

export default async function CargarPagoPage() {
  await requireRole(['administrativo'])

  const supabase = createClient()

  const [{ data: alumnos }, { data: config }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('id, nombre_completo, grado, division')
      .eq('activo', true)
      .order('nombre_completo')
      .limit(500),
    supabase
      .from('configuracion')
      .select('value')
      .eq('key', 'precio_vianda_actual')
      .maybeSingle(),
  ])

  return (
    <div className="p-5 space-y-5">
      <Link href="/credito" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Cargar pago</h1>
      <p className="text-sm text-muted-foreground">
        Registrá un pago de un padre. Si el alumno tiene deuda, primero se cancela; el resto queda como crédito a favor.
      </p>
      <CargarPagoForm
        alumnos={(alumnos ?? []) as { id: string; nombre_completo: string; grado: string; division: string }[]}
        precioVianda={Number(config?.value ?? 9500)}
      />
    </div>
  )
}
