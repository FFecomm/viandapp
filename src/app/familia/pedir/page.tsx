import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { tieneMpConectado, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { estadoVentanaPedidos, fechaHoyAR } from '@/lib/format'
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

  const [{ data: alumnosData }, { data: menus }, { data: opcionesData }, { data: config }, mpDisponible] = await Promise.all([
    supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>(),
    supabase.from('menu_ciclo').select('dia_ciclo, tipo_menu, descripcion').order('dia_ciclo'),
    supabase
      .from('menu_opciones')
      .select('id, menu, texto, orden')
      .eq('activa', true)
      .order('menu')
      .order('orden'),
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
  const ventana = estadoVentanaPedidos()

  return (
    <div className="p-5 space-y-4">
      <Link href="/familia" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Pedir vianda</h1>

      {!ventana.abierto ? (
        <div className="rounded-2xl border bg-orange-50 border-orange-200 p-6 space-y-3 text-center">
          <Clock className="size-12 text-orange-600 mx-auto" />
          <h2 className="text-lg font-semibold">Pedidos cerrados por hoy</h2>
          <p className="text-sm text-orange-900/80">{ventana.motivo}</p>
        </div>
      ) : (
        <WizardFamilia
          alumnos={alumnos as never}
          alumnoPreseleccionado={alumnoFiltro}
          menus={(menus ?? []) as never}
          opciones={(opcionesData ?? []) as never}
          fechasYaPedidas={fechasYaPedidas}
          precioVianda={precioVianda}
          mpDisponible={mpDisponible}
        />
      )}
    </div>
  )
}
