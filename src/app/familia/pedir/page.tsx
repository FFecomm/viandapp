import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
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

  const [{ data: alumnosData }, { data: menus }] = await Promise.all([
    supabase.rpc('fn_mis_alumnos').returns<MiAlumno[]>(),
    supabase.from('menu_ciclo').select('dia_ciclo, tipo_menu, descripcion').order('dia_ciclo'),
  ])

  const alumnos = ((alumnosData ?? []) as MiAlumno[])
  const alumnoElegidoId =
    alumnoFiltro && alumnos.find((a) => a.id === alumnoFiltro)
      ? alumnoFiltro
      : alumnos.length === 1
        ? alumnos[0].id
        : null

  // Pedidos confirmados con fecha futura: bloquean los días en el wizard
  // (no se puede pedir dos veces el mismo día) y se cuentan como "reservadas"
  // para que el padre vea cuánto saldo ya tiene asignado a próximos días.
  let fechasYaPedidas: string[] = []
  let reservadas = 0
  if (alumnoElegidoId) {
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('fecha')
      .eq('alumno_id', alumnoElegidoId)
      .eq('estado', 'confirmado')
      .gte('fecha', fechaHoyAR())
    fechasYaPedidas = (pedidos ?? []).map((p: { fecha: string }) => p.fecha)
    reservadas = fechasYaPedidas.length
  }

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
        reservadas={reservadas}
      />
    </div>
  )
}
