import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const profile = await requireRole(['padre'])

  // Si ya tiene hijos vinculados, no tiene sentido este onboarding.
  const supabase = createClient()
  const { count } = await supabase
    .from('familias_alumnos')
    .select('alumno_id', { count: 'exact', head: true })
    .eq('usuario_id', profile.id)
  if ((count ?? 0) > 0) redirect('/familia')

  return (
    <div className="p-5 max-w-md mx-auto space-y-5">
      <PageHeader
        title={`Hola, ${profile.nombre.split(' ')[0]}`}
        subtitle="Agregá a tus hijos para empezar a pedir viandas."
      />
      <OnboardingForm />
    </div>
  )
}
