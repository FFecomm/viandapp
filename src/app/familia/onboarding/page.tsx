import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { OnboardingForm } from './onboarding-form'

type SearchParams = { agregar?: string }

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(['padre'])

  const yaTieneHijos = await (async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('familias_alumnos')
      .select('alumno_id', { count: 'exact', head: true })
      .eq('usuario_id', profile.id)
    return (count ?? 0) > 0
  })()

  // Si ya tiene hijos vinculados y no vino acá explícitamente a agregar uno,
  // redirigir a la home (no tiene sentido el onboarding inicial).
  if (yaTieneHijos && searchParams.agregar !== '1') redirect('/familia')

  return (
    <div className="p-5 max-w-md mx-auto space-y-5">
      {yaTieneHijos ? (
        <Link href="/familia" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Volver
        </Link>
      ) : null}
      <PageHeader
        title={yaTieneHijos ? 'Sumar otro hijo' : `Hola, ${profile.nombre.split(' ')[0]}`}
        subtitle={
          yaTieneHijos
            ? 'Podés cargar un hijo nuevo o vincularte a uno que la otra mamá/papá ya cargó.'
            : 'Agregá a tus hijos para empezar a pedir viandas.'
        }
      />
      <OnboardingForm />
    </div>
  )
}
