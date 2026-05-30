import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { fechaHoyAR, formatFecha } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { ListaDelDia, type PedidoFila, type AlumnoBusqueda } from './lista-cliente'

type PedidoRow = {
  id: string
  alumno_id: string
  menu: PedidoFila['menu']
  observaciones: string | null
  estado: PedidoFila['estado']
}

type AlumnoRow = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
}

export default async function EncargadaHomePage() {
  await requireRole(['encargada', 'administrativo'])

  const supabase = createClient()
  const hoy = fechaHoyAR()

  const [{ data: pedidosData }, { data: alumnosData }, { data: config }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, alumno_id, menu, observaciones, estado')
      .eq('fecha', hoy),
    supabase
      .from('alumnos')
      .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
      .eq('activo', true)
      .order('nombre_completo'),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
  ])

  const alumnosPorId = new Map(
    ((alumnosData ?? []) as AlumnoRow[]).map((a) => [a.id, a]),
  )

  const filas: PedidoFila[] = ((pedidosData ?? []) as PedidoRow[])
    .map((p) => {
      const a = alumnosPorId.get(p.alumno_id)
      return {
        id: p.id,
        alumno_id: p.alumno_id,
        nombre_completo: a?.nombre_completo ?? '—',
        grado: a?.grado ?? '—',
        division: a?.division ?? '—',
        menu: p.menu,
        observaciones: p.observaciones,
        estado: p.estado,
      }
    })
    .sort((a, b) => {
      if (a.grado !== b.grado) return a.grado.localeCompare(b.grado, 'es', { numeric: true })
      if (a.division !== b.division) return a.division.localeCompare(b.division, 'es')
      return a.nombre_completo.localeCompare(b.nombre_completo, 'es')
    })

  const alumnos: AlumnoBusqueda[] = ((alumnosData ?? []) as AlumnoRow[]).map((a) => ({
    id: a.id,
    nombre_completo: a.nombre_completo,
    grado: a.grado,
    division: a.division,
    credito_pesos: Number(a.credito_pesos),
    viandas_credito: a.viandas_credito,
  }))

  const precioVianda = Number(config?.value ?? 9500)

  return (
    <div className="p-5 space-y-5">
      <PageHeader title="Lista del día" subtitle={formatFecha(hoy)} />
      <ListaDelDia pedidos={filas} alumnos={alumnos} precioVianda={precioVianda} />
    </div>
  )
}
