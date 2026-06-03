import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, User, Mail, Shield, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { rutaInicio } from '@/lib/auth/roles'
import { CuentaForms } from './cuenta-forms'

const ROL_LABEL: Record<string, string> = {
  padre: 'Familia',
  encargada: 'Encargada de salón',
  operadora: 'Operadora',
  administrativo: 'Administrativo',
}

export default async function CuentaPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inicio = rutaInicio(profile.rol)

  const miembroDesde = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-md mx-auto p-5 space-y-5">
        <Link href={inicio} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Volver
        </Link>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground">Gestioná tus datos de acceso y seguridad.</p>
        </header>

        <section className="rounded-2xl border bg-card p-4 space-y-3">
          <Dato icon={User} label="Nombre" valor={profile.nombre} />
          <Dato icon={Mail} label="Email" valor={user.email ?? '—'} />
          <Dato icon={Shield} label="Rol" valor={ROL_LABEL[profile.rol] ?? profile.rol} />
          <Dato icon={Calendar} label="Miembro desde" valor={miembroDesde} />
        </section>

        <CuentaForms esPadre={profile.rol === 'padre'} />
      </div>
    </div>
  )
}

function Dato({
  icon: Icon,
  label,
  valor,
}: {
  icon: typeof User
  label: string
  valor: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="font-medium break-all">{valor}</span>
    </div>
  )
}
