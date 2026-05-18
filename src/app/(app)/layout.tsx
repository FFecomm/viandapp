import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'
import { TabBar } from '@/components/tab-bar'

/**
 * Layout autenticado. Garantiza que existe un perfil en `usuarios`.
 * Si la cuenta de auth no tiene perfil, cierra sesión.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  if (!profile) {
    await logout()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <TabBar rol={profile.rol} nombre={profile.nombre} />
    </div>
  )
}
