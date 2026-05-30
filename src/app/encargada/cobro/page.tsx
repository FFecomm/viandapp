import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { FormCobro } from './form-cobro'
import type { TipoMenu } from '@/lib/supabase/types'

type SearchParams = { alumno?: string; menu?: string }

type AlumnoRow = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
}

const MENUS_LABEL: Record<TipoMenu, string> = {
  A: 'Menú A',
  B: 'Menú B',
  C: 'Menú C',
  Hamburguesa: 'Hamburguesa',
  Fideos: 'Fideos',
  Sandwich: 'Sándwich',
}

export default async function CobroPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['encargada', 'administrativo'])

  const alumnoId = searchParams.alumno ?? ''
  const menuPreseleccionado = (searchParams.menu ?? '') as TipoMenu | ''

  const supabase = createClient()
  const [{ data: alumno }, { data: config }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
      .eq('id', alumnoId)
      .maybeSingle(),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
  ])

  const precioVianda = Number(config?.value ?? 9500)
  const a = alumno as AlumnoRow | null

  return (
    <div className="p-5 space-y-5 max-w-md">
      <Link href="/encargada" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <PageHeader title="Cobrar en efectivo" />

      {!a ? (
        <div className="rounded-xl border p-5 text-sm text-muted-foreground">
          No encontré al alumno. Volvé a la lista del día y buscalo desde ahí.
        </div>
      ) : (
        <div className="rounded-2xl border p-5 space-y-4">
          <div>
            <p className="font-medium text-lg">{a.nombre_completo}</p>
            <p className="text-sm text-muted-foreground">
              {a.grado}° {a.division}
            </p>
            {menuPreseleccionado ? (
              <p className="text-sm mt-2">
                Menú: <span className="font-medium">{MENUS_LABEL[menuPreseleccionado as TipoMenu]}</span>
              </p>
            ) : null}
          </div>
          <FormCobro
            alumnoId={a.id}
            menuPreseleccionado={menuPreseleccionado ? (menuPreseleccionado as TipoMenu) : null}
            precioVianda={precioVianda}
          />
        </div>
      )}
    </div>
  )
}
