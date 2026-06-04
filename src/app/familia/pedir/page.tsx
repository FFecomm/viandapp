import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { tieneMpConectado, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { fechaHoyAR } from '@/lib/format'
import { WizardFamilia } from './wizard-familia'

type SearchParams = { alumno?: string }

type MiAlumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
  relacion: string
}

export default async function PedirPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['padre'])

  const supabase = createClient()
  const alumnoFiltro = searchParams.alumno ?? null

  const [{ data: alumnosData }, { data: menus }, { data: config }, mpDisponible] = await Promise.all([
    supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>(),
    supabase.from('menu_ciclo').select('dia_ciclo, tipo_menu, descripcion').order('dia_ciclo'),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
    (async () => tieneMpOAuthConfigurado() && (await tieneMpConectado()))(),
  ])

  const alumnos = ((alumnosData ?? []) as MiAlumno[])
  const alumnoElegidoId =
    alumnoFiltro && alumnos.find((a) => a.id === alumnoFiltro)
      ? alumnoFiltro
      : alumnos.length === 1
        ? alumnos[0].id
        : null

  // Bloquear días que ya tienen pedido confirmado O pendiente de pago (otro
  // padre del alumno está pagando ahora). pendiente_pago se libera tras 30 min.
  let fechasYaPedidas: string[] = []
  if (alumnoElegidoId) {
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('fecha')
      .eq('alumno_id', alumnoElegidoId)
      .in('estado', ['confirmado', 'pendiente_pago'])
      .gte('fecha', fechaHoyAR())
    fechasYaPedidas = (pedidos ?? []).map((p: { fecha: string }) => p.fecha)
  }

  const precioVianda = Number(config?.value ?? 0)

  return (
    <div className="p-5 space-y-4">
      <Link href="/familia" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Pedir vianda</h1>
      <WizardFamilia
        alumnos={alumnos as never}
        alumnoPreseleccionado={alumnoFiltro}
        menus={(menus ?? []) as never}
        fechasYaPedidas={fechasYaPedidas}
        precioVianda={precioVianda}
        mpDisponible={mpDisponible}
      />
    </div>
  )
}
